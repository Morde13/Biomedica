import hashlib
import hmac
import os
import re
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, joinedload, selectinload, sessionmaker

from models import (
    Base,
    CatalogoFuenteAlimentacion,
    CatalogoTecnologia,
    ClasificacionRiesgo,
    ClasificacionUso,
    ComponenteEquipo,
    DocumentoEquipo,
    Equipo,
    EspecificacionTecnica,
    ImagenEquipo,
    Laboratorio,
    PrestamoEquipo,
    Proveedor,
    RegistroCalibracion,
    RegistroMantenimiento,
    Rol,
    Sede,
    TipoAdquisicion,
    TipoDocumento,
    TipoMantenimiento,
    TipoMovilidad,
    Usuario,
)
from schemas import (
    CalibracionCreate,
    CatalogoSimpleCreate,
    ComponenteEquipoBase,
    DocumentoEquipoBase,
    EquipoCreate,
    ImagenEquipoBase,
    LaboratorioCreate,
    LoginRequest,
    MantenimientoCreate,
    PrestamoCreate,
    PrestamoEstadoUpdate,
    ProveedorCreate,
    RolCreate,
    SedeCreate,
    UsuarioCreate,
    UsuarioEstadoUpdate,
)

app = FastAPI(title="Sistema de Inventario de Laboratorio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Configurar la URL de conexión a MariaDB/MySQL (en el mismo servidor: 127.0.0.1)
# Reemplaza 'usuario', 'contraseña', '127.0.0.1' y 'nombre_bd' con tus datos reales o usa la variable de entorno DATABASE_URL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://biomedica:Biomedica2026%40.@172.16.151.55:3306/Inventario_Biomedica",
)

# 2. Crear el motor de base de datos
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# =======================================================
# CONFIGURACIÓN DE CARPETAS DE ARCHIVOS Y MULTIMEDIA
# =======================================================
BASE_DIR = Path(__file__).resolve().parent
STORAGE_DIRS = {
    "datasheets": BASE_DIR / "datasheets",
    "imagenes": BASE_DIR / "imagenes",
    "calibraciones": BASE_DIR / "calibraciones",
    "mantenimientos": BASE_DIR / "mantenimientos",
    "img": BASE_DIR / "img",
}

for folder in STORAGE_DIRS.values():
    folder.mkdir(parents=True, exist_ok=True)

app.mount("/archivos/datasheets", StaticFiles(directory=str(STORAGE_DIRS["datasheets"])), name="datasheets")
app.mount("/archivos/imagenes", StaticFiles(directory=str(STORAGE_DIRS["imagenes"])), name="imagenes")
app.mount("/archivos/calibraciones", StaticFiles(directory=str(STORAGE_DIRS["calibraciones"])), name="calibraciones")
app.mount("/archivos/mantenimientos", StaticFiles(directory=str(STORAGE_DIRS["mantenimientos"])), name="mantenimientos")
app.mount("/archivos/img", StaticFiles(directory=str(STORAGE_DIRS["img"])), name="img")
app.mount("/img", StaticFiles(directory=str(STORAGE_DIRS["img"])), name="img_root")

TABLAS_ESQUEMA_19 = [
    "Sedes",
    "Laboratorios",
    "Tipos_Movilidad",
    "Tipos_Adquisicion",
    "Clasificacion_Riesgos",
    "Clasificacion_Usos",
    "Tipos_Documentos",
    "Catalogo_Fuente_Alimentacion",
    "Catalogo_Tecnologia",
    "Tipos_Mantenimiento",
    "Proveedores",
    "Equipos",
    "Especificaciones_Tecnicas",
    "Documentos_Equipos",
    "Imagenes_Equipos",
    "Componentes_Equipos",
    "Registro_Mantenimientos",
    "Registro_Calibraciones",
    "Prestamos_Equipos",
]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =======================================================
# ENDPOINT ORIGINAL DE INSPECCIÓN Y ESTADO DE CONEXIÓN
# =======================================================
@app.get("/tablas")
async def obtener_tablas():
    try:
        # 3. El Inspector de SQLAlchemy lee la estructura interna de la base de datos
        inspector = inspect(engine)
        nombres_tablas = inspector.get_table_names()

        return {
            "estado": "Conexión exitosa a la base de datos",
            "total_tablas": len(nombres_tablas),
            "tablas": nombres_tablas,
        }
    except Exception as e:
        # Si la contraseña o el puerto están mal, te mostrará el error exacto aquí
        return {"estado": "Error de conexión", "detalle": str(e)}


_ESTADO_CACHE = {"timestamp": 0.0, "data": None}


def sincronizar_ajustes_esquema_nuevo(inspector, existentes_lower: dict):
    """
    Si la base de datos conectada ya tiene el esquema nuevo de las 19 tablas,
    asegura que existan:
      1. La columna 'valor_adquisicion' en Equipos (agregada durante el diseño).
      2. Las tablas Roles y Usuarios junto con un usuario Administrador inicial si están vacías.
    """
    try:
        eq_table_name = existentes_lower.get("equipos", "Equipos")
        cols_eq = {c["name"].lower() for c in inspector.get_columns(eq_table_name)}
        if "id_equipo" in cols_eq and "valor_adquisicion" not in cols_eq:
            with engine.begin() as conn:
                conn.execute(
                    text(f"ALTER TABLE `{eq_table_name}` ADD COLUMN valor_adquisicion DECIMAL(12, 2) NULL")
                )

        # Crear tablas Roles y Usuarios si aún no se habían corrido en el servidor
        Rol.__table__.create(bind=engine, checkfirst=True)
        Usuario.__table__.create(bind=engine, checkfirst=True)

        # Sembrar roles base y admin inicial solo si la tabla Roles/Usuarios está vacía
        with SessionLocal() as db:
            if db.query(Rol).count() == 0:
                r_admin = Rol(
                    nombre_rol="Administrador",
                    descripcion="Control total del sistema y gestión de perfiles",
                )
                r_lab = Rol(
                    nombre_rol="Laboratorista",
                    descripcion="Gestión operativa de inventario, mantenimientos y préstamos",
                )
                r_est = Rol(
                    nombre_rol="Estudiante",
                    descripcion="Acceso únicamente a vista de estudiante",
                )
                db.add_all([r_admin, r_lab, r_est])
                db.commit()
                db.refresh(r_admin)

                if db.query(Usuario).count() == 0:
                    db.add(
                        Usuario(
                            nombre_completo="Administrador Principal",
                            correo_electronico="admin",
                            contrasena_hash=encriptar_contrasena("admin2026@"),
                            id_rol=r_admin.id_rol,
                            estado="Activo",
                        )
                    )
                    db.commit()
    except Exception:
        # No interrumpir la verificación si el usuario de BD tiene permisos restringidos de ALTER
        pass


@app.get("/api/estado")
def verificar_estado_esquema(forzar: bool = False):
    ahora = time.time()
    if not forzar and _ESTADO_CACHE["data"] is not None and (ahora - _ESTADO_CACHE["timestamp"] < 60):
        return _ESTADO_CACHE["data"]

    try:
        inspector = inspect(engine)
        existentes = inspector.get_table_names()
        existentes_lower = {t.lower(): t for t in existentes}
        presentes = [t for t in TABLAS_ESQUEMA_19 if t.lower() in existentes_lower]
        faltantes = [t for t in TABLAS_ESQUEMA_19 if t.lower() not in existentes_lower]

        # Verificar también columnas clave de la nueva tabla Equipos
        columnas_equipos_ok = False
        if "equipos" in existentes_lower:
            cols = {c["name"].lower() for c in inspector.get_columns(existentes_lower["equipos"])}
            columnas_equipos_ok = "id_equipo" in cols and "nombre_equipo" in cols

        esquema_listo = len(faltantes) == 0 and columnas_equipos_ok
        if esquema_listo:
            sincronizar_ajustes_esquema_nuevo(inspector, existentes_lower)
        resultado = {
            "conectado": True,
            "esquema_listo": esquema_listo,
            "tablas_detectadas": existentes,
            "tablas_presentes_esquema": presentes,
            "tablas_faltantes_esquema": faltantes,
            "columnas_equipos_compatibles": columnas_equipos_ok,
        }
        _ESTADO_CACHE["timestamp"] = ahora
        _ESTADO_CACHE["data"] = resultado
        return resultado
    except Exception as e:
        resultado = {
            "conectado": False,
            "esquema_listo": False,
            "detalle": str(e),
            "tablas_faltantes_esquema": TABLAS_ESQUEMA_19,
        }
        _ESTADO_CACHE["timestamp"] = ahora
        _ESTADO_CACHE["data"] = resultado
        return resultado


# =======================================================
# GESTIÓN DE ARCHIVOS (DATASHEETS, IMÁGENES, CERTIFICADOS, LOGO)
# =======================================================
@app.get("/api/logo")
def obtener_logo_universidad():
    return {
        "logo_url": "/archivos/img/escudo_universidad.png",
        "nombre": "escudo_universidad.png",
    }


@app.post("/api/upload/{categoria}")
async def subir_archivo(categoria: str, file: UploadFile = File(...)):
    if categoria == "img":
        raise HTTPException(
            status_code=403,
            detail="El escudo institucional es fijo y no se puede modificar.",
        )
    if categoria not in STORAGE_DIRS:
        raise HTTPException(status_code=400, detail=f"Categoría inválida: {categoria}")

    nombre_original = file.filename or "archivo"
    nombre_limpio = re.sub(r"[^a-zA-Z0-9._-]", "_", nombre_original)

    sello = datetime.now().strftime("%Y%m%d_%H%M%S") + "_" + uuid.uuid4().hex[:6]
    nombre_final = f"{sello}_{nombre_limpio}"

    destino = STORAGE_DIRS[categoria] / nombre_final
    contenido = await file.read()
    with open(destino, "wb") as f:
        f.write(contenido)

    ruta_publica = f"/archivos/{categoria}/{nombre_final}"
    return {
        "mensaje": "Archivo almacenado correctamente",
        "nombre_archivo": nombre_final,
        "ruta": ruta_publica,
        "categoria": categoria,
    }


# =======================================================
# CATÁLOGOS PARAMÉTRICOS, SEDES, LABORATORIOS Y PROVEEDORES
# =======================================================
@app.get("/api/catalogos")
def obtener_todos_los_catalogos(db: Session = Depends(get_db)):
    try:
        sedes = db.query(Sede).order_by(Sede.nombre_sede).all()
        laboratorios = (
            db.query(Laboratorio)
            .options(joinedload(Laboratorio.sede))
            .order_by(Laboratorio.nombre_laboratorio)
            .all()
        )
        return {
            "sedes": [{"id_sede": s.id_sede, "nombre_sede": s.nombre_sede} for s in sedes],
            "laboratorios": [
                {
                    "id_laboratorio": l.id_laboratorio,
                    "nombre_laboratorio": l.nombre_laboratorio,
                    "id_sede": l.id_sede,
                    "nombre_sede": l.sede.nombre_sede if l.sede else None,
                }
                for l in laboratorios
            ],
            "tipos_movilidad": [
                {"id": x.id_tipo_movilidad, "descripcion": x.descripcion}
                for x in db.query(TipoMovilidad).all()
            ],
            "tipos_adquisicion": [
                {"id": x.id_tipo_adquisicion, "descripcion": x.descripcion}
                for x in db.query(TipoAdquisicion).all()
            ],
            "clasificacion_riesgos": [
                {"id": x.id_riesgo, "descripcion": x.descripcion}
                for x in db.query(ClasificacionRiesgo).all()
            ],
            "clasificacion_usos": [
                {"id": x.id_uso, "descripcion": x.descripcion}
                for x in db.query(ClasificacionUso).all()
            ],
            "tipos_documentos": [
                {"id": x.id_tipo_doc, "descripcion": x.nombre_tipo}
                for x in db.query(TipoDocumento).all()
            ],
            "fuentes_alimentacion": [
                {"id": x.id_fuente, "descripcion": x.descripcion}
                for x in db.query(CatalogoFuenteAlimentacion).all()
            ],
            "tecnologias": [
                {"id": x.id_tecnologia, "descripcion": x.descripcion}
                for x in db.query(CatalogoTecnologia).all()
            ],
            "tipos_mantenimiento": [
                {"id": x.id_tipo_mantenimiento, "descripcion": x.descripcion}
                for x in db.query(TipoMantenimiento).all()
            ],
            "proveedores": [
                {
                    "id_proveedor": p.id_proveedor,
                    "nombre_proveedor": p.nombre_proveedor,
                    "nit": p.nit,
                    "correo_electronico": p.correo_electronico,
                    "direccion": p.direccion,
                    "pais_origen": p.pais_origen,
                    "telefono": p.telefono,
                }
                for p in db.query(Proveedor).order_by(Proveedor.nombre_proveedor).all()
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar catálogos: {str(e)}")


@app.post("/api/sedes")
def crear_sede(payload: SedeCreate, db: Session = Depends(get_db)):
    nueva = Sede(nombre_sede=payload.nombre_sede.strip())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"id_sede": nueva.id_sede, "nombre_sede": nueva.nombre_sede}


@app.post("/api/laboratorios")
def crear_laboratorio(payload: LaboratorioCreate, db: Session = Depends(get_db)):
    nuevo = Laboratorio(
        nombre_laboratorio=payload.nombre_laboratorio.strip(),
        id_sede=payload.id_sede,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {
        "id_laboratorio": nuevo.id_laboratorio,
        "nombre_laboratorio": nuevo.nombre_laboratorio,
        "id_sede": nuevo.id_sede,
    }


@app.post("/api/proveedores")
def crear_proveedor(payload: ProveedorCreate, db: Session = Depends(get_db)):
    nuevo = Proveedor(**payload.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {
        "id_proveedor": nuevo.id_proveedor,
        "nombre_proveedor": nuevo.nombre_proveedor,
        "nit": nuevo.nit,
        "telefono": nuevo.telefono,
    }


CATALOGO_MAP = {
    "tipos_movilidad": (TipoMovilidad, "id_tipo_movilidad", "descripcion"),
    "tipos_adquisicion": (TipoAdquisicion, "id_tipo_adquisicion", "descripcion"),
    "clasificacion_riesgos": (ClasificacionRiesgo, "id_riesgo", "descripcion"),
    "clasificacion_usos": (ClasificacionUso, "id_uso", "descripcion"),
    "tipos_documentos": (TipoDocumento, "id_tipo_doc", "nombre_tipo"),
    "fuentes_alimentacion": (CatalogoFuenteAlimentacion, "id_fuente", "descripcion"),
    "tecnologias": (CatalogoTecnologia, "id_tecnologia", "descripcion"),
    "tipos_mantenimiento": (TipoMantenimiento, "id_tipo_mantenimiento", "descripcion"),
}


@app.post("/api/catalogos/{nombre_catalogo}")
def crear_item_catalogo(
    nombre_catalogo: str, payload: CatalogoSimpleCreate, db: Session = Depends(get_db)
):
    if nombre_catalogo not in CATALOGO_MAP:
        raise HTTPException(status_code=400, detail="Catálogo no reconocido")
    modelo, pk_attr, text_attr = CATALOGO_MAP[nombre_catalogo]
    instancia = modelo(**{text_attr: payload.valor.strip()})
    db.add(instancia)
    db.commit()
    db.refresh(instancia)
    return {"id": getattr(instancia, pk_attr), "descripcion": getattr(instancia, text_attr)}


# =======================================================
# SERIALIZADOR DE EQUIPO COMPLETO
# =======================================================
def serializar_equipo(eq: Equipo) -> dict:
    esp = eq.especificaciones
    prestamos_activos = [
        p for p in (eq.prestamos or []) if (p.estado_prestamo or "").lower() != "devuelto"
    ]
    return {
        "id_equipo": eq.id_equipo,
        "nombre_equipo": eq.nombre_equipo,
        "fabricante": eq.fabricante,
        "modelo": eq.modelo,
        "serie_universidad": eq.serie_universidad,
        "serie_equipo": eq.serie_equipo,
        "serie_laboratorio": eq.serie_laboratorio,
        "registro_sanitario_invima": eq.registro_sanitario_invima,
        "fecha_adquisicion": eq.fecha_adquisicion.isoformat() if eq.fecha_adquisicion else None,
        "valor_adquisicion": float(eq.valor_adquisicion) if eq.valor_adquisicion is not None else None,
        "responsable_equipo": eq.responsable_equipo,
        "periodicidad_mantenimiento_meses": eq.periodicidad_mantenimiento_meses,
        "requiere_calibracion": bool(eq.requiere_calibracion),
        "periodicidad_calibracion_meses": eq.periodicidad_calibracion_meses,
        "id_laboratorio": eq.id_laboratorio,
        "nombre_laboratorio": eq.laboratorio.nombre_laboratorio if eq.laboratorio else None,
        "id_sede": eq.laboratorio.id_sede if eq.laboratorio else None,
        "nombre_sede": (
            eq.laboratorio.sede.nombre_sede
            if eq.laboratorio and eq.laboratorio.sede
            else None
        ),
        "id_tipo_movilidad": eq.id_tipo_movilidad,
        "movilidad_descripcion": eq.movilidad.descripcion if eq.movilidad else None,
        "id_tipo_adquisicion": eq.id_tipo_adquisicion,
        "adquisicion_descripcion": eq.adquisicion.descripcion if eq.adquisicion else None,
        "id_proveedor": eq.id_proveedor,
        "nombre_proveedor": eq.proveedor.nombre_proveedor if eq.proveedor else None,
        "id_riesgo": eq.id_riesgo,
        "riesgo_descripcion": eq.riesgo.descripcion if eq.riesgo else None,
        "id_uso": eq.id_uso,
        "uso_descripcion": eq.uso.descripcion if eq.uso else None,
        "en_prestamo": len(prestamos_activos) > 0,
        "total_mantenimientos": len(eq.mantenimientos or []),
        "total_calibraciones": len(eq.calibraciones or []),
        "especificaciones": (
            {
                "id_especificacion": esp.id_especificacion,
                "id_fuente": esp.id_fuente,
                "fuente_descripcion": esp.fuente.descripcion if esp.fuente else None,
                "id_tecnologia": esp.id_tecnologia,
                "tecnologia_descripcion": esp.tecnologia.descripcion if esp.tecnologia else None,
                "voltaje_v": esp.voltaje_v,
                "corriente_a": esp.corriente_a,
                "potencia_w": esp.potencia_w,
                "frecuencia_hz": esp.frecuencia_hz,
                "presion": esp.presion,
                "velocidad": esp.velocidad,
                "peso_kg": esp.peso_kg,
                "temperatura": esp.temperatura,
                "dimensiones": esp.dimensiones,
                "otros_instalacion": esp.otros_instalacion,
                "rango_voltaje": esp.rango_voltaje,
                "rango_corriente": esp.rango_corriente,
                "rango_potencia": esp.rango_potencia,
                "rango_presion": esp.rango_presion,
                "rango_velocidad": esp.rango_velocidad,
                "rango_humedad": esp.rango_humedad,
                "rango_temperatura": esp.rango_temperatura,
                "otros_funcionamiento": esp.otros_funcionamiento,
            }
            if esp
            else None
        ),
        "documentos": [
            {
                "id_documento": d.id_documento,
                "id_tipo_doc": d.id_tipo_doc,
                "nombre_tipo": d.tipo_documento.nombre_tipo if d.tipo_documento else "Documento PDF",
                "ruta_archivo_pdf": d.ruta_archivo_pdf,
            }
            for d in (eq.documentos or [])
        ],
        "imagenes": [
            {
                "id_imagen": img.id_imagen,
                "descripcion_imagen": img.descripcion_imagen,
                "ruta_imagen": img.ruta_imagen,
            }
            for img in (eq.imagenes or [])
        ],
        "componentes": [
            {
                "id_componente": c.id_componente,
                "nombre_componente": c.nombre_componente,
                "marca": c.marca,
                "modelo": c.modelo,
                "serie_referencia": c.serie_referencia,
            }
            for c in (eq.componentes or [])
        ],
    }


# =======================================================
# MÓDULO 1 Y 2: INVENTARIO Y REGISTRO DE EQUIPO
# =======================================================
@app.get("/api/equipos")
def listar_equipos(
    id_sede: Optional[int] = None,
    id_laboratorio: Optional[int] = None,
    db: Session = Depends(get_db),
):
    try:
        query = db.query(Equipo).options(
            joinedload(Equipo.laboratorio).joinedload(Laboratorio.sede),
            joinedload(Equipo.movilidad),
            joinedload(Equipo.adquisicion),
            joinedload(Equipo.proveedor),
            joinedload(Equipo.riesgo),
            joinedload(Equipo.uso),
            joinedload(Equipo.especificaciones).joinedload(EspecificacionTecnica.fuente),
            joinedload(Equipo.especificaciones).joinedload(EspecificacionTecnica.tecnologia),
            selectinload(Equipo.documentos).joinedload(DocumentoEquipo.tipo_documento),
            selectinload(Equipo.imagenes),
            selectinload(Equipo.componentes),
            selectinload(Equipo.mantenimientos),
            selectinload(Equipo.calibraciones),
            selectinload(Equipo.prestamos),
        )
        if id_laboratorio:
            query = query.filter(Equipo.id_laboratorio == id_laboratorio)
        elif id_sede:
            query = query.join(Laboratorio, Equipo.id_laboratorio == Laboratorio.id_laboratorio).filter(
                Laboratorio.id_sede == id_sede
            )

        equipos = query.order_by(Equipo.id_equipo.desc()).all()
        return [serializar_equipo(eq) for eq in equipos]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar equipos: {str(e)}")


@app.post("/api/equipos")
def registrar_equipo(payload: EquipoCreate, db: Session = Depends(get_db)):
    try:
        datos_equipo = payload.model_dump(
            exclude={"especificaciones", "componentes", "documentos", "imagenes"}
        )
        nuevo_equipo = Equipo(**datos_equipo)
        db.add(nuevo_equipo)
        db.flush()  # Obtener id_equipo

        if payload.especificaciones:
            esp_data = payload.especificaciones.model_dump()
            # Crear registro 1:1 en Especificaciones_Tecnicas si hay al menos un valor o catálogo
            if any(v is not None and str(v).strip() != "" for v in esp_data.values()):
                db.add(EspecificacionTecnica(id_equipo=nuevo_equipo.id_equipo, **esp_data))

        for comp in payload.componentes or []:
            if comp.nombre_componente and comp.nombre_componente.strip():
                db.add(ComponenteEquipo(id_equipo=nuevo_equipo.id_equipo, **comp.model_dump()))

        for doc in payload.documentos or []:
            if doc.ruta_archivo_pdf:
                db.add(DocumentoEquipo(id_equipo=nuevo_equipo.id_equipo, **doc.model_dump()))

        for img in payload.imagenes or []:
            if img.ruta_imagen:
                db.add(ImagenEquipo(id_equipo=nuevo_equipo.id_equipo, **img.model_dump()))

        db.commit()
        db.refresh(nuevo_equipo)
        return {"mensaje": "Equipo registrado exitosamente", "id_equipo": nuevo_equipo.id_equipo}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al registrar equipo: {str(e)}")


@app.put("/api/equipos/{id_equipo}")
def actualizar_equipo(id_equipo: int, payload: EquipoCreate, db: Session = Depends(get_db)):
    eq = (
        db.query(Equipo)
        .options(
            joinedload(Equipo.especificaciones),
            selectinload(Equipo.componentes),
        )
        .filter(Equipo.id_equipo == id_equipo)
        .first()
    )
    if not eq:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")

    try:
        datos_equipo = payload.model_dump(
            exclude={"especificaciones", "componentes", "documentos", "imagenes"}
        )
        for campo, valor in datos_equipo.items():
            setattr(eq, campo, valor)

        if payload.especificaciones is not None:
            esp_data = payload.especificaciones.model_dump()
            if eq.especificaciones:
                for campo, valor in esp_data.items():
                    setattr(eq.especificaciones, campo, valor)
            elif any(v is not None and str(v).strip() != "" for v in esp_data.values()):
                db.add(EspecificacionTecnica(id_equipo=eq.id_equipo, **esp_data))

        if payload.componentes is not None:
            db.query(ComponenteEquipo).filter(ComponenteEquipo.id_equipo == id_equipo).delete()
            for comp in payload.componentes:
                if comp.nombre_componente and comp.nombre_componente.strip():
                    db.add(ComponenteEquipo(id_equipo=id_equipo, **comp.model_dump()))

        db.commit()
        return {"mensaje": "Equipo actualizado correctamente", "id_equipo": eq.id_equipo}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar equipo: {str(e)}")


@app.delete("/api/documentos/{id_documento}")
def eliminar_documento_equipo(id_documento: int, db: Session = Depends(get_db)):
    doc = db.query(DocumentoEquipo).filter(DocumentoEquipo.id_documento == id_documento).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    db.delete(doc)
    db.commit()
    return {"mensaje": "Documento eliminado"}


@app.delete("/api/imagenes/{id_imagen}")
def eliminar_imagen_equipo(id_imagen: int, db: Session = Depends(get_db)):
    img = db.query(ImagenEquipo).filter(ImagenEquipo.id_imagen == id_imagen).first()
    if not img:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    db.delete(img)
    db.commit()
    return {"mensaje": "Imagen eliminada"}


@app.post("/api/equipos/{id_equipo}/documentos")
def agregar_documento_equipo(
    id_equipo: int, payload: DocumentoEquipoBase, db: Session = Depends(get_db)
):
    doc = DocumentoEquipo(id_equipo=id_equipo, **payload.model_dump())
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"id_documento": doc.id_documento, "ruta_archivo_pdf": doc.ruta_archivo_pdf}


@app.post("/api/equipos/{id_equipo}/imagenes")
def agregar_imagen_equipo(
    id_equipo: int, payload: ImagenEquipoBase, db: Session = Depends(get_db)
):
    img = ImagenEquipo(id_equipo=id_equipo, **payload.model_dump())
    db.add(img)
    db.commit()
    db.refresh(img)
    return {"id_imagen": img.id_imagen, "ruta_imagen": img.ruta_imagen}


@app.post("/api/equipos/{id_equipo}/componentes")
def agregar_componente_equipo(
    id_equipo: int, payload: ComponenteEquipoBase, db: Session = Depends(get_db)
):
    comp = ComponenteEquipo(id_equipo=id_equipo, **payload.model_dump())
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return {"id_componente": comp.id_componente}


@app.delete("/api/equipos/{id_equipo}")
def eliminar_equipo(id_equipo: int, db: Session = Depends(get_db)):
    eq = db.query(Equipo).filter(Equipo.id_equipo == id_equipo).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    db.delete(eq)
    db.commit()
    return {"mensaje": "Equipo eliminado correctamente"}


# =======================================================
# MÓDULO 3: REGISTRO DE MANTENIMIENTOS
# =======================================================
@app.get("/api/mantenimientos")
def listar_mantenimientos(db: Session = Depends(get_db)):
    try:
        registros = (
            db.query(RegistroMantenimiento)
            .options(
                joinedload(RegistroMantenimiento.equipo).joinedload(Equipo.laboratorio),
                joinedload(RegistroMantenimiento.tipo_mantenimiento),
            )
            .order_by(
                RegistroMantenimiento.fecha_mantenimiento.desc(),
                RegistroMantenimiento.id_registro_mantenimiento.desc(),
            )
            .all()
        )
        return [
            {
                "id_registro_mantenimiento": r.id_registro_mantenimiento,
                "id_equipo": r.id_equipo,
                "nombre_equipo": r.equipo.nombre_equipo if r.equipo else "Equipo eliminado",
                "serie_equipo": r.equipo.serie_equipo if r.equipo else None,
                "id_laboratorio": r.equipo.id_laboratorio if r.equipo else None,
                "nombre_laboratorio": (
                    r.equipo.laboratorio.nombre_laboratorio
                    if r.equipo and r.equipo.laboratorio
                    else None
                ),
                "id_tipo_mantenimiento": r.id_tipo_mantenimiento,
                "tipo_mantenimiento": (
                    r.tipo_mantenimiento.descripcion if r.tipo_mantenimiento else "General"
                ),
                "fecha_mantenimiento": (
                    r.fecha_mantenimiento.isoformat() if r.fecha_mantenimiento else None
                ),
                "responsable_mantenimiento": r.responsable_mantenimiento,
                "costo": float(r.costo) if r.costo is not None else 0.0,
                "ruta_evidencia_pdf": r.ruta_evidencia_pdf,
            }
            for r in registros
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar mantenimientos: {str(e)}")


@app.post("/api/mantenimientos")
def crear_mantenimiento(payload: MantenimientoCreate, db: Session = Depends(get_db)):
    try:
        nuevo = RegistroMantenimiento(**payload.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return {
            "mensaje": "Mantenimiento registrado exitosamente",
            "id_registro_mantenimiento": nuevo.id_registro_mantenimiento,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar mantenimiento: {str(e)}")


@app.delete("/api/mantenimientos/{id_registro}")
def eliminar_mantenimiento(id_registro: int, db: Session = Depends(get_db)):
    reg = (
        db.query(RegistroMantenimiento)
        .filter(RegistroMantenimiento.id_registro_mantenimiento == id_registro)
        .first()
    )
    if not reg:
        raise HTTPException(status_code=404, detail="Registro de mantenimiento no encontrado")
    db.delete(reg)
    db.commit()
    return {"mensaje": "Registro eliminado"}


# =======================================================
# MÓDULO 4: REGISTRO DE CALIBRACIONES
# =======================================================
@app.get("/api/calibraciones")
def listar_calibraciones(db: Session = Depends(get_db)):
    try:
        registros = (
            db.query(RegistroCalibracion)
            .options(joinedload(RegistroCalibracion.equipo).joinedload(Equipo.laboratorio))
            .order_by(
                RegistroCalibracion.fecha_calibracion.desc(),
                RegistroCalibracion.id_registro_calibracion.desc(),
            )
            .all()
        )
        return [
            {
                "id_registro_calibracion": r.id_registro_calibracion,
                "id_equipo": r.id_equipo,
                "nombre_equipo": r.equipo.nombre_equipo if r.equipo else "Equipo eliminado",
                "serie_equipo": r.equipo.serie_equipo if r.equipo else None,
                "id_laboratorio": r.equipo.id_laboratorio if r.equipo else None,
                "nombre_laboratorio": (
                    r.equipo.laboratorio.nombre_laboratorio
                    if r.equipo and r.equipo.laboratorio
                    else None
                ),
                "fecha_calibracion": (
                    r.fecha_calibracion.isoformat() if r.fecha_calibracion else None
                ),
                "entidad_calibradora": r.entidad_calibradora,
                "resultado_conforme": bool(r.resultado_conforme),
                "ruta_certificado_pdf": r.ruta_certificado_pdf,
            }
            for r in registros
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar calibraciones: {str(e)}")


@app.post("/api/calibraciones")
def crear_calibracion(payload: CalibracionCreate, db: Session = Depends(get_db)):
    try:
        nuevo = RegistroCalibracion(**payload.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return {
            "mensaje": "Calibración registrada exitosamente",
            "id_registro_calibracion": nuevo.id_registro_calibracion,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar calibración: {str(e)}")


@app.delete("/api/calibraciones/{id_registro}")
def eliminar_calibracion(id_registro: int, db: Session = Depends(get_db)):
    reg = (
        db.query(RegistroCalibracion)
        .filter(RegistroCalibracion.id_registro_calibracion == id_registro)
        .first()
    )
    if not reg:
        raise HTTPException(status_code=404, detail="Registro de calibración no encontrado")
    db.delete(reg)
    db.commit()
    return {"mensaje": "Registro eliminado"}


# =======================================================
# MÓDULO 5: PRÉSTAMOS DE EQUIPOS
# =======================================================
@app.get("/api/prestamos")
def listar_prestamos(db: Session = Depends(get_db)):
    try:
        registros = (
            db.query(PrestamoEquipo)
            .options(joinedload(PrestamoEquipo.equipo).joinedload(Equipo.laboratorio))
            .order_by(
                PrestamoEquipo.fecha_hora_prestamo.desc(),
                PrestamoEquipo.id_prestamo.desc(),
            )
            .all()
        )
        return [
            {
                "id_prestamo": r.id_prestamo,
                "id_equipo": r.id_equipo,
                "nombre_equipo": r.equipo.nombre_equipo if r.equipo else "Equipo eliminado",
                "serie_equipo": r.equipo.serie_equipo if r.equipo else None,
                "id_laboratorio": r.equipo.id_laboratorio if r.equipo else None,
                "nombre_laboratorio": (
                    r.equipo.laboratorio.nombre_laboratorio
                    if r.equipo and r.equipo.laboratorio
                    else None
                ),
                "codigo_universidad": r.codigo_universidad,
                "nombre_solicitante": r.nombre_solicitante,
                "fecha_hora_prestamo": (
                    r.fecha_hora_prestamo.isoformat() if r.fecha_hora_prestamo else None
                ),
                "fecha_hora_devolucion": (
                    r.fecha_hora_devolucion.isoformat() if r.fecha_hora_devolucion else None
                ),
                "estado_prestamo": r.estado_prestamo or "Activo",
                "observaciones_entrega": r.observaciones_entrega,
                "observaciones_devolucion": r.observaciones_devolucion,
            }
            for r in registros
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar préstamos: {str(e)}")


@app.post("/api/prestamos")
def crear_prestamo(payload: PrestamoCreate, db: Session = Depends(get_db)):
    try:
        nuevo = PrestamoEquipo(**payload.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return {
            "mensaje": "Préstamo registrado exitosamente",
            "id_prestamo": nuevo.id_prestamo,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar préstamo: {str(e)}")


@app.patch("/api/prestamos/{id_prestamo}/estado")
def actualizar_estado_prestamo(
    id_prestamo: int, payload: PrestamoEstadoUpdate, db: Session = Depends(get_db)
):
    reg = db.query(PrestamoEquipo).filter(PrestamoEquipo.id_prestamo == id_prestamo).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")

    reg.estado_prestamo = payload.estado_prestamo
    if payload.fecha_hora_devolucion:
        reg.fecha_hora_devolucion = payload.fecha_hora_devolucion
    elif payload.estado_prestamo.lower() == "devuelto" and not reg.fecha_hora_devolucion:
        reg.fecha_hora_devolucion = datetime.now()

    if payload.observaciones_devolucion is not None:
        reg.observaciones_devolucion = payload.observaciones_devolucion

    db.commit()
    return {"mensaje": "Estado de préstamo actualizado"}


@app.delete("/api/prestamos/{id_prestamo}")
def eliminar_prestamo(id_prestamo: int, db: Session = Depends(get_db)):
    reg = db.query(PrestamoEquipo).filter(PrestamoEquipo.id_prestamo == id_prestamo).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    db.delete(reg)
    db.commit()
    return {"mensaje": "Préstamo eliminado"}


# =======================================================
# MÓDULO DE USUARIOS, ROLES Y AUTENTICACIÓN
# =======================================================
def encriptar_contrasena(password: str) -> str:
    salt = "labora_auth_salt_2026"
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()


def verificar_contrasena(password: str, stored_hash: str) -> bool:
    calculado_pbkdf2 = encriptar_contrasena(password)
    calculado_sha256 = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return (
        hmac.compare_digest(calculado_pbkdf2, stored_hash)
        or hmac.compare_digest(calculado_sha256, stored_hash.lower())
        or hmac.compare_digest(password, stored_hash)
    )


@app.get("/api/roles")
def listar_roles(db: Session = Depends(get_db)):
    try:
        roles = db.query(Rol).order_by(Rol.id_rol).all()
        return [
            {
                "id_rol": r.id_rol,
                "nombre_rol": r.nombre_rol,
                "descripcion": r.descripcion,
            }
            for r in roles
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar roles: {str(e)}")


@app.post("/api/roles")
def crear_rol(payload: RolCreate, db: Session = Depends(get_db)):
    nuevo = Rol(nombre_rol=payload.nombre_rol.strip(), descripcion=payload.descripcion)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {
        "id_rol": nuevo.id_rol,
        "nombre_rol": nuevo.nombre_rol,
        "descripcion": nuevo.descripcion,
    }


@app.get("/api/usuarios")
def listar_usuarios(db: Session = Depends(get_db)):
    try:
        usuarios = (
            db.query(Usuario)
            .options(joinedload(Usuario.rol))
            .order_by(Usuario.id_usuario.desc())
            .all()
        )
        return [
            {
                "id_usuario": u.id_usuario,
                "nombre_completo": u.nombre_completo,
                "correo_electronico": u.correo_electronico,
                "id_rol": u.id_rol,
                "nombre_rol": u.rol.nombre_rol if u.rol else "Sin rol",
                "estado": u.estado or "Activo",
                "fecha_creacion": u.fecha_creacion.isoformat() if u.fecha_creacion else None,
            }
            for u in usuarios
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar usuarios: {str(e)}")


@app.post("/api/usuarios")
def crear_usuario(payload: UsuarioCreate, db: Session = Depends(get_db)):
    existente = (
        db.query(Usuario)
        .filter(Usuario.correo_electronico == payload.correo_electronico.strip().lower())
        .first()
    )
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con ese correo electrónico")

    nuevo = Usuario(
        nombre_completo=payload.nombre_completo.strip(),
        correo_electronico=payload.correo_electronico.strip().lower(),
        contrasena_hash=encriptar_contrasena(payload.contrasena),
        id_rol=payload.id_rol,
        estado=payload.estado or "Activo",
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Usuario creado correctamente", "id_usuario": nuevo.id_usuario}


@app.patch("/api/usuarios/{id_usuario}")
def actualizar_usuario(
    id_usuario: int, payload: UsuarioEstadoUpdate, db: Session = Depends(get_db)
):
    u = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    u.estado = payload.estado
    if payload.id_rol is not None:
        u.id_rol = payload.id_rol
    db.commit()
    return {"mensaje": "Usuario actualizado"}


@app.delete("/api/usuarios/{id_usuario}")
def eliminar_usuario(id_usuario: int, db: Session = Depends(get_db)):
    u = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(u)
    db.commit()
    return {"mensaje": "Usuario eliminado"}


@app.post("/api/auth/login")
def iniciar_sesion(payload: LoginRequest, db: Session = Depends(get_db)):
    correo = payload.correo_electronico.strip().lower()
    usuario = (
        db.query(Usuario)
        .options(joinedload(Usuario.rol))
        .filter(Usuario.correo_electronico == correo)
        .first()
    )
    if not usuario or not verificar_contrasena(payload.contrasena, usuario.contrasena_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    if (usuario.estado or "Activo") != "Activo":
        raise HTTPException(status_code=403, detail="Esta cuenta se encuentra inactiva")

    nombre_rol = usuario.rol.nombre_rol if usuario.rol else "Estudiante"
    if nombre_rol.strip().lower() == "estudiante":
        raise HTTPException(
            status_code=403,
            detail="Acceso restringido: el rol Estudiante no tiene permisos para ingresar al panel administrativo",
        )

    return {
        "id_usuario": usuario.id_usuario,
        "nombre_completo": usuario.nombre_completo,
        "correo_electronico": usuario.correo_electronico,
        "id_rol": usuario.id_rol,
        "nombre_rol": nombre_rol,
        "estado": usuario.estado,
    }


# Si existe el build de producción del frontend (frontend/dist), FastAPI también puede servirlo directamente
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")



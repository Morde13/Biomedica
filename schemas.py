from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


# =======================================================
# ESQUEMAS DE UBICACIÓN Y CATÁLOGOS
# =======================================================
class SedeCreate(BaseModel):
    nombre_sede: str


class SedeOut(SedeCreate):
    id_sede: int
    model_config = ConfigDict(from_attributes=True)


class LaboratorioCreate(BaseModel):
    nombre_laboratorio: str
    id_sede: Optional[int] = None


class LaboratorioOut(LaboratorioCreate):
    id_laboratorio: int
    nombre_sede: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class CatalogoSimpleCreate(BaseModel):
    valor: str


class ProveedorCreate(BaseModel):
    nombre_proveedor: str
    nit: Optional[str] = None
    correo_electronico: Optional[str] = None
    direccion: Optional[str] = None
    pais_origen: Optional[str] = None
    telefono: Optional[str] = None


class ProveedorOut(ProveedorCreate):
    id_proveedor: int
    model_config = ConfigDict(from_attributes=True)


# =======================================================
# ESPECIFICACIONES TÉCNICAS Y DETALLES DE EQUIPO
# =======================================================
class EspecificacionTecnicaBase(BaseModel):
    id_fuente: Optional[int] = None
    id_tecnologia: Optional[int] = None
    voltaje_v: Optional[str] = None
    corriente_a: Optional[str] = None
    potencia_w: Optional[str] = None
    frecuencia_hz: Optional[str] = None
    presion: Optional[str] = None
    velocidad: Optional[str] = None
    peso_kg: Optional[str] = None
    temperatura: Optional[str] = None
    dimensiones: Optional[str] = None
    otros_instalacion: Optional[str] = None
    rango_voltaje: Optional[str] = None
    rango_corriente: Optional[str] = None
    rango_potencia: Optional[str] = None
    rango_presion: Optional[str] = None
    rango_velocidad: Optional[str] = None
    rango_humedad: Optional[str] = None
    rango_temperatura: Optional[str] = None
    otros_funcionamiento: Optional[str] = None


class EspecificacionTecnicaOut(EspecificacionTecnicaBase):
    id_especificacion: int
    id_equipo: int
    fuente_descripcion: Optional[str] = None
    tecnologia_descripcion: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class ComponenteEquipoBase(BaseModel):
    nombre_componente: str
    marca: Optional[str] = None
    modelo: Optional[str] = None
    serie_referencia: Optional[str] = None


class ComponenteEquipoOut(ComponenteEquipoBase):
    id_componente: int
    id_equipo: int
    model_config = ConfigDict(from_attributes=True)


class DocumentoEquipoBase(BaseModel):
    id_tipo_doc: Optional[int] = None
    ruta_archivo_pdf: str


class DocumentoEquipoOut(DocumentoEquipoBase):
    id_documento: int
    id_equipo: int
    nombre_tipo: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class ImagenEquipoBase(BaseModel):
    descripcion_imagen: Optional[str] = None
    ruta_imagen: str


class ImagenEquipoOut(ImagenEquipoBase):
    id_imagen: int
    id_equipo: int
    model_config = ConfigDict(from_attributes=True)


# =======================================================
# EQUIPO PRINCIPAL
# =======================================================
class EquipoCreate(BaseModel):
    nombre_equipo: str
    fabricante: Optional[str] = None
    modelo: Optional[str] = None
    serie_universidad: Optional[str] = None
    serie_equipo: Optional[str] = None
    serie_laboratorio: Optional[str] = None
    registro_sanitario_invima: Optional[str] = None
    fecha_adquisicion: Optional[date] = None
    valor_adquisicion: Optional[Decimal] = None
    responsable_equipo: Optional[str] = None
    periodicidad_mantenimiento_meses: Optional[int] = None
    requiere_calibracion: Optional[bool] = False
    periodicidad_calibracion_meses: Optional[int] = None
    id_laboratorio: Optional[int] = None
    id_tipo_movilidad: Optional[int] = None
    id_tipo_adquisicion: Optional[int] = None
    id_proveedor: Optional[int] = None
    id_riesgo: Optional[int] = None
    id_uso: Optional[int] = None

    especificaciones: Optional[EspecificacionTecnicaBase] = None
    componentes: Optional[List[ComponenteEquipoBase]] = []
    documentos: Optional[List[DocumentoEquipoBase]] = []
    imagenes: Optional[List[ImagenEquipoBase]] = []


# =======================================================
# MANTENIMIENTOS, CALIBRACIONES Y PRÉSTAMOS
# =======================================================
class MantenimientoCreate(BaseModel):
    id_equipo: int
    id_tipo_mantenimiento: Optional[int] = None
    fecha_mantenimiento: date
    responsable_mantenimiento: Optional[str] = None
    costo: Optional[Decimal] = None
    ruta_evidencia_pdf: Optional[str] = None


class CalibracionCreate(BaseModel):
    id_equipo: int
    fecha_calibracion: date
    entidad_calibradora: str
    resultado_conforme: bool = True
    ruta_certificado_pdf: Optional[str] = None


class PrestamoCreate(BaseModel):
    id_equipo: int
    codigo_universidad: str
    nombre_solicitante: str
    fecha_hora_prestamo: datetime
    fecha_hora_devolucion: Optional[datetime] = None
    estado_prestamo: str = "Activo"
    observaciones_entrega: Optional[str] = None
    observaciones_devolucion: Optional[str] = None


class PrestamoEstadoUpdate(BaseModel):
    estado_prestamo: str
    fecha_hora_devolucion: Optional[datetime] = None
    observaciones_devolucion: Optional[str] = None


# =======================================================
# MÓDULO DE USUARIOS Y ROLES (AUTENTICACIÓN)
# =======================================================
class RolCreate(BaseModel):
    nombre_rol: str
    descripcion: Optional[str] = None


class UsuarioCreate(BaseModel):
    nombre_completo: str
    correo_electronico: str
    contrasena: str
    id_rol: int
    estado: Optional[str] = "Activo"


class UsuarioEstadoUpdate(BaseModel):
    estado: str
    id_rol: Optional[int] = None


class LoginRequest(BaseModel):
    correo_electronico: str
    contrasena: str


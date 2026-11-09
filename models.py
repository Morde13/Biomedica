from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Date,
    DateTime,
    Text,
    Numeric,
    Enum,
    ForeignKey,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


# =======================================================
# FASE 1: JERARQUÍA Y UBICACIÓN
# =======================================================
class Sede(Base):
    __tablename__ = "Sedes"

    id_sede = Column(Integer, primary_key=True, autoincrement=True)
    nombre_sede = Column(String(100), nullable=False)

    laboratorios = relationship("Laboratorio", back_populates="sede")


class Laboratorio(Base):
    __tablename__ = "Laboratorios"

    id_laboratorio = Column(Integer, primary_key=True, autoincrement=True)
    nombre_laboratorio = Column(String(100), nullable=False)
    id_sede = Column(Integer, ForeignKey("Sedes.id_sede"), nullable=True)

    sede = relationship("Sede", back_populates="laboratorios")
    equipos = relationship("Equipo", back_populates="laboratorio")


# =======================================================
# TABLAS DE CATÁLOGO (PARAMÉTRICAS)
# =======================================================
class TipoMovilidad(Base):
    __tablename__ = "Tipos_Movilidad"

    id_tipo_movilidad = Column(Integer, primary_key=True, autoincrement=True)
    descripcion = Column(String(50), nullable=False)


class TipoAdquisicion(Base):
    __tablename__ = "Tipos_Adquisicion"

    id_tipo_adquisicion = Column(Integer, primary_key=True, autoincrement=True)
    descripcion = Column(String(100), nullable=False)


class ClasificacionRiesgo(Base):
    __tablename__ = "Clasificacion_Riesgos"

    id_riesgo = Column(Integer, primary_key=True, autoincrement=True)
    descripcion = Column(String(50), nullable=False)


class ClasificacionUso(Base):
    __tablename__ = "Clasificacion_Usos"

    id_uso = Column(Integer, primary_key=True, autoincrement=True)
    descripcion = Column(String(100), nullable=False)


class TipoDocumento(Base):
    __tablename__ = "Tipos_Documentos"

    id_tipo_doc = Column(Integer, primary_key=True, autoincrement=True)
    nombre_tipo = Column(String(100), nullable=False)


class CatalogoFuenteAlimentacion(Base):
    __tablename__ = "Catalogo_Fuente_Alimentacion"

    id_fuente = Column(Integer, primary_key=True, autoincrement=True)
    descripcion = Column(String(100), nullable=False)


class CatalogoTecnologia(Base):
    __tablename__ = "Catalogo_Tecnologia"

    id_tecnologia = Column(Integer, primary_key=True, autoincrement=True)
    descripcion = Column(String(100), nullable=False)


class TipoMantenimiento(Base):
    __tablename__ = "Tipos_Mantenimiento"

    id_tipo_mantenimiento = Column(Integer, primary_key=True, autoincrement=True)
    descripcion = Column(String(50), nullable=False)


# =======================================================
# SOPORTE COMERCIAL
# =======================================================
class Proveedor(Base):
    __tablename__ = "Proveedores"

    id_proveedor = Column(Integer, primary_key=True, autoincrement=True)
    nombre_proveedor = Column(String(150), nullable=False)
    nit = Column(String(50), nullable=True)
    correo_electronico = Column(String(100), nullable=True)
    direccion = Column(String(200), nullable=True)
    pais_origen = Column(String(100), nullable=True)
    telefono = Column(String(50), nullable=True)


# =======================================================
# FASE 1 Y 5: TABLA PRINCIPAL DE EQUIPOS
# =======================================================
class Equipo(Base):
    __tablename__ = "Equipos"

    id_equipo = Column(Integer, primary_key=True, autoincrement=True)
    nombre_equipo = Column(String(150), nullable=False)
    fabricante = Column(String(100), nullable=True)
    modelo = Column(String(100), nullable=True)
    serie_universidad = Column(String(100), nullable=True)
    serie_equipo = Column(String(100), nullable=True)
    serie_laboratorio = Column(String(100), nullable=True)
    registro_sanitario_invima = Column(String(100), nullable=True)
    fecha_adquisicion = Column(Date, nullable=True)
    valor_adquisicion = Column(Numeric(12, 2), nullable=True)
    responsable_equipo = Column(String(150), nullable=True)
    periodicidad_mantenimiento_meses = Column(Integer, nullable=True)
    requiere_calibracion = Column(Boolean, nullable=True, default=False)
    periodicidad_calibracion_meses = Column(Integer, nullable=True)

    id_laboratorio = Column(Integer, ForeignKey("Laboratorios.id_laboratorio"), nullable=True)
    id_tipo_movilidad = Column(Integer, ForeignKey("Tipos_Movilidad.id_tipo_movilidad"), nullable=True)
    id_tipo_adquisicion = Column(Integer, ForeignKey("Tipos_Adquisicion.id_tipo_adquisicion"), nullable=True)
    id_proveedor = Column(Integer, ForeignKey("Proveedores.id_proveedor"), nullable=True)
    id_riesgo = Column(Integer, ForeignKey("Clasificacion_Riesgos.id_riesgo"), nullable=True)
    id_uso = Column(Integer, ForeignKey("Clasificacion_Usos.id_uso"), nullable=True)

    laboratorio = relationship("Laboratorio", back_populates="equipos")
    movilidad = relationship("TipoMovilidad")
    adquisicion = relationship("TipoAdquisicion")
    proveedor = relationship("Proveedor")
    riesgo = relationship("ClasificacionRiesgo")
    uso = relationship("ClasificacionUso")

    especificaciones = relationship(
        "EspecificacionTecnica",
        back_populates="equipo",
        uselist=False,
        cascade="all, delete-orphan",
    )
    documentos = relationship(
        "DocumentoEquipo",
        back_populates="equipo",
        cascade="all, delete-orphan",
    )
    imagenes = relationship(
        "ImagenEquipo",
        back_populates="equipo",
        cascade="all, delete-orphan",
    )
    componentes = relationship(
        "ComponenteEquipo",
        back_populates="equipo",
        cascade="all, delete-orphan",
    )
    mantenimientos = relationship(
        "RegistroMantenimiento",
        back_populates="equipo",
        cascade="all, delete-orphan",
    )
    calibraciones = relationship(
        "RegistroCalibracion",
        back_populates="equipo",
        cascade="all, delete-orphan",
    )
    prestamos = relationship(
        "PrestamoEquipo",
        back_populates="equipo",
        cascade="all, delete-orphan",
    )


# =======================================================
# FASE 2: ESPECIFICACIONES TÉCNICAS (RELACIÓN 1:1)
# =======================================================
class EspecificacionTecnica(Base):
    __tablename__ = "Especificaciones_Tecnicas"

    id_especificacion = Column(Integer, primary_key=True, autoincrement=True)
    id_equipo = Column(Integer, ForeignKey("Equipos.id_equipo", ondelete="CASCADE"), unique=True)
    id_fuente = Column(Integer, ForeignKey("Catalogo_Fuente_Alimentacion.id_fuente"), nullable=True)
    id_tecnologia = Column(Integer, ForeignKey("Catalogo_Tecnologia.id_tecnologia"), nullable=True)

    voltaje_v = Column(String(50), nullable=True)
    corriente_a = Column(String(50), nullable=True)
    potencia_w = Column(String(50), nullable=True)
    frecuencia_hz = Column(String(50), nullable=True)
    presion = Column(String(50), nullable=True)
    velocidad = Column(String(50), nullable=True)
    peso_kg = Column(String(50), nullable=True)
    temperatura = Column(String(50), nullable=True)
    dimensiones = Column(String(100), nullable=True)
    otros_instalacion = Column(Text, nullable=True)

    rango_voltaje = Column(String(50), nullable=True)
    rango_corriente = Column(String(50), nullable=True)
    rango_potencia = Column(String(50), nullable=True)
    rango_presion = Column(String(50), nullable=True)
    rango_velocidad = Column(String(50), nullable=True)
    rango_humedad = Column(String(50), nullable=True)
    rango_temperatura = Column(String(50), nullable=True)
    otros_funcionamiento = Column(Text, nullable=True)

    equipo = relationship("Equipo", back_populates="especificaciones")
    fuente = relationship("CatalogoFuenteAlimentacion")
    tecnologia = relationship("CatalogoTecnologia")


# =======================================================
# FASE 3, 4 Y 5: TABLAS DE DETALLE Y REGISTRO (RELACIONES 1:N)
# =======================================================
class DocumentoEquipo(Base):
    __tablename__ = "Documentos_Equipos"

    id_documento = Column(Integer, primary_key=True, autoincrement=True)
    id_equipo = Column(Integer, ForeignKey("Equipos.id_equipo", ondelete="CASCADE"), nullable=True)
    id_tipo_doc = Column(Integer, ForeignKey("Tipos_Documentos.id_tipo_doc"), nullable=True)
    ruta_archivo_pdf = Column(String(255), nullable=True)

    equipo = relationship("Equipo", back_populates="documentos")
    tipo_documento = relationship("TipoDocumento")


class ImagenEquipo(Base):
    __tablename__ = "Imagenes_Equipos"

    id_imagen = Column(Integer, primary_key=True, autoincrement=True)
    id_equipo = Column(Integer, ForeignKey("Equipos.id_equipo", ondelete="CASCADE"), nullable=True)
    descripcion_imagen = Column(String(150), nullable=True)
    ruta_imagen = Column(String(255), nullable=True)

    equipo = relationship("Equipo", back_populates="imagenes")


class ComponenteEquipo(Base):
    __tablename__ = "Componentes_Equipos"

    id_componente = Column(Integer, primary_key=True, autoincrement=True)
    id_equipo = Column(Integer, ForeignKey("Equipos.id_equipo", ondelete="CASCADE"), nullable=True)
    nombre_componente = Column(String(150), nullable=True)
    marca = Column(String(100), nullable=True)
    modelo = Column(String(100), nullable=True)
    serie_referencia = Column(String(100), nullable=True)

    equipo = relationship("Equipo", back_populates="componentes")


class RegistroMantenimiento(Base):
    __tablename__ = "Registro_Mantenimientos"

    id_registro_mantenimiento = Column(Integer, primary_key=True, autoincrement=True)
    id_equipo = Column(Integer, ForeignKey("Equipos.id_equipo", ondelete="CASCADE"), nullable=True)
    id_tipo_mantenimiento = Column(
        Integer, ForeignKey("Tipos_Mantenimiento.id_tipo_mantenimiento"), nullable=True
    )
    fecha_mantenimiento = Column(Date, nullable=True)
    responsable_mantenimiento = Column(String(150), nullable=True)
    costo = Column(Numeric(10, 2), nullable=True)
    ruta_evidencia_pdf = Column(String(255), nullable=True)

    equipo = relationship("Equipo", back_populates="mantenimientos")
    tipo_mantenimiento = relationship("TipoMantenimiento")


class RegistroCalibracion(Base):
    __tablename__ = "Registro_Calibraciones"

    id_registro_calibracion = Column(Integer, primary_key=True, autoincrement=True)
    id_equipo = Column(Integer, ForeignKey("Equipos.id_equipo", ondelete="CASCADE"), nullable=True)
    fecha_calibracion = Column(Date, nullable=True)
    entidad_calibradora = Column(String(150), nullable=True)
    resultado_conforme = Column(Boolean, nullable=True)
    ruta_certificado_pdf = Column(String(255), nullable=True)

    equipo = relationship("Equipo", back_populates="calibraciones")


class PrestamoEquipo(Base):
    __tablename__ = "Prestamos_Equipos"

    id_prestamo = Column(Integer, primary_key=True, autoincrement=True)
    id_equipo = Column(Integer, ForeignKey("Equipos.id_equipo", ondelete="CASCADE"), nullable=True)
    codigo_universidad = Column(String(50), nullable=True)
    nombre_solicitante = Column(String(150), nullable=True)
    fecha_hora_prestamo = Column(DateTime, nullable=True)
    fecha_hora_devolucion = Column(DateTime, nullable=True)
    estado_prestamo = Column(String(50), nullable=True)
    observaciones_entrega = Column(Text, nullable=True)
    observaciones_devolucion = Column(Text, nullable=True)

    equipo = relationship("Equipo", back_populates="prestamos")


# =======================================================
# MÓDULO DE USUARIOS Y ROLES (AUTENTICACIÓN)
# =======================================================
class Rol(Base):
    __tablename__ = "Roles"

    id_rol = Column(Integer, primary_key=True, autoincrement=True)
    nombre_rol = Column(String(50), nullable=False)
    descripcion = Column(String(150), nullable=True)

    usuarios = relationship("Usuario", back_populates="rol")


class Usuario(Base):
    __tablename__ = "Usuarios"

    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    nombre_completo = Column(String(150), nullable=False)
    correo_electronico = Column(String(100), unique=True, nullable=False)
    contrasena_hash = Column(String(255), nullable=False)
    id_rol = Column(Integer, ForeignKey("Roles.id_rol"), nullable=False)
    estado = Column(Enum("Activo", "Inactivo", name="estado_usuario_enum"), default="Activo")
    fecha_creacion = Column(DateTime, default=datetime.now)

    rol = relationship("Rol", back_populates="usuarios")


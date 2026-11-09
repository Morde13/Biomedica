-- =======================================================
-- FASE 1: JERARQUÍA Y UBICACIÓN
-- =======================================================
CREATE TABLE Sedes (
    id_sede INT AUTO_INCREMENT PRIMARY KEY,
    nombre_sede VARCHAR(100) NOT NULL
);

CREATE TABLE Laboratorios (
    id_laboratorio INT AUTO_INCREMENT PRIMARY KEY,
    nombre_laboratorio VARCHAR(100) NOT NULL,
    id_sede INT,
    FOREIGN KEY (id_sede) REFERENCES Sedes(id_sede)
);

-- =======================================================
-- TABLAS DE CATÁLOGO (PARAMÉTRICAS)
-- =======================================================
CREATE TABLE Tipos_Movilidad (
    id_tipo_movilidad INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);

CREATE TABLE Tipos_Adquisicion (
    id_tipo_adquisicion INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL
);

CREATE TABLE Clasificacion_Riesgos (
    id_riesgo INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);

CREATE TABLE Clasificacion_Usos (
    id_uso INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL
);

CREATE TABLE Tipos_Documentos (
    id_tipo_doc INT AUTO_INCREMENT PRIMARY KEY,
    nombre_tipo VARCHAR(100) NOT NULL
);

CREATE TABLE Catalogo_Fuente_Alimentacion (
    id_fuente INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL
);

CREATE TABLE Catalogo_Tecnologia (
    id_tecnologia INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL
);

CREATE TABLE Tipos_Mantenimiento (
    id_tipo_mantenimiento INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);

-- =======================================================
-- SOPORTE COMERCIAL
-- =======================================================
CREATE TABLE Proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre_proveedor VARCHAR(150) NOT NULL,
    nit VARCHAR(50),
    correo_electronico VARCHAR(100),
    direccion VARCHAR(200),
    pais_origen VARCHAR(100),
    telefono VARCHAR(50)
);

-- =======================================================
-- FASE 1 Y 5: TABLA PRINCIPAL DE EQUIPOS
-- =======================================================
CREATE TABLE Equipos (
    id_equipo INT AUTO_INCREMENT PRIMARY KEY,
    nombre_equipo VARCHAR(150) NOT NULL,
    fabricante VARCHAR(100),
    modelo VARCHAR(100),
    serie_universidad VARCHAR(100),
    serie_equipo VARCHAR(100),
    serie_laboratorio VARCHAR(100),
    registro_sanitario_invima VARCHAR(100),
    fecha_adquisicion DATE,
    valor_adquisicion DECIMAL(12, 2),
    responsable_equipo VARCHAR(150),
    periodicidad_mantenimiento_meses INT,
    requiere_calibracion BOOLEAN,
    periodicidad_calibracion_meses INT,
    id_laboratorio INT,
    id_tipo_movilidad INT,
    id_tipo_adquisicion INT,
    id_proveedor INT,
    id_riesgo INT,
    id_uso INT,
    FOREIGN KEY (id_laboratorio) REFERENCES Laboratorios(id_laboratorio),
    FOREIGN KEY (id_tipo_movilidad) REFERENCES Tipos_Movilidad(id_tipo_movilidad),
    FOREIGN KEY (id_tipo_adquisicion) REFERENCES Tipos_Adquisicion(id_tipo_adquisicion),
    FOREIGN KEY (id_proveedor) REFERENCES Proveedores(id_proveedor),
    FOREIGN KEY (id_riesgo) REFERENCES Clasificacion_Riesgos(id_riesgo),
    FOREIGN KEY (id_uso) REFERENCES Clasificacion_Usos(id_uso)
);

-- =======================================================
-- FASE 2: ESPECIFICACIONES TÉCNICAS (RELACIÓN 1:1)
-- =======================================================
CREATE TABLE Especificaciones_Tecnicas (
    id_especificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_equipo INT UNIQUE,
    id_fuente INT,
    id_tecnologia INT,
    voltaje_v VARCHAR(50),
    corriente_a VARCHAR(50),
    potencia_w VARCHAR(50),
    frecuencia_hz VARCHAR(50),
    presion VARCHAR(50),
    velocidad VARCHAR(50),
    peso_kg VARCHAR(50),
    temperatura VARCHAR(50),
    dimensiones VARCHAR(100),
    otros_instalacion TEXT,
    rango_voltaje VARCHAR(50),
    rango_corriente VARCHAR(50),
    rango_potencia VARCHAR(50),
    rango_presion VARCHAR(50),
    rango_velocidad VARCHAR(50),
    rango_humedad VARCHAR(50),
    rango_temperatura VARCHAR(50),
    otros_funcionamiento TEXT,
    FOREIGN KEY (id_equipo) REFERENCES Equipos(id_equipo) ON DELETE CASCADE,
    FOREIGN KEY (id_fuente) REFERENCES Catalogo_Fuente_Alimentacion(id_fuente),
    FOREIGN KEY (id_tecnologia) REFERENCES Catalogo_Tecnologia(id_tecnologia)
);

-- =======================================================
-- FASE 3, 4 Y 5: TABLAS DE DETALLE Y REGISTRO (RELACIONES 1:N)
-- =======================================================
CREATE TABLE Documentos_Equipos (
    id_documento INT AUTO_INCREMENT PRIMARY KEY,
    id_equipo INT,
    id_tipo_doc INT,
    ruta_archivo_pdf VARCHAR(255),
    FOREIGN KEY (id_equipo) REFERENCES Equipos(id_equipo) ON DELETE CASCADE,
    FOREIGN KEY (id_tipo_doc) REFERENCES Tipos_Documentos(id_tipo_doc)
);

CREATE TABLE Imagenes_Equipos (
    id_imagen INT AUTO_INCREMENT PRIMARY KEY,
    id_equipo INT,
    descripcion_imagen VARCHAR(150),
    ruta_imagen VARCHAR(255),
    FOREIGN KEY (id_equipo) REFERENCES Equipos(id_equipo) ON DELETE CASCADE
);

CREATE TABLE Componentes_Equipos (
    id_componente INT AUTO_INCREMENT PRIMARY KEY,
    id_equipo INT,
    nombre_componente VARCHAR(150),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    serie_referencia VARCHAR(100),
    FOREIGN KEY (id_equipo) REFERENCES Equipos(id_equipo) ON DELETE CASCADE
);

CREATE TABLE Registro_Mantenimientos (
    id_registro_mantenimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_equipo INT,
    id_tipo_mantenimiento INT,
    fecha_mantenimiento DATE,
    responsable_mantenimiento VARCHAR(150),
    costo DECIMAL(10, 2),
    ruta_evidencia_pdf VARCHAR(255),
    FOREIGN KEY (id_equipo) REFERENCES Equipos(id_equipo) ON DELETE CASCADE,
    FOREIGN KEY (id_tipo_mantenimiento) REFERENCES Tipos_Mantenimiento(id_tipo_mantenimiento)
);

CREATE TABLE Registro_Calibraciones (
    id_registro_calibracion INT AUTO_INCREMENT PRIMARY KEY,
    id_equipo INT,
    fecha_calibracion DATE,
    entidad_calibradora VARCHAR(150),
    resultado_conforme BOOLEAN,
    ruta_certificado_pdf VARCHAR(255),
    FOREIGN KEY (id_equipo) REFERENCES Equipos(id_equipo) ON DELETE CASCADE
);

CREATE TABLE Prestamos_Equipos (
    id_prestamo INT AUTO_INCREMENT PRIMARY KEY,
    id_equipo INT,
    codigo_universidad VARCHAR(50),
    nombre_solicitante VARCHAR(150),
    fecha_hora_prestamo DATETIME,
    fecha_hora_devolucion DATETIME,
    estado_prestamo VARCHAR(50),
    observaciones_entrega TEXT,
    observaciones_devolucion TEXT,
    FOREIGN KEY (id_equipo) REFERENCES Equipos(id_equipo) ON DELETE CASCADE
);

-- =======================================================
-- MÓDULO DE USUARIOS Y ROLES (AUTENTICACIÓN)
-- =======================================================
CREATE TABLE Roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL, -- Ej: 'Administrador', 'Laboratorista', 'Estudiante'
    descripcion VARCHAR(150)
);

CREATE TABLE Usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    correo_electronico VARCHAR(100) UNIQUE NOT NULL, -- Se usará como el "usuario" para el login
    contrasena_hash VARCHAR(255) NOT NULL, -- Aquí el backend guardará la contraseña encriptada
    id_rol INT NOT NULL,
    estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rol) REFERENCES Roles(id_rol)
);

-- =======================================================
-- DATOS INICIALES: ROL ADMINISTRADOR Y USUARIO ADMIN
-- =======================================================
INSERT INTO Roles (nombre_rol, descripcion) VALUES
('Administrador', 'Control total del sistema y gestión de perfiles'),
('Laboratorista', 'Gestión operativa de inventario, mantenimientos y préstamos'),
('Estudiante', 'Consulta básica sin acceso al panel administrativo');

INSERT INTO Usuarios (nombre_completo, correo_electronico, contrasena_hash, id_rol, estado)
VALUES (
    'Administrador Principal',
    'admin',
    SHA2('admin2026@', 256),
    (SELECT id_rol FROM Roles WHERE nombre_rol = 'Administrador' LIMIT 1),
    'Activo'
);



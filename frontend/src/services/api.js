const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Convierte cualquier imagen (.jpg, .png, etc.) a formato WebP optimizado
 * antes de enviarla al servidor para ahorrar espacio y acelerar la carga web.
 */
async function convertirImagenAWebP(file, maxDimension = 1400, quality = 0.82) {
  if (!file || !file.type || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const baseName = (file.name || 'imagen').replace(/\.[^/.]+$/, '');
          const webpFile = new File([blob], `${baseName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          resolve(webpFile);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

async function fetchJson(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || `Error HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  async obtenerEstado(forzar = false) {
    try {
      const qs = forzar ? '?forzar=true' : '';
      return await fetchJson(`/api/estado${qs}`);
    } catch (e) {
      return {
        conectado: false,
        esquema_listo: false,
        detalle: `No se pudo conectar con el servidor FastAPI: ${e.message}`,
        tablas_faltantes_esquema: [],
      };
    }
  },

  async obtenerLogo() {
    return {
      logo_url: '/img/escudo_universidad.png',
      nombre: 'escudo_universidad.png',
    };
  },

  async subirArchivo(categoria, file, meta = {}) {
    const archivoFinal =
      categoria === 'imagenes' ? await convertirImagenAWebP(file) : file;
    const formData = new FormData();
    formData.append('file', archivoFinal);
    if (meta.tipo_documento) {
      formData.append('tipo_documento', meta.tipo_documento);
    }
    if (meta.nombre_equipo) {
      formData.append('nombre_equipo', meta.nombre_equipo);
    }
    const res = await fetch(`${API_BASE}/api/upload/${categoria}`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || 'No se pudo subir el archivo al servidor FastAPI');
    }
    return res.json();
  },

  async eliminarArchivoTemporal(ruta) {
    if (!ruta) return;
    return fetchJson(`/api/upload?ruta=${encodeURIComponent(ruta)}`, {
      method: 'DELETE',
    });
  },

  async obtenerCatalogos() {
    return fetchJson('/api/catalogos');
  },

  async crearSede(nombre_sede) {
    return fetchJson('/api/sedes', {
      method: 'POST',
      body: JSON.stringify({ nombre_sede }),
    });
  },

  async eliminarSede(id_sede) {
    return fetchJson(`/api/sedes/${id_sede}`, { method: 'DELETE' });
  },

  async crearLaboratorio(payload) {
    return fetchJson('/api/laboratorios', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async eliminarLaboratorio(id_laboratorio) {
    return fetchJson(`/api/laboratorios/${id_laboratorio}`, { method: 'DELETE' });
  },

  async crearProveedor(payload) {
    return fetchJson('/api/proveedores', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async eliminarProveedor(id_proveedor) {
    return fetchJson(`/api/proveedores/${id_proveedor}`, { method: 'DELETE' });
  },

  async crearItemCatalogo(nombreCatalogo, valor) {
    return fetchJson(`/api/catalogos/${nombreCatalogo}`, {
      method: 'POST',
      body: JSON.stringify({ valor }),
    });
  },

  async eliminarItemCatalogo(nombreCatalogo, id_item) {
    return fetchJson(`/api/catalogos/${nombreCatalogo}/${id_item}`, {
      method: 'DELETE',
    });
  },

  async listarEquipos() {
    return fetchJson('/api/equipos');
  },

  async registrarEquipo(payload) {
    return fetchJson('/api/equipos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async actualizarEquipo(id_equipo, payload) {
    return fetchJson(`/api/equipos/${id_equipo}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async eliminarEquipo(id_equipo) {
    return fetchJson(`/api/equipos/${id_equipo}`, { method: 'DELETE' });
  },

  async agregarDocumentoEquipo(id_equipo, payload) {
    return fetchJson(`/api/equipos/${id_equipo}/documentos`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async eliminarDocumentoEquipo(id_documento) {
    return fetchJson(`/api/documentos/${id_documento}`, { method: 'DELETE' });
  },

  async agregarImagenEquipo(id_equipo, payload) {
    return fetchJson(`/api/equipos/${id_equipo}/imagenes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async eliminarImagenEquipo(id_imagen) {
    return fetchJson(`/api/imagenes/${id_imagen}`, { method: 'DELETE' });
  },

  async listarMantenimientos() {
    return fetchJson('/api/mantenimientos');
  },

  async crearMantenimiento(payload) {
    return fetchJson('/api/mantenimientos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async eliminarMantenimiento(id) {
    return fetchJson(`/api/mantenimientos/${id}`, { method: 'DELETE' });
  },

  async listarCalibraciones() {
    return fetchJson('/api/calibraciones');
  },

  async crearCalibracion(payload) {
    return fetchJson('/api/calibraciones', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async eliminarCalibracion(id) {
    return fetchJson(`/api/calibraciones/${id}`, { method: 'DELETE' });
  },

  async listarPrestamos() {
    return fetchJson('/api/prestamos');
  },

  async crearPrestamo(payload) {
    return fetchJson('/api/prestamos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async actualizarEstadoPrestamo(id_prestamo, payload) {
    return fetchJson(`/api/prestamos/${id_prestamo}/estado`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async eliminarPrestamo(id) {
    return fetchJson(`/api/prestamos/${id}`, { method: 'DELETE' });
  },

  async listarRoles() {
    return fetchJson('/api/roles');
  },

  async crearRol(payload) {
    return fetchJson('/api/roles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async listarUsuarios() {
    return fetchJson('/api/usuarios');
  },

  async crearUsuario(payload) {
    return fetchJson('/api/usuarios', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async actualizarUsuario(id_usuario, payload) {
    return fetchJson(`/api/usuarios/${id_usuario}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async eliminarUsuario(id_usuario) {
    return fetchJson(`/api/usuarios/${id_usuario}`, { method: 'DELETE' });
  },

  async iniciarSesion(correo_electronico, contrasena) {
    return fetchJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo_electronico, contrasena }),
    });
  },
};

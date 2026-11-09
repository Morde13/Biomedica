import React, { useState } from 'react';
import {
  Plus,
  Search,
  FlaskConical,
  Eye,
  Trash2,
  FileText,
  QrCode,
} from 'lucide-react';
import { api } from '../services/api';
import EquipoDetalleModal from '../components/EquipoDetalleModal';
import QrBarcodeScannerModal from '../components/QrBarcodeScannerModal';

export default function InventarioView({
  equipos,
  mantenimientos = [],
  calibraciones = [],
  catalogos,
  esquemaListo,
  onNavigate,
  onOpenCatalogos,
  onRefresh,
  readOnly = false,
}) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [equipoSeleccionadoId, setEquipoSeleccionadoId] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const filtrados = equipos.filter((eq) => {
    const texto = `${eq.nombre_equipo} ${eq.fabricante || ''} ${eq.modelo || ''} ${
      eq.serie_equipo || ''
    } ${eq.serie_universidad || ''} ${eq.serie_laboratorio || ''} ${
      eq.nombre_laboratorio || ''
    } ${eq.responsable_equipo || ''}`.toLowerCase();

    const cumpleTexto = texto.includes(busqueda.toLowerCase());
    if (!cumpleTexto) return false;
    if (filtroEstado === 'disponibles') return !eq.en_prestamo;
    if (filtroEstado === 'prestamo') return eq.en_prestamo;
    if (filtroEstado === 'calibracion') return eq.requiere_calibracion;
    return true;
  });

  const totalEquipos = String(equipos.length).padStart(2, '0');
  const requierenCalibracion = String(
    equipos.filter((e) => e.requiere_calibracion).length
  ).padStart(2, '0');
  const disponibles = String(equipos.filter((e) => !e.en_prestamo).length).padStart(2, '0');

  const equipoDetalle = equipos.find((e) => e.id_equipo === equipoSeleccionadoId) || null;

  const handleEliminar = async (eq) => {
    if (!window.confirm(`¿Eliminar el equipo "${eq.nombre_equipo}" y todos sus registros asociados?`)) {
      return;
    }
    await api.eliminarEquipo(eq.id_equipo, esquemaListo);
    await onRefresh();
  };

  return (
    <div className="space-y-7">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-[#5E7A6B] mb-1.5">
            GESTIÓN DE LABORATORIO &nbsp;/&nbsp; INVENTARIO CENTRAL
          </p>
          <h1 className="text-3xl font-extrabold text-[#14281D] tracking-tight">Inventario</h1>
          <p className="text-sm text-[#526B5C] mt-1">
            Consulta la ficha técnica, ubicación, datasheets y disponibilidad de los equipos registrados.
          </p>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('Registro de equipo')}
              className="px-5 py-2.5 rounded-xl bg-[#1B5E43] text-white text-sm font-semibold hover:bg-[#144732] transition-colors shadow-xs flex items-center gap-2"
            >
              <Plus size={17} />
              Registrar equipo
            </button>
          </div>
        )}
      </div>

      {/* 3 Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
          <p className="text-xs font-medium text-[#526B5C]">Total de equipos</p>
          <p className="text-4xl font-extrabold text-[#14281D] my-2.5 tracking-tight">
            {totalEquipos}
          </p>
          <p className="text-xs text-[#6B8576]">Asociados al espacio de trabajo actual</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
          <p className="text-xs font-medium text-[#526B5C]">Disponibles en planta</p>
          <p className="text-4xl font-extrabold text-[#14281D] my-2.5 tracking-tight">
            {disponibles}
          </p>
          <p className="text-xs text-[#6B8576]">Listos para práctica o préstamo</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
          <p className="text-xs font-medium text-[#526B5C]">Sujetos a calibración</p>
          <p className="text-4xl font-extrabold text-[#14281D] my-2.5 tracking-tight">
            {requierenCalibracion}
          </p>
          <p className="text-xs text-[#6B8576]">Con control metrológico periódico</p>
        </div>
      </div>

      {/* Contenedor Tabla Principal */}
      <div className="bg-white rounded-2xl border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)] overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#14281D]">Equipos del laboratorio</h2>
              <p className="text-xs text-[#6B8576] mt-0.5">
                Registros vinculados con especificaciones técnicas, datasheets e imágenes
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#EFF5F1] text-[#234735] text-xs font-semibold">
              {filtrados.length} registros
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B8576] pointer-events-none"
              />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, serie universidad, serie lab..."
                className="w-full pl-10 pr-11 py-2.5 text-sm bg-white border border-emerald-100 rounded-xl focus:outline-none focus:border-[#1B5E43] placeholder:text-[#8BA395]"
              />
              {/* Ícono QR integrado dentro de la barra de búsqueda */}
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                title="Iniciar cámara para buscar por QR o Código de Barras"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#1B5E43] hover:bg-[#E7F5ED] transition-colors flex items-center justify-center"
              >
                <QrCode size={17} />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'disponibles', label: 'Disponibles' },
                { id: 'prestamo', label: 'En préstamo' },
                { id: 'calibracion', label: 'Con calibración' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFiltroEstado(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    filtroEstado === f.id
                      ? 'bg-[#1B5E43] text-white'
                      : 'bg-[#F4F8F6] text-[#4C6758] hover:bg-emerald-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-emerald-100/80 bg-[#FAFDFB] text-[11px] font-bold uppercase tracking-wider text-[#6B8576]">
                <th className="py-3.5 px-6">Equipo</th>
                <th className="py-3.5 px-4">Series (Univ / Lab / Fáb)</th>
                <th className="py-3.5 px-4">Laboratorio / Sede</th>
                <th className="py-3.5 px-4">Responsable y Riesgo</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-6 text-right">Hoja de vida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 text-sm">
              {filtrados.map((eq) => {
                const primeraImg = eq.imagenes?.[0]?.ruta_imagen;
                return (
                  <tr
                    key={eq.id_equipo}
                    className="hover:bg-[#F7FBF8] transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        {primeraImg ? (
                          <img
                            src={primeraImg}
                            alt={eq.nombre_equipo}
                            className="w-10 h-10 rounded-xl object-cover border border-emerald-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-[#EEF6F1] border border-emerald-100 flex items-center justify-center text-[#1B5E43] shrink-0">
                            <FlaskConical size={18} />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-[#14281D]">{eq.nombre_equipo}</p>
                          <p className="text-xs text-[#6B8576]">
                            {eq.fabricante || 'Sin marca'} · {eq.modelo || 'Sin modelo'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-semibold text-xs text-[#14281D]">
                        Univ: {eq.serie_universidad || '—'} · Lab: {eq.serie_laboratorio || '—'}
                      </p>
                      <p className="text-xs text-[#6B8576]">
                        Fábrica: {eq.serie_equipo || '—'}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-semibold text-xs text-[#14281D]">
                        {eq.nombre_laboratorio || 'Sin asignar'}
                      </p>
                      <p className="text-xs text-[#6B8576]">{eq.nombre_sede || '—'}</p>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-semibold text-xs text-[#14281D]">
                        {eq.responsable_equipo || 'No asignado'}
                      </p>
                      <p className="text-xs text-[#6B8576]">
                        {eq.riesgo_descripcion || eq.uso_descripcion || 'Uso general'}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      {eq.en_prestamo ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#1B5E43] text-[#1B5E43]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E43]" />
                          En préstamo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E7F5ED] text-[#145338]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E43]" />
                          Disponible
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {(eq.documentos || []).length > 0 && (
                          <a
                            href={eq.documentos[0].ruta_archivo_pdf}
                            target="_blank"
                            rel="noreferrer"
                            title="Abrir Datasheet PDF"
                            className="p-2 rounded-xl bg-[#EEF6F1] text-[#1B5E43] hover:bg-emerald-100 transition-colors"
                          >
                            <FileText size={15} />
                          </a>
                        )}
                        <button
                          onClick={() => setEquipoSeleccionadoId(eq.id_equipo)}
                          className="px-3 py-1.5 rounded-xl bg-[#EEF6F1] text-[#1B5E43] hover:bg-[#1B5E43] hover:text-white transition-colors text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Eye size={14} />
                          Ficha
                        </button>
                        {!readOnly && (
                          <button
                            onClick={() => handleEliminar(eq)}
                            title="Eliminar equipo"
                            className="p-2 rounded-xl text-[#6B8576] hover:bg-emerald-50 hover:text-[#14281D] transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtrados.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-sm text-[#6B8576]">
                    No se encontraron equipos con los criterios seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {equipoDetalle && (
        <EquipoDetalleModal
          equipo={equipoDetalle}
          mantenimientos={mantenimientos}
          calibraciones={calibraciones}
          catalogos={catalogos}
          esquemaListo={esquemaListo}
          readOnly={readOnly}
          onOpenCatalogos={onOpenCatalogos}
          onClose={() => setEquipoSeleccionadoId(null)}
          onRefresh={onRefresh}
        />
      )}

      <QrBarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(codigo) => setBusqueda(codigo)}
        title="Buscar equipo en Inventario por QR o Código de Barras"
      />
    </div>
  );
}

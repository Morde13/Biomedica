import React, { useState } from 'react';
import {
  Plus,
  Search,
  FlaskConical,
  Check,
  RotateCcw,
  Trash2,
  X,
  QrCode,
} from 'lucide-react';
import { api } from '../services/api';
import EquipoSearchSelect from '../components/EquipoSearchSelect';
import QrBarcodeScannerModal from '../components/QrBarcodeScannerModal';

function formatearFechaHora(iso) {
  if (!iso) return 'Pendiente';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function PrestamosView({
  prestamos,
  equipos,
  esquemaListo,
  onRefresh,
}) {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [scannerModo, setScannerModo] = useState(null); // 'historial' | 'formulario' | null

  const ahoraLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const [form, setForm] = useState({
    equipos_ids: [],
    codigo_universidad: '',
    nombre_solicitante: '',
    fecha_hora_prestamo: ahoraLocal,
    fecha_hora_devolucion: '',
    estado_prestamo: 'Activo',
    observaciones_entrega: '',
    observaciones_devolucion: '',
  });

  const filtrados = prestamos.filter((p) => {
    const q = `${p.nombre_equipo} ${p.nombre_solicitante || ''} ${
      p.codigo_universidad || ''
    } ${p.serie_equipo || ''} ${p.estado_prestamo || ''}`.toLowerCase();
    return q.includes(busqueda.toLowerCase());
  });

  const totalRegistros = String(prestamos.length).padStart(2, '0');
  const activosOVencidos = String(
    prestamos.filter((p) => (p.estado_prestamo || '').toLowerCase() !== 'devuelto').length
  ).padStart(2, '0');
  const equiposRelacionados = String(
    new Set(prestamos.map((p) => p.id_equipo)).size
  ).padStart(2, '0');

  const handleCodigoDetectado = (codigo) => {
    if (scannerModo === 'historial') {
      setBusqueda(codigo);
      return;
    }

    if (scannerModo === 'formulario') {
      const q = codigo.toLowerCase();
      const encontrado = equipos.find(
        (eq) =>
          (eq.serie_universidad || '').toLowerCase() === q ||
          (eq.serie_laboratorio || '').toLowerCase() === q ||
          (eq.serie_equipo || '').toLowerCase() === q ||
          `${eq.nombre_equipo} ${eq.serie_universidad || ''} ${eq.serie_laboratorio || ''}`
            .toLowerCase()
            .includes(q)
      );
      if (encontrado) {
        const strId = String(encontrado.id_equipo);
        setForm((prev) => ({
          ...prev,
          equipos_ids: prev.equipos_ids.includes(strId)
            ? prev.equipos_ids
            : [...prev.equipos_ids, strId],
        }));
      } else {
        alert(`No se encontró un equipo con el código o serie "${codigo}".`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      form.equipos_ids.length === 0 ||
      !form.nombre_solicitante.trim() ||
      !form.codigo_universidad.trim()
    ) {
      alert('Selecciona al menos un equipo y completa los datos del solicitante.');
      return;
    }
    setGuardando(true);
    try {
      for (const idEq of form.equipos_ids) {
        await api.crearPrestamo(
          {
            id_equipo: Number(idEq),
            codigo_universidad: form.codigo_universidad.trim(),
            nombre_solicitante: form.nombre_solicitante.trim(),
            fecha_hora_prestamo: form.fecha_hora_prestamo,
            fecha_hora_devolucion: form.fecha_hora_devolucion || null,
            estado_prestamo: form.estado_prestamo,
            observaciones_entrega: form.observaciones_entrega || null,
            observaciones_devolucion: form.observaciones_devolucion || null,
          },
          esquemaListo
        );
      }
      await onRefresh();
      setForm({
        equipos_ids: [],
        codigo_universidad: '',
        nombre_solicitante: '',
        fecha_hora_prestamo: ahoraLocal,
        fecha_hora_devolucion: '',
        estado_prestamo: 'Activo',
        observaciones_entrega: '',
        observaciones_devolucion: '',
      });
      setMostrarForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const marcarDevuelto = async (prestamo) => {
    const obs = window.prompt(
      'Observaciones de devolución (opcional):',
      prestamo.observaciones_devolucion || 'Recibido conforme en laboratorio.'
    );
    if (obs === null) return;
    await api.actualizarEstadoPrestamo(
      prestamo.id_prestamo,
      {
        estado_prestamo: 'Devuelto',
        fecha_hora_devolucion: new Date().toISOString(),
        observaciones_devolucion: obs,
      },
      esquemaListo
    );
    await onRefresh();
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este registro de préstamo?')) return;
    await api.eliminarPrestamo(id, esquemaListo);
    await onRefresh();
  };

  return (
    <div className="space-y-7">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-[#5E7A6B] mb-1.5">
            GESTIÓN DE LABORATORIO &nbsp;/&nbsp; SEGUIMIENTO
          </p>
          <h1 className="text-3xl font-extrabold text-[#14281D] tracking-tight">Préstamos</h1>
          <p className="text-sm text-[#526B5C] mt-1">
            Consulta el historial y el estado de los registros de préstamo.
          </p>
        </div>

        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="px-5 py-2.5 rounded-xl bg-[#1B5E43] text-white text-sm font-semibold hover:bg-[#144732] transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          {mostrarForm ? <X size={17} /> : <Plus size={17} />}
          {mostrarForm ? 'Cerrar formulario' : 'Registrar préstamo'}
        </button>
      </div>

      {/* Formulario de Préstamo (Permite elegir varios equipos para un mismo estudiante) */}
      {mostrarForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-emerald-200 p-6 space-y-5 shadow-[0_4px_20px_rgba(20,40,29,0.05)]"
        >
          <div className="border-b border-emerald-100 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#14281D]">
              Registrar Préstamo de Equipo(s)
            </h3>
            <span className="text-xs font-semibold text-[#145338] bg-[#E7F5ED] px-3 py-1 rounded-full">
              Puedes seleccionar varios equipos para el mismo estudiante
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Equipos Solicitados (Busca por nombre, serie universidad o serie laboratorio y selecciona uno o varios) *
              </label>
              <EquipoSearchSelect
                equipos={equipos}
                multiple={true}
                values={form.equipos_ids}
                onChange={(ids) => setForm({ ...form, equipos_ids: ids })}
                onOpenScanner={() => setScannerModo('formulario')}
                placeholder="-- Buscar y seleccionar uno o varios equipos para prestar --"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Nombre del Solicitante *
              </label>
              <input
                type="text"
                required
                value={form.nombre_solicitante}
                onChange={(e) => setForm({ ...form, nombre_solicitante: e.target.value })}
                placeholder="Ej: Camila Ríos"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Código Universidad *
              </label>
              <input
                type="text"
                required
                value={form.codigo_universidad}
                onChange={(e) => setForm({ ...form, codigo_universidad: e.target.value })}
                placeholder="Ej: 202400123"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Estado Inicial
              </label>
              <select
                value={form.estado_prestamo}
                onChange={(e) => setForm({ ...form, estado_prestamo: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
              >
                <option value="Activo">Activo</option>
                <option value="Devuelto">Devuelto</option>
                <option value="Vencido">Vencido</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Fecha y Hora de Préstamo *
              </label>
              <input
                type="datetime-local"
                required
                value={form.fecha_hora_prestamo}
                onChange={(e) => setForm({ ...form, fecha_hora_prestamo: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Fecha y Hora Estimada Devolución
              </label>
              <input
                type="datetime-local"
                value={form.fecha_hora_devolucion}
                onChange={(e) => setForm({ ...form, fecha_hora_devolucion: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Observaciones de Entrega
              </label>
              <textarea
                rows="2"
                value={form.observaciones_entrega}
                onChange={(e) => setForm({ ...form, observaciones_entrega: e.target.value })}
                placeholder="Estado físico del equipo al momento del préstamo, accesorios incluidos..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 rounded-xl bg-white border border-emerald-200 text-xs font-semibold text-[#14281D]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2 rounded-xl bg-[#1B5E43] text-white text-xs font-semibold hover:bg-[#144732] flex items-center gap-1.5"
            >
              <Check size={15} />
              {guardando
                ? 'Registrando...'
                : form.equipos_ids.length > 1
                ? `Guardar préstamo (${form.equipos_ids.length} equipos)`
                : 'Guardar préstamo'}
            </button>
          </div>
        </form>
      )}

      {/* 3 Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
          <p className="text-xs font-medium text-[#526B5C]">Total de registros</p>
          <p className="text-4xl font-extrabold text-[#14281D] my-2.5 tracking-tight">
            {totalRegistros}
          </p>
          <p className="text-xs text-[#6B8576]">Asociados a equipos del laboratorio</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
          <p className="text-xs font-medium text-[#526B5C]">Activos o vencidos</p>
          <p className="text-4xl font-extrabold text-[#14281D] my-2.5 tracking-tight">
            {activosOVencidos}
          </p>
          <p className="text-xs text-[#6B8576]">Revisar fecha de devolución</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
          <p className="text-xs font-medium text-[#526B5C]">Equipos relacionados</p>
          <p className="text-4xl font-extrabold text-[#14281D] my-2.5 tracking-tight">
            {equiposRelacionados}
          </p>
          <p className="text-xs text-[#6B8576]">Con actividad registrada</p>
        </div>
      </div>

      {/* Historial de préstamo */}
      <div className="bg-white rounded-2xl border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)] overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#14281D]">Historial de préstamo</h2>
              <p className="text-xs text-[#6B8576] mt-0.5">
                Registros vinculados a sus equipos
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#EFF5F1] text-[#234735] text-xs font-semibold">
              {filtrados.length} registros
            </span>
          </div>

          <div className="relative w-full md:max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B8576] pointer-events-none"
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por equipo, serie, solicitante o código..."
              className="w-full pl-10 pr-11 py-2.5 text-sm bg-white border border-emerald-100 rounded-xl focus:outline-none focus:border-[#1B5E43] placeholder:text-[#8BA395]"
            />
            {/* Ícono QR integrado dentro de la barra de búsqueda */}
            <button
              type="button"
              onClick={() => setScannerModo('historial')}
              title="Iniciar cámara para buscar préstamo por QR o Código de Barras"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#1B5E43] hover:bg-[#E7F5ED] transition-colors flex items-center justify-center"
            >
              <QrCode size={17} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-emerald-100/80 bg-[#FAFDFB] text-[11px] font-bold uppercase tracking-wider text-[#6B8576]">
                <th className="py-3.5 px-6">Equipo</th>
                <th className="py-3.5 px-4">Solicitante</th>
                <th className="py-3.5 px-4">Fecha de préstamo</th>
                <th className="py-3.5 px-4">Devolución</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-6 text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 text-sm">
              {filtrados.map((p) => {
                const esDevuelto = (p.estado_prestamo || '').toLowerCase() === 'devuelto';
                return (
                  <tr key={p.id_prestamo} className="hover:bg-[#F7FBF8] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#EEF6F1] border border-emerald-100 flex items-center justify-center text-[#1B5E43] shrink-0">
                          <FlaskConical size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-[#14281D]">{p.nombre_equipo}</p>
                          <p className="text-xs text-[#6B8576]">
                            {p.observaciones_entrega || 'Equipo relacionado'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-bold text-[#14281D]">{p.nombre_solicitante}</p>
                      <p className="text-xs text-[#6B8576]">
                        Código universidad: {p.codigo_universidad}
                      </p>
                    </td>

                    <td className="py-4 px-4 text-xs font-medium text-[#526B5C]">
                      {formatearFechaHora(p.fecha_hora_prestamo)}
                    </td>

                    <td className="py-4 px-4 text-xs font-medium text-[#526B5C]">
                      {formatearFechaHora(p.fecha_hora_devolucion)}
                    </td>

                    <td className="py-4 px-4">
                      {esDevuelto ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E7F5ED] text-[#145338]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E43]" />
                          Devuelto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#1B5E43] text-[#1B5E43]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E43]" />
                          {p.estado_prestamo || 'Activo'}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {!esDevuelto && (
                          <button
                            onClick={() => marcarDevuelto(p)}
                            className="px-3 py-1.5 rounded-xl bg-[#EEF6F1] text-[#1B5E43] hover:bg-[#1B5E43] hover:text-white transition-colors text-xs font-semibold flex items-center gap-1.5"
                          >
                            <RotateCcw size={13} /> Recibir
                          </button>
                        )}
                        <button
                          onClick={() => handleEliminar(p.id_prestamo)}
                          className="p-2 rounded-xl text-[#6B8576] hover:bg-emerald-50 hover:text-[#14281D]"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtrados.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-sm text-[#6B8576]">
                    No se encontraron préstamos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <QrBarcodeScannerModal
        isOpen={Boolean(scannerModo)}
        onClose={() => setScannerModo(null)}
        onDetected={handleCodigoDetectado}
        title={
          scannerModo === 'formulario'
            ? 'Escanear QR / Código de Barras para agregar equipo al préstamo'
            : 'Buscar préstamo por QR o Código de Barras'
        }
      />
    </div>
  );
}

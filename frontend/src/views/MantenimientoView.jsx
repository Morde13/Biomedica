import React, { useState } from 'react';
import {
  Plus,
  Search,
  Wrench,
  Upload,
  FileText,
  Trash2,
  X,
  Check,
  QrCode,
} from 'lucide-react';
import { api } from '../services/api';
import EquipoSearchSelect from '../components/EquipoSearchSelect';
import QrBarcodeScannerModal from '../components/QrBarcodeScannerModal';

function formatearFechaCorta(iso) {
  if (!iso) return '—';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MantenimientoView({
  mantenimientos,
  equipos,
  catalogos,
  esquemaListo,
  onOpenCatalogos,
  onRefresh,
}) {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [scannerModo, setScannerModo] = useState(null); // 'formulario' | 'historial' | null
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    id_equipo: '',
    id_tipo_mantenimiento: '',
    fecha_mantenimiento: new Date().toISOString().slice(0, 10),
    responsable_mantenimiento: '',
    costo: '',
    ruta_evidencia_pdf: '',
    nombre_pdf: '',
  });

  const filtrados = mantenimientos.filter((m) => {
    const eqRel = equipos.find((e) => Number(e.id_equipo) === Number(m.id_equipo));
    const q = `${m.nombre_equipo} ${m.tipo_mantenimiento || ''} ${
      m.responsable_mantenimiento || ''
    } ${m.serie_equipo || ''} ${eqRel?.serie_universidad || ''} ${
      eqRel?.serie_laboratorio || ''
    }`.toLowerCase();
    return q.includes(busqueda.toLowerCase());
  });

  const totalRegistros = String(mantenimientos.length).padStart(2, '0');
  const equiposUnicos = String(
    new Set(mantenimientos.map((m) => m.id_equipo)).size
  ).padStart(2, '0');
  const inversionTotal = mantenimientos.reduce((acc, m) => acc + Number(m.costo || 0), 0);

  const handleCodigoDetectado = (codigo) => {
    if (scannerModo === 'historial') {
      setBusqueda(codigo);
      return;
    }
    if (scannerModo === 'formulario') {
      const q = codigo.trim().toLowerCase();
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
        setForm((prev) => ({ ...prev, id_equipo: String(encontrado.id_equipo) }));
      } else {
        alert(`No se encontró un equipo con el código o serie "${codigo}".`);
      }
    }
  };

  const handleUploadEvidencia = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    try {
      const res = await api.subirArchivo('mantenimientos', file);
      setForm((prev) => ({
        ...prev,
        ruta_evidencia_pdf: res.ruta,
        nombre_pdf: file.name,
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id_equipo || !form.fecha_mantenimiento) return;
    setGuardando(true);
    try {
      await api.crearMantenimiento(
        {
          id_equipo: Number(form.id_equipo),
          id_tipo_mantenimiento: form.id_tipo_mantenimiento
            ? Number(form.id_tipo_mantenimiento)
            : null,
          fecha_mantenimiento: form.fecha_mantenimiento,
          responsable_mantenimiento: form.responsable_mantenimiento || null,
          costo: form.costo !== '' ? Number(form.costo) : 0,
          ruta_evidencia_pdf: form.ruta_evidencia_pdf || null,
        },
        esquemaListo
      );
      await onRefresh();
      setForm({
        id_equipo: '',
        id_tipo_mantenimiento: '',
        fecha_mantenimiento: new Date().toISOString().slice(0, 10),
        responsable_mantenimiento: '',
        costo: '',
        ruta_evidencia_pdf: '',
        nombre_pdf: '',
      });
      setMostrarForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este registro de mantenimiento?')) return;
    await api.eliminarMantenimiento(id, esquemaListo);
    await onRefresh();
  };

  return (
    <div className="space-y-7">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-[#5E7A6B] mb-1.5">
            GESTIÓN DE LABORATORIO &nbsp;/&nbsp; INTERVENCIÓN TÉCNICA
          </p>
          <h1 className="text-3xl font-extrabold text-[#14281D] tracking-tight">
            Registro de mantenimiento
          </h1>
          <p className="text-sm text-[#526B5C] mt-1">
            Administra los mantenimientos preventivos, correctivos y sus evidencias PDF en /mantenimientos.
          </p>
        </div>

        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="px-5 py-2.5 rounded-xl bg-[#1B5E43] text-white text-sm font-semibold hover:bg-[#144732] transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          {mostrarForm ? <X size={17} /> : <Plus size={17} />}
          {mostrarForm ? 'Cerrar formulario' : 'Registrar mantenimiento'}
        </button>
      </div>

      {/* Formulario desplegable limpio */}
      {mostrarForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-emerald-200 p-6 space-y-5 shadow-[0_4px_20px_rgba(20,40,29,0.05)]"
        >
          <div className="border-b border-emerald-100 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#14281D]">
              Nuevo Registro de Mantenimiento
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Seleccionar Equipo *
              </label>
              <EquipoSearchSelect
                equipos={equipos}
                multiple={false}
                value={form.id_equipo}
                onChange={(idSel) => setForm({ ...form, id_equipo: idSel })}
                onOpenScanner={() => setScannerModo('formulario')}
                placeholder="Escribe nombre, serie o escanea QR / Barras..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Tipo de Mantenimiento
              </label>
              <div className="flex gap-1.5">
                <select
                  value={form.id_tipo_mantenimiento}
                  onChange={(e) => setForm({ ...form, id_tipo_mantenimiento: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
                >
                  <option value="">-- Seleccionar tipo --</option>
                  {(catalogos.tipos_mantenimiento || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.descripcion}
                    </option>
                  ))}
                </select>
                {onOpenCatalogos && (
                  <button
                    type="button"
                    title="Agregar Tipo de Mantenimiento"
                    onClick={() =>
                      onOpenCatalogos({
                        tab: 'parametricas',
                        focus: 'catalogo',
                        catKey: 'tipos_mantenimiento',
                        title: 'Agregar Tipo de Mantenimiento',
                        onCreated: (id) =>
                          setForm((prev) => ({ ...prev, id_tipo_mantenimiento: String(id) })),
                      })
                    }
                    className="px-3 py-2.5 rounded-xl bg-[#EEF6F1] border border-emerald-200 text-[#1B5E43] hover:bg-[#1B5E43] hover:text-white transition-colors shrink-0 flex items-center justify-center"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Fecha de Mantenimiento *
              </label>
              <input
                type="date"
                required
                value={form.fecha_mantenimiento}
                onChange={(e) => setForm({ ...form, fecha_mantenimiento: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Responsable Técnico
              </label>
              <input
                type="text"
                value={form.responsable_mantenimiento}
                onChange={(e) => setForm({ ...form, responsable_mantenimiento: e.target.value })}
                placeholder="Ingeniero o empresa ejecutora"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Costo Asociado ($ COP)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.costo}
                onChange={(e) => setForm({ ...form, costo: e.target.value })}
                placeholder="Ej: 350000"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Evidencia PDF
              </label>
              <label className="w-full px-3.5 py-2.5 text-sm bg-[#FAFDFB] border border-dashed border-emerald-300 rounded-xl cursor-pointer hover:border-[#1B5E43] flex items-center justify-between">
                <span className="text-xs text-[#2E4839] truncate">
                  {subiendo
                    ? 'Subiendo PDF...'
                    : form.nombre_pdf || 'Seleccionar reporte PDF...'}
                </span>
                <Upload size={15} className="text-[#1B5E43] shrink-0" />
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleUploadEvidencia}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
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
              {guardando ? 'Guardando...' : 'Guardar mantenimiento'}
            </button>
          </div>
        </form>
      )}

      {/* 3 KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
          <p className="text-xs font-medium text-[#526B5C]">Total de registros</p>
          <p className="text-4xl font-extrabold text-[#14281D] my-2.5 tracking-tight">
            {totalRegistros}
          </p>
          <p className="text-xs text-[#6B8576]">Intervenciones técnicas documentadas</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
          <p className="text-xs font-medium text-[#526B5C]">Equipos intervenidos</p>
          <p className="text-4xl font-extrabold text-[#14281D] my-2.5 tracking-tight">
            {equiposUnicos}
          </p>
          <p className="text-xs text-[#6B8576]">Con bitácora activa de soporte</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
          <p className="text-xs font-medium text-[#526B5C]">Inversión acumulada</p>
          <p className="text-3xl font-extrabold text-[#14281D] my-3 tracking-tight">
            ${inversionTotal.toLocaleString('es-CO')}
          </p>
          <p className="text-xs text-[#6B8576]">Costo consolidado de mantenimientos</p>
        </div>
      </div>

      {/* Tabla Historial */}
      <div className="bg-white rounded-2xl border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)] overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#14281D]">Historial de mantenimiento</h2>
              <p className="text-xs text-[#6B8576] mt-0.5">
                Registros vinculados a sus equipos y evidencias PDF
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
              placeholder="Buscar por equipo, serie, tipo o responsable..."
              className="w-full pl-10 pr-11 py-2.5 text-sm bg-white border border-emerald-100 rounded-xl focus:outline-none focus:border-[#1B5E43] placeholder:text-[#8BA395]"
            />
            <button
              type="button"
              onClick={() => setScannerModo('historial')}
              title="Iniciar cámara para buscar en historial de mantenimiento por QR o Código de Barras"
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
                <th className="py-3.5 px-4">Responsable</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Costo</th>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-6 text-right">Evidencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 text-sm">
              {filtrados.map((m) => (
                <tr key={m.id_registro_mantenimiento} className="hover:bg-[#F7FBF8] transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#EEF6F1] border border-emerald-100 flex items-center justify-center text-[#1B5E43] shrink-0">
                        <Wrench size={17} />
                      </div>
                      <div>
                        <p className="font-bold text-[#14281D]">{m.nombre_equipo}</p>
                        <p className="text-xs text-[#6B8576]">
                          Serie: {m.serie_equipo || 'Equipo relacionado'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-semibold text-xs text-[#14281D]">
                      {m.responsable_mantenimiento || 'Técnico interno'}
                    </p>
                    <p className="text-xs text-[#6B8576]">{m.nombre_laboratorio || 'Laboratorio'}</p>
                  </td>
                  <td className="py-4 px-4 text-xs font-medium text-[#526B5C]">
                    {formatearFechaCorta(m.fecha_mantenimiento)}
                  </td>
                  <td className="py-4 px-4 text-xs font-bold text-[#14281D]">
                    ${Number(m.costo || 0).toLocaleString('es-CO')}
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E7F5ED] text-[#145338]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E43]" />
                      {m.tipo_mantenimiento}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-2">
                      {m.ruta_evidencia_pdf ? (
                        <a
                          href={m.ruta_evidencia_pdf}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#EEF6F1] text-[#1B5E43] hover:bg-[#1B5E43] hover:text-white transition-colors text-xs font-semibold flex items-center gap-1.5"
                        >
                          <FileText size={14} /> Ver PDF
                        </a>
                      ) : (
                        <span className="text-xs text-[#8BA395]">Sin PDF</span>
                      )}
                      <button
                        onClick={() => handleEliminar(m.id_registro_mantenimiento)}
                        className="p-2 rounded-xl text-[#6B8576] hover:bg-emerald-50 hover:text-[#14281D]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-sm text-[#6B8576]">
                    No se encontraron registros de mantenimiento.
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
            ? 'Escanear QR / Código de Barras para seleccionar equipo en Mantenimiento'
            : 'Buscar mantenimiento por QR o Código de Barras'
        }
      />
    </div>
  );
}

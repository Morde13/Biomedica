import React, { useState } from 'react';
import {
  Plus,
  Search,
  Activity,
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

export default function CalibracionView({
  calibraciones,
  equipos,
  esquemaListo,
  onRefresh,
}) {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [scannerModo, setScannerModo] = useState(null); // 'formulario' | 'historial' | null
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    id_equipo: '',
    fecha_calibracion: new Date().toISOString().slice(0, 10),
    entidad_calibradora: '',
    resultado_conforme: true,
    ruta_certificado_pdf: '',
    nombre_pdf: '',
  });

  const filtrados = calibraciones.filter((c) => {
    const eqRel = equipos.find((e) => Number(e.id_equipo) === Number(c.id_equipo));
    const q = `${c.nombre_equipo} ${c.entidad_calibradora || ''} ${
      c.serie_equipo || ''
    } ${eqRel?.serie_universidad || ''} ${eqRel?.serie_laboratorio || ''}`.toLowerCase();
    return q.includes(busqueda.toLowerCase());
  });

  const totalRegistros = String(calibraciones.length).padStart(2, '0');
  const conformes = String(
    calibraciones.filter((c) => c.resultado_conforme).length
  ).padStart(2, '0');
  const equiposRelacionados = String(
    new Set(calibraciones.map((c) => c.id_equipo)).size
  ).padStart(2, '0');

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

  const handleUploadCertificado = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    try {
      const res = await api.subirArchivo('calibraciones', file);
      setForm((prev) => ({
        ...prev,
        ruta_certificado_pdf: res.ruta,
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
    if (!form.id_equipo || !form.entidad_calibradora.trim()) return;
    setGuardando(true);
    try {
      await api.crearCalibracion(
        {
          id_equipo: Number(form.id_equipo),
          fecha_calibracion: form.fecha_calibracion,
          entidad_calibradora: form.entidad_calibradora.trim(),
          resultado_conforme: Boolean(form.resultado_conforme),
          ruta_certificado_pdf: form.ruta_certificado_pdf || null,
        },
        esquemaListo
      );
      await onRefresh();
      setForm({
        id_equipo: '',
        fecha_calibracion: new Date().toISOString().slice(0, 10),
        entidad_calibradora: '',
        resultado_conforme: true,
        ruta_certificado_pdf: '',
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
    if (!window.confirm('¿Eliminar este certificado de calibración?')) return;
    await api.eliminarCalibracion(id, esquemaListo);
    await onRefresh();
  };

  return (
    <div className="space-y-7">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-[#5E7A6B] mb-1.5">
            GESTIÓN DE LABORATORIO &nbsp;/&nbsp; ASEGURAMIENTO METROLÓGICO
          </p>
          <h1 className="text-3xl font-extrabold text-[#14281D] tracking-tight">
            Registro de calibración
          </h1>
          <p className="text-sm text-[#526B5C] mt-1">
            Controla la conformidad metrológica y resguarda los certificados PDF en /calibraciones.
          </p>
        </div>

        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="px-5 py-2.5 rounded-xl bg-[#1B5E43] text-white text-sm font-semibold hover:bg-[#144732] transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          {mostrarForm ? <X size={17} /> : <Plus size={17} />}
          {mostrarForm ? 'Cerrar formulario' : 'Registrar calibración'}
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-emerald-200 p-6 space-y-5 shadow-[0_4px_20px_rgba(20,40,29,0.05)]"
        >
          <div className="border-b border-emerald-100 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#14281D]">
              Nueva Calibración
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Fecha de Calibración *
              </label>
              <input
                type="date"
                required
                value={form.fecha_calibracion}
                onChange={(e) => setForm({ ...form, fecha_calibracion: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Entidad Calibradora *
              </label>
              <input
                type="text"
                required
                value={form.entidad_calibradora}
                onChange={(e) => setForm({ ...form, entidad_calibradora: e.target.value })}
                placeholder="Ej: Metrología Biomédica Acreditada ONAC S.A.S."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Resultado de Conformidad
              </label>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, resultado_conforme: true })}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                    form.resultado_conforme
                      ? 'bg-[#1B5E43] text-white border-[#1B5E43]'
                      : 'bg-white text-[#526B5C] border-emerald-200'
                  }`}
                >
                  Conforme
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, resultado_conforme: false })}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                    !form.resultado_conforme
                      ? 'bg-[#14281D] text-white border-[#14281D]'
                      : 'bg-white text-[#526B5C] border-emerald-200'
                  }`}
                >
                  No conforme (Revisión)
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Certificado de Calibración PDF
              </label>
              <label className="w-full px-4 py-3 text-sm bg-[#FAFDFB] border border-dashed border-emerald-300 rounded-xl cursor-pointer hover:border-[#1B5E43] flex items-center justify-between">
                <span className="text-xs text-[#2E4839]">
                  {subiendo
                    ? 'Subiendo certificado PDF...'
                    : form.nombre_pdf || 'Haz clic para cargar el certificado PDF oficial...'}
                </span>
                <Upload size={16} className="text-[#1B5E43]" />
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleUploadCertificado}
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
              {guardando ? 'Guardando...' : 'Guardar calibración'}
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
          <p className="text-xs text-[#6B8576]">Certificados metrológicos emitidos</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
          <p className="text-xs font-medium text-[#526B5C]">Certificados conformes</p>
          <p className="text-4xl font-extrabold text-[#14281D] my-2.5 tracking-tight">
            {conformes}
          </p>
          <p className="text-xs text-[#6B8576]">Dentro de tolerancia normativa</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
          <p className="text-xs font-medium text-[#526B5C]">Equipos relacionados</p>
          <p className="text-4xl font-extrabold text-[#14281D] my-2.5 tracking-tight">
            {equiposRelacionados}
          </p>
          <p className="text-xs text-[#6B8576]">Con trazabilidad verificada</p>
        </div>
      </div>

      {/* Tabla Historial */}
      <div className="bg-white rounded-2xl border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)] overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#14281D]">Historial de calibraciones</h2>
              <p className="text-xs text-[#6B8576] mt-0.5">
                Registros vinculados a sus equipos y certificados PDF
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
              placeholder="Buscar por equipo, serie o entidad calibradora..."
              className="w-full pl-10 pr-11 py-2.5 text-sm bg-white border border-emerald-100 rounded-xl focus:outline-none focus:border-[#1B5E43] placeholder:text-[#8BA395]"
            />
            <button
              type="button"
              onClick={() => setScannerModo('historial')}
              title="Iniciar cámara para buscar en historial de calibración por QR o Código de Barras"
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
                <th className="py-3.5 px-4">Entidad Calibradora</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Resultado</th>
                <th className="py-3.5 px-6 text-right">Certificado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 text-sm">
              {filtrados.map((c) => (
                <tr key={c.id_registro_calibracion} className="hover:bg-[#F7FBF8] transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#EEF6F1] border border-emerald-100 flex items-center justify-center text-[#1B5E43] shrink-0">
                        <Activity size={17} />
                      </div>
                      <div>
                        <p className="font-bold text-[#14281D]">{c.nombre_equipo}</p>
                        <p className="text-xs text-[#6B8576]">
                          Serie: {c.serie_equipo || 'Equipo relacionado'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-semibold text-xs text-[#14281D]">
                      {c.entidad_calibradora}
                    </p>
                    <p className="text-xs text-[#6B8576]">{c.nombre_laboratorio || 'Laboratorio'}</p>
                  </td>
                  <td className="py-4 px-4 text-xs font-medium text-[#526B5C]">
                    {formatearFechaCorta(c.fecha_calibracion)}
                  </td>
                  <td className="py-4 px-4">
                    {c.resultado_conforme ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E7F5ED] text-[#145338]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E43]" />
                        Conforme
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#14281D] text-[#14281D]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#14281D]" />
                        No conforme
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-2">
                      {c.ruta_certificado_pdf ? (
                        <a
                          href={c.ruta_certificado_pdf}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#EEF6F1] text-[#1B5E43] hover:bg-[#1B5E43] hover:text-white transition-colors text-xs font-semibold flex items-center gap-1.5"
                        >
                          <FileText size={14} /> Certificado
                        </a>
                      ) : (
                        <span className="text-xs text-[#8BA395]">Sin PDF</span>
                      )}
                      <button
                        onClick={() => handleEliminar(c.id_registro_calibracion)}
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
                  <td colSpan="5" className="py-12 text-center text-sm text-[#6B8576]">
                    No se encontraron registros de calibración.
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
            ? 'Escanear QR / Código de Barras para seleccionar equipo en Calibración'
            : 'Buscar calibración por QR o Código de Barras'
        }
      />
    </div>
  );
}

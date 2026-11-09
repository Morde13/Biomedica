import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  Cpu,
  ExternalLink,
  Upload,
  CheckCircle2,
  Pencil,
  Check,
  Plus,
  Trash2,
  Layers,
  Wrench,
  Activity,
} from 'lucide-react';
import { api } from '../services/api';

export default function EquipoDetalleModal({
  equipo,
  mantenimientos = [],
  calibraciones = [],
  onClose,
  catalogos = {},
  esquemaListo,
  onRefresh,
  readOnly = false,
}) {
  const [editando, setEditando] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [form, setForm] = useState({});
  const [espForm, setEspForm] = useState({});
  const [componentesForm, setComponentesForm] = useState([]);

  const [fotoActivaIdx, setFotoActivaIdx] = useState(0);
  const [tipoDocId, setTipoDocId] = useState('');
  const [subiendoDoc, setSubiendoDoc] = useState(false);
  const [descImg, setDescImg] = useState('');
  const [subiendoImg, setSubiendoImg] = useState(false);

  useEffect(() => {
    setFotoActivaIdx(0);
    if (!equipo) return;
    const sedeDeLab =
      equipo.id_sede ||
      (catalogos.laboratorios || []).find(
        (l) => Number(l.id_laboratorio) === Number(equipo.id_laboratorio)
      )?.id_sede ||
      '';

    setForm({
      nombre_equipo: equipo.nombre_equipo || '',
      fabricante: equipo.fabricante || '',
      modelo: equipo.modelo || '',
      serie_universidad: equipo.serie_universidad || '',
      serie_equipo: equipo.serie_equipo || '',
      serie_laboratorio: equipo.serie_laboratorio || '',
      registro_sanitario_invima: equipo.registro_sanitario_invima || '',
      fecha_adquisicion: equipo.fecha_adquisicion || '',
      valor_adquisicion:
        equipo.valor_adquisicion != null ? String(equipo.valor_adquisicion) : '',
      responsable_equipo: equipo.responsable_equipo || '',
      periodicidad_mantenimiento_meses:
        equipo.periodicidad_mantenimiento_meses != null
          ? equipo.periodicidad_mantenimiento_meses
          : 6,
      requiere_calibracion: Boolean(equipo.requiere_calibracion),
      periodicidad_calibracion_meses:
        equipo.periodicidad_calibracion_meses != null
          ? equipo.periodicidad_calibracion_meses
          : 12,
      id_sede: sedeDeLab ? String(sedeDeLab) : '',
      id_laboratorio: equipo.id_laboratorio ? String(equipo.id_laboratorio) : '',
      id_tipo_movilidad: equipo.id_tipo_movilidad ? String(equipo.id_tipo_movilidad) : '',
      id_tipo_adquisicion: equipo.id_tipo_adquisicion
        ? String(equipo.id_tipo_adquisicion)
        : '',
      id_proveedor: equipo.id_proveedor ? String(equipo.id_proveedor) : '',
      id_riesgo: equipo.id_riesgo ? String(equipo.id_riesgo) : '',
      id_uso: equipo.id_uso ? String(equipo.id_uso) : '',
    });

    const e = equipo.especificaciones || {};
    setEspForm({
      id_fuente: e.id_fuente ? String(e.id_fuente) : '',
      id_tecnologia: e.id_tecnologia ? String(e.id_tecnologia) : '',
      voltaje_v: e.voltaje_v || '',
      corriente_a: e.corriente_a || '',
      potencia_w: e.potencia_w || '',
      frecuencia_hz: e.frecuencia_hz || '',
      presion: e.presion || '',
      velocidad: e.velocidad || '',
      peso_kg: e.peso_kg || '',
      temperatura: e.temperatura || '',
      dimensiones: e.dimensiones || '',
      otros_instalacion: e.otros_instalacion || '',
      rango_voltaje: e.rango_voltaje || '',
      rango_corriente: e.rango_corriente || '',
      rango_potencia: e.rango_potencia || '',
      rango_presion: e.rango_presion || '',
      rango_velocidad: e.rango_velocidad || '',
      rango_humedad: e.rango_humedad || '',
      rango_temperatura: e.rango_temperatura || '',
      otros_funcionamiento: e.otros_funcionamiento || '',
    });

    setComponentesForm(
      (equipo.componentes || []).map((c) => ({
        nombre_componente: c.nombre_componente || '',
        marca: c.marca || '',
        modelo: c.modelo || '',
        serie_referencia: c.serie_referencia || '',
      }))
    );
  }, [equipo, catalogos.laboratorios]);

  const laboratoriosDeSede = useMemo(() => {
    const todos = catalogos.laboratorios || [];
    if (!form.id_sede) return todos;
    return todos.filter((l) => String(l.id_sede) === String(form.id_sede));
  }, [catalogos.laboratorios, form.id_sede]);

  // Agrupar manuales/documentos por subtítulo según el tipo de manual que tenga el equipo
  const manualesAgrupadosPorTipo = useMemo(() => {
    const docs = equipo?.documentos || [];
    const grupos = {};
    for (const doc of docs) {
      const tipo = doc.nombre_tipo || 'Documento Técnico / Datasheet';
      if (!grupos[tipo]) grupos[tipo] = [];
      grupos[tipo].push(doc);
    }
    return Object.entries(grupos);
  }, [equipo]);

  if (!equipo) return null;
  const esp = equipo.especificaciones;
  const imagenes = equipo.imagenes || [];
  const fotoPrincipal = imagenes[fotoActivaIdx] || imagenes[0] || null;

  const mantenimientosEquipo = (mantenimientos || []).filter(
    (m) => Number(m.id_equipo) === Number(equipo.id_equipo)
  );
  const calibracionesEquipo = (calibraciones || []).filter(
    (c) => Number(c.id_equipo) === Number(equipo.id_equipo)
  );

  const camposGenerales = [
    ['Serie Universidad', equipo.serie_universidad],
    ['Serie Laboratorio', equipo.serie_laboratorio],
    ['Serie Fábrica', equipo.serie_equipo],
    ['Fabricante', equipo.fabricante],
    ['Modelo', equipo.modelo],
    ['Registro INVIMA', equipo.registro_sanitario_invima],
    ['Sede', equipo.nombre_sede],
    ['Laboratorio', equipo.nombre_laboratorio],
    ['Fecha Adquisición', equipo.fecha_adquisicion],
    ...(!readOnly
      ? [
          ['Tipo de Adquisición', equipo.adquisicion_descripcion],
          [
            'Valor de Adquisición',
            equipo.valor_adquisicion != null
              ? `$${Number(equipo.valor_adquisicion).toLocaleString('es-CO')}`
              : null,
          ],
          ['Responsable', equipo.responsable_equipo],
          ['Proveedor', equipo.nombre_proveedor],
        ]
      : []),
    ['Movilidad', equipo.movilidad_descripcion],
    ['Clasificación Riesgo', equipo.riesgo_descripcion],
    ['Clasificación Uso', equipo.uso_descripcion],
    ...(!readOnly
      ? [
          [
            'Mantenimiento c/',
            equipo.periodicidad_mantenimiento_meses
              ? `${equipo.periodicidad_mantenimiento_meses} meses`
              : 'No definido',
          ],
          [
            'Calibración',
            equipo.requiere_calibracion
              ? `Sí (${equipo.periodicidad_calibracion_meses || 12} meses)`
              : 'No requerida',
          ],
        ]
      : []),
  ];

  const updateForm = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));
  const updateEsp = (field, val) => setEspForm((prev) => ({ ...prev, [field]: val }));

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!form.nombre_equipo?.trim()) {
      alert('El nombre del equipo es obligatorio.');
      return;
    }
    setGuardandoEdicion(true);
    try {
      const toIntOrNull = (v) => (v !== '' && v !== null && v !== undefined ? Number(v) : null);
      const payload = {
        ...form,
        fecha_adquisicion: form.fecha_adquisicion || null,
        valor_adquisicion:
          form.valor_adquisicion !== '' && form.valor_adquisicion !== null
            ? Number(form.valor_adquisicion)
            : null,
        periodicidad_mantenimiento_meses: toIntOrNull(form.periodicidad_mantenimiento_meses),
        periodicidad_calibracion_meses: form.requiere_calibracion
          ? toIntOrNull(form.periodicidad_calibracion_meses)
          : null,
        id_laboratorio: toIntOrNull(form.id_laboratorio),
        id_tipo_movilidad: toIntOrNull(form.id_tipo_movilidad),
        id_tipo_adquisicion: toIntOrNull(form.id_tipo_adquisicion),
        id_proveedor: toIntOrNull(form.id_proveedor),
        id_riesgo: toIntOrNull(form.id_riesgo),
        id_uso: toIntOrNull(form.id_uso),
        especificaciones: {
          ...espForm,
          id_fuente: toIntOrNull(espForm.id_fuente),
          id_tecnologia: toIntOrNull(espForm.id_tecnologia),
        },
        componentes: componentesForm.filter((c) => (c.nombre_componente || '').trim() !== ''),
      };

      await api.actualizarEquipo(equipo.id_equipo, payload, esquemaListo);
      await onRefresh();
      setEditando(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleSubirDatasheet = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoDoc(true);
    try {
      const res = await api.subirArchivo('datasheets', file);
      await api.agregarDocumentoEquipo(
        equipo.id_equipo,
        {
          id_tipo_doc: tipoDocId ? Number(tipoDocId) : null,
          ruta_archivo_pdf: res.ruta,
        },
        esquemaListo
      );
      await onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubiendoDoc(false);
      e.target.value = '';
    }
  };

  const handleEliminarDocumento = async (idDoc) => {
    if (!window.confirm('¿Eliminar este documento PDF del equipo?')) return;
    await api.eliminarDocumentoEquipo(idDoc, esquemaListo);
    await onRefresh();
  };

  const handleSubirImagen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoImg(true);
    try {
      const res = await api.subirArchivo('imagenes', file);
      await api.agregarImagenEquipo(
        equipo.id_equipo,
        {
          descripcion_imagen: descImg || file.name,
          ruta_imagen: res.ruta,
        },
        esquemaListo
      );
      setDescImg('');
      await onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubiendoImg(false);
      e.target.value = '';
    }
  };

  const handleEliminarImagen = async (idImg) => {
    if (!window.confirm('¿Eliminar esta fotografía del equipo?')) return;
    await api.eliminarImagenEquipo(idImg, esquemaListo);
    setFotoActivaIdx(0);
    await onRefresh();
  };

  const inputClass =
    'w-full px-3 py-2 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43] text-[#14281D]';
  const labelClass = 'block text-[11px] font-semibold text-[#2E4839] mb-1';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D261A]/40 backdrop-blur-xs p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-emerald-100 rounded-2xl shadow-xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header limpio sin ícono de matraz ni etiqueta Modo Consulta */}
        <div className="px-6 py-4 border-b border-emerald-100 bg-[#F6F9F7] flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              HOJA DE VIDA TÉCNICA · ID #{equipo.id_equipo}
            </p>
            <h3 className="text-xl font-bold text-[#14281D] mt-0.5">{equipo.nombre_equipo}</h3>
            <p className="text-xs text-[#526B5C] mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                <strong className="text-[#14281D]">Fabricante:</strong>{' '}
                {equipo.fabricante || 'N/A'}
              </span>
              <span>·</span>
              <span>
                <strong className="text-[#14281D]">Modelo:</strong> {equipo.modelo || 'N/A'}
              </span>
              <span>·</span>
              <span>
                <strong className="text-[#14281D]">Laboratorio:</strong>{' '}
                {equipo.nombre_laboratorio || 'Sin laboratorio asignado'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!readOnly && (
              <button
                type="button"
                onClick={() => setEditando(!editando)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  editando
                    ? 'bg-white border border-emerald-200 text-[#14281D]'
                    : 'bg-[#1B5E43] text-white hover:bg-[#144732]'
                }`}
              >
                <Pencil size={14} />
                {editando ? 'Cancelar edición' : 'Editar información'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-emerald-800 hover:bg-emerald-100/70 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {!readOnly && editando ? (
            /* ===============================================================
               MODO EDICIÓN COMPLETA (SOLO ADMINISTRADOR)
               =============================================================== */
            <form onSubmit={handleGuardarEdicion} className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#FAFDFB] border border-emerald-200 space-y-4">
                <h4 className="text-sm font-bold text-[#14281D] border-b border-emerald-100 pb-2">
                  1. Editar Datos Generales, Ubicación y Series
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className={labelClass}>Nombre del Equipo *</label>
                    <input
                      type="text"
                      required
                      value={form.nombre_equipo}
                      onChange={(e) => updateForm('nombre_equipo', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Fabricante</label>
                    <input
                      type="text"
                      value={form.fabricante}
                      onChange={(e) => updateForm('fabricante', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Modelo</label>
                    <input
                      type="text"
                      value={form.modelo}
                      onChange={(e) => updateForm('modelo', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Serie Universidad</label>
                    <input
                      type="text"
                      value={form.serie_universidad}
                      onChange={(e) => updateForm('serie_universidad', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Serie Equipo (Fábrica)</label>
                    <input
                      type="text"
                      value={form.serie_equipo}
                      onChange={(e) => updateForm('serie_equipo', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Serie Laboratorio</label>
                    <input
                      type="text"
                      value={form.serie_laboratorio}
                      onChange={(e) => updateForm('serie_laboratorio', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Sede</label>
                    <select
                      value={form.id_sede}
                      onChange={(e) => {
                        updateForm('id_sede', e.target.value);
                        updateForm('id_laboratorio', '');
                      }}
                      className={inputClass}
                    >
                      <option value="">-- Seleccionar sede --</option>
                      {(catalogos.sedes || []).map((s) => (
                        <option key={s.id_sede} value={s.id_sede}>
                          {s.nombre_sede}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Laboratorio Asignado</label>
                    <select
                      value={form.id_laboratorio}
                      onChange={(e) => updateForm('id_laboratorio', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">-- Seleccionar laboratorio --</option>
                      {laboratoriosDeSede.map((l) => (
                        <option key={l.id_laboratorio} value={l.id_laboratorio}>
                          {l.nombre_laboratorio}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Registro Sanitario INVIMA</label>
                    <input
                      type="text"
                      value={form.registro_sanitario_invima}
                      onChange={(e) => updateForm('registro_sanitario_invima', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Fecha de Adquisición</label>
                    <input
                      type="date"
                      value={form.fecha_adquisicion}
                      onChange={(e) => updateForm('fecha_adquisicion', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Valor de Adquisición ($ COP)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.valor_adquisicion}
                      onChange={(e) => updateForm('valor_adquisicion', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Responsable del Equipo</label>
                    <input
                      type="text"
                      value={form.responsable_equipo}
                      onChange={(e) => updateForm('responsable_equipo', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Proveedor Comercial</label>
                    <select
                      value={form.id_proveedor}
                      onChange={(e) => updateForm('id_proveedor', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">-- Seleccionar proveedor --</option>
                      {(catalogos.proveedores || []).map((p) => (
                        <option key={p.id_proveedor} value={p.id_proveedor}>
                          {p.nombre_proveedor}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Tipo de Movilidad</label>
                    <select
                      value={form.id_tipo_movilidad}
                      onChange={(e) => updateForm('id_tipo_movilidad', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">-- Seleccionar movilidad --</option>
                      {(catalogos.tipos_movilidad || []).map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Tipo de Adquisición</label>
                    <select
                      value={form.id_tipo_adquisicion}
                      onChange={(e) => updateForm('id_tipo_adquisicion', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">-- Seleccionar adquisición --</option>
                      {(catalogos.tipos_adquisicion || []).map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Clasificación de Riesgo</label>
                    <select
                      value={form.id_riesgo}
                      onChange={(e) => updateForm('id_riesgo', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">-- Seleccionar riesgo --</option>
                      {(catalogos.clasificacion_riesgos || []).map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Clasificación de Uso</label>
                    <select
                      value={form.id_uso}
                      onChange={(e) => updateForm('id_uso', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">-- Seleccionar uso --</option>
                      {(catalogos.clasificacion_usos || []).map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Periodicidad Mantenimiento (meses)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.periodicidad_mantenimiento_meses}
                      onChange={(e) =>
                        updateForm('periodicidad_mantenimiento_meses', e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#14281D]">
                      <input
                        type="checkbox"
                        checked={Boolean(form.requiere_calibracion)}
                        onChange={(e) => updateForm('requiere_calibracion', e.target.checked)}
                        className="w-4 h-4 accent-[#1B5E43]"
                      />
                      ¿Requiere Calibración?
                    </label>
                  </div>
                  {form.requiere_calibracion && (
                    <div>
                      <label className={labelClass}>Periodicidad Calibración (meses)</label>
                      <input
                        type="number"
                        min="1"
                        value={form.periodicidad_calibracion_meses}
                        onChange={(e) =>
                          updateForm('periodicidad_calibracion_meses', e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Editar Especificaciones Técnicas A y B */}
              <div className="p-5 rounded-2xl bg-[#FAFDFB] border border-emerald-200 space-y-4">
                <h4 className="text-sm font-bold text-[#14281D] border-b border-emerald-100 pb-2">
                  2. Editar Especificaciones Técnicas
                </h4>

                <p className="text-xs font-bold text-[#1B5E43]">
                  A. Características de Instalación
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className={labelClass}>Fuente de Alimentación</label>
                    <select
                      value={espForm.id_fuente}
                      onChange={(e) => updateEsp('id_fuente', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">-- Seleccionar --</option>
                      {(catalogos.catalogo_fuente_alimentacion || []).map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Tecnología Predominante</label>
                    <select
                      value={espForm.id_tecnologia}
                      onChange={(e) => updateEsp('id_tecnologia', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">-- Seleccionar --</option>
                      {(catalogos.catalogo_tecnologia || []).map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Voltaje (V)</label>
                    <input
                      type="text"
                      value={espForm.voltaje_v}
                      onChange={(e) => updateEsp('voltaje_v', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Corriente (A)</label>
                    <input
                      type="text"
                      value={espForm.corriente_a}
                      onChange={(e) => updateEsp('corriente_a', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Potencia (W)</label>
                    <input
                      type="text"
                      value={espForm.potencia_w}
                      onChange={(e) => updateEsp('potencia_w', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Frecuencia (Hz)</label>
                    <input
                      type="text"
                      value={espForm.frecuencia_hz}
                      onChange={(e) => updateEsp('frecuencia_hz', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Peso (kg)</label>
                    <input
                      type="text"
                      value={espForm.peso_kg}
                      onChange={(e) => updateEsp('peso_kg', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Dimensiones</label>
                    <input
                      type="text"
                      value={espForm.dimensiones}
                      onChange={(e) => updateEsp('dimensiones', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Presión Instalación</label>
                    <input
                      type="text"
                      value={espForm.presion}
                      onChange={(e) => updateEsp('presion', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Velocidad Instalación</label>
                    <input
                      type="text"
                      value={espForm.velocidad}
                      onChange={(e) => updateEsp('velocidad', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Temperatura Instalación</label>
                    <input
                      type="text"
                      value={espForm.temperatura}
                      onChange={(e) => updateEsp('temperatura', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Otros datos de Instalación</label>
                    <input
                      type="text"
                      value={espForm.otros_instalacion}
                      onChange={(e) => updateEsp('otros_instalacion', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <p className="text-xs font-bold text-[#1B5E43] pt-2">
                  B. Características de Funcionamiento
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className={labelClass}>Rango de Voltaje</label>
                    <input
                      type="text"
                      value={espForm.rango_voltaje}
                      onChange={(e) => updateEsp('rango_voltaje', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Rango de Corriente</label>
                    <input
                      type="text"
                      value={espForm.rango_corriente}
                      onChange={(e) => updateEsp('rango_corriente', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Rango de Potencia</label>
                    <input
                      type="text"
                      value={espForm.rango_potencia}
                      onChange={(e) => updateEsp('rango_potencia', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Rango de Presión</label>
                    <input
                      type="text"
                      value={espForm.rango_presion}
                      onChange={(e) => updateEsp('rango_presion', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Rango de Velocidad</label>
                    <input
                      type="text"
                      value={espForm.rango_velocidad}
                      onChange={(e) => updateEsp('rango_velocidad', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Rango de Temperatura</label>
                    <input
                      type="text"
                      value={espForm.rango_temperatura}
                      onChange={(e) => updateEsp('rango_temperatura', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Rango de Humedad</label>
                    <input
                      type="text"
                      value={espForm.rango_humedad}
                      onChange={(e) => updateEsp('rango_humedad', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Otros datos de Funcionamiento</label>
                    <input
                      type="text"
                      value={espForm.otros_funcionamiento}
                      onChange={(e) => updateEsp('otros_funcionamiento', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Editar Componentes */}
              <div className="p-5 rounded-2xl bg-[#FAFDFB] border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#14281D]">
                    3. Componentes y Accesorios ({componentesForm.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setComponentesForm((prev) => [
                        ...prev,
                        { nombre_componente: '', marca: '', modelo: '', serie_referencia: '' },
                      ])
                    }
                    className="px-3 py-1.5 rounded-xl bg-[#EEF6F1] text-[#1B5E43] text-xs font-semibold hover:bg-[#1B5E43] hover:text-white flex items-center gap-1"
                  >
                    <Plus size={14} /> Agregar componente
                  </button>
                </div>

                {componentesForm.map((c, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center bg-white p-2.5 rounded-xl border border-emerald-100"
                  >
                    <input
                      type="text"
                      placeholder="Nombre componente *"
                      value={c.nombre_componente}
                      onChange={(e) =>
                        setComponentesForm((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, nombre_componente: e.target.value } : item
                          )
                        )
                      }
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="Marca"
                      value={c.marca}
                      onChange={(e) =>
                        setComponentesForm((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, marca: e.target.value } : item
                          )
                        )
                      }
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="Modelo"
                      value={c.modelo}
                      onChange={(e) =>
                        setComponentesForm((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, modelo: e.target.value } : item
                          )
                        )
                      }
                      className={inputClass}
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Serie / Ref."
                        value={c.serie_referencia}
                        onChange={(e) =>
                          setComponentesForm((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, serie_referencia: e.target.value } : item
                            )
                          )
                        }
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setComponentesForm((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-2 rounded-xl text-[#6B8576] hover:bg-emerald-50 hover:text-[#14281D]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-emerald-200 text-xs font-semibold text-[#14281D]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="px-5 py-2 rounded-xl bg-[#1B5E43] text-white text-xs font-semibold hover:bg-[#144732] flex items-center gap-1.5"
                >
                  <Check size={15} />
                  {guardandoEdicion ? 'Guardando cambios...' : 'Guardar cambios de la Hoja de Vida'}
                </button>
              </div>
            </form>
          ) : (
            /* ===============================================================
               DISEÑO DE HOJA DE VIDA EN 2 COLUMNAS:
               - IZQUIERDA: Foto del Equipo (arriba) + Manuales por subtítulo (abajo)
               - DERECHA: Información del Equipo (sin tipo adq, valor, responsable ni proveedor)
                          + Especificaciones A y B + Componentes
               =============================================================== */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* =============================================================
                  COLUMNA IZQUIERDA (5 cols): FOTO DEL EQUIPO + MANUALES POR SUBTÍTULO
                 ============================================================= */}
              <div className="lg:col-span-5 space-y-5">
                {/* 1. FOTO DEL EQUIPO */}
                <div className="rounded-2xl border border-emerald-100 overflow-hidden bg-[#FAFDFB]">
                  <div className="px-4 py-3 bg-[#F6F9F7] border-b border-emerald-100 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#14281D] flex items-center gap-2">
                      <ImageIcon size={16} className="text-[#1B5E43]" />
                      Foto del Equipo
                    </h4>
                    <span className="text-[11px] font-semibold text-[#6B8576]">
                      {imagenes.length} {imagenes.length === 1 ? 'foto' : 'fotos'}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    {fotoPrincipal ? (
                      <div className="relative rounded-xl overflow-hidden border border-emerald-200 bg-white aspect-4/3 flex items-center justify-center">
                        <a
                          href={fotoPrincipal.ruta_imagen}
                          target="_blank"
                          rel="noreferrer"
                          title="Haz clic para abrir la foto en tamaño completo"
                          className="w-full h-full flex items-center justify-center"
                        >
                          <img
                            src={fotoPrincipal.ruta_imagen}
                            alt={fotoPrincipal.descripcion_imagen || equipo.nombre_equipo}
                            className="w-full h-full object-contain bg-[#F6F9F7]"
                          />
                        </a>
                        {!readOnly && (
                          <button
                            type="button"
                            title="Eliminar esta fotografía"
                            onClick={() => handleEliminarImagen(fotoPrincipal.id_imagen)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-[#14281D] hover:bg-white shadow-xs"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-emerald-200 bg-white aspect-4/3 flex flex-col items-center justify-center text-[#8BA395] gap-1.5">
                        <ImageIcon size={28} />
                        <span className="text-xs font-medium">Sin fotografía cargada</span>
                      </div>
                    )}

                    {/* Miniaturas cuando hay varias fotos */}
                    {imagenes.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {imagenes.map((img, idx) => (
                          <button
                            key={img.id_imagen || idx}
                            type="button"
                            onClick={() => setFotoActivaIdx(idx)}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all bg-white ${
                              idx === fotoActivaIdx
                                ? 'border-[#1B5E43] ring-2 ring-emerald-200'
                                : 'border-emerald-100 opacity-80 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={img.ruta_imagen}
                              alt={img.descripcion_imagen || `Foto ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Subir nueva foto (solo Admin) */}
                    {!readOnly && (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={descImg}
                          onChange={(e) => setDescImg(e.target.value)}
                          placeholder="Descripción de la foto..."
                          className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-emerald-200 rounded-xl"
                        />
                        <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-[#1B5E43] text-white text-xs font-semibold hover:bg-[#144732] flex items-center gap-1.5 shrink-0">
                          <Upload size={13} />
                          {subiendoImg ? 'Subiendo...' : 'Subir Foto'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleSubirImagen}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. MANUALES Y DOCUMENTOS DIVIDIDOS POR SUBTÍTULOS */}
                <div className="rounded-2xl border border-emerald-100 overflow-hidden bg-[#FAFDFB]">
                  <div className="px-4 py-3 bg-[#F6F9F7] border-b border-emerald-100 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#14281D] flex items-center gap-2">
                      <FileText size={16} className="text-[#1B5E43]" />
                      Manuales y Documentos Técnicos
                    </h4>
                  </div>

                  <div className="p-4 space-y-4">
                    {!readOnly && (
                      <div className="flex gap-2 pb-2 border-b border-emerald-100">
                        <select
                          value={tipoDocId}
                          onChange={(e) => setTipoDocId(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-emerald-200 rounded-xl"
                        >
                          <option value="">Tipo de manual / documento...</option>
                          {(catalogos.tipos_documentos || []).map((td) => (
                            <option key={td.id} value={td.id}>
                              {td.descripcion}
                            </option>
                          ))}
                        </select>
                        <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-[#1B5E43] text-white text-xs font-semibold hover:bg-[#144732] flex items-center gap-1.5 shrink-0">
                          <Upload size={13} />
                          {subiendoDoc ? 'Subiendo...' : 'Subir PDF'}
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleSubirDatasheet}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    {manualesAgrupadosPorTipo.length > 0 ? (
                      <div className="space-y-3.5">
                        {manualesAgrupadosPorTipo.map(([subtituloTipo, listaDocs]) => (
                          <div key={subtituloTipo} className="space-y-1.5">
                            {/* Subtítulo por cada Tipo de Manual */}
                            <p className="text-xs font-bold text-[#1B5E43] uppercase tracking-wide flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E43]" />
                              {subtituloTipo}
                            </p>

                            <div className="space-y-1.5 pl-3">
                              {listaDocs.map((d, idx) => {
                                const nombreArchivo =
                                  (d.ruta_archivo_pdf || '').split('/').pop() ||
                                  `${subtituloTipo} #${idx + 1}`;
                                return (
                                  <div
                                    key={d.id_documento || idx}
                                    className="px-3 py-2 rounded-xl bg-white border border-emerald-100 flex items-center justify-between text-xs hover:border-emerald-400 transition-colors gap-2"
                                  >
                                    <a
                                      href={d.ruta_archivo_pdf}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-semibold text-[#14281D] flex items-center gap-2 flex-1 truncate"
                                    >
                                      <CheckCircle2
                                        size={14}
                                        className="text-emerald-700 shrink-0"
                                      />
                                      <span className="truncate">{nombreArchivo}</span>
                                      <ExternalLink
                                        size={13}
                                        className="text-emerald-700 shrink-0 ml-auto"
                                      />
                                    </a>
                                    {!readOnly && (
                                      <button
                                        type="button"
                                        title="Eliminar documento"
                                        onClick={() => handleEliminarDocumento(d.id_documento)}
                                        className="p-1 rounded-lg text-[#6B8576] hover:bg-emerald-50 hover:text-[#14281D]"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#526B5C]">
                        No hay manuales PDF cargados para este equipo.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* =============================================================
                  COLUMNA DERECHA (7 cols): INFORMACIÓN TÉCNICA DEL EQUIPO
                  (Sin Tipo de Adquisición, Valor de Compra, Responsable ni Proveedor)
                 ============================================================= */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Datos de Identificación y Ubicación */}
                <div className="rounded-2xl border border-emerald-100 overflow-hidden bg-white">
                  <div className="px-4 py-3 bg-[#F6F9F7] border-b border-emerald-100">
                    <h4 className="text-sm font-bold text-[#14281D]">
                      Información General e Identificación
                    </h4>
                  </div>

                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {camposGenerales.map(([label, val]) => (
                      <div
                        key={label}
                        className="p-3 rounded-xl bg-[#FAFDFB] border border-emerald-100/90"
                      >
                        <p className="text-[11px] text-[#526B5C] font-medium">{label}</p>
                        <p className="text-xs font-bold text-[#14281D] mt-0.5 truncate">
                          {val || '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Especificaciones Técnicas divididas en A y B */}
                <div className="rounded-2xl border border-emerald-100 overflow-hidden bg-white">
                  <div className="px-4 py-3 bg-[#F6F9F7] border-b border-emerald-100 flex items-center gap-2">
                    <Cpu size={16} className="text-[#1B5E43]" />
                    <h4 className="text-sm font-bold text-[#14281D]">
                      Especificaciones Técnicas
                    </h4>
                  </div>

                  {esp ? (
                    <div className="p-4 space-y-4">
                      <div>
                        <p className="text-xs font-bold text-[#1B5E43] mb-2.5">
                          A. Características de Instalación
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-2.5 rounded-xl bg-[#FAFDFB] border border-emerald-100/80">
                            <span className="text-[11px] text-[#526B5C]">Fuente alimentación</span>
                            <p className="font-bold text-[#14281D] mt-0.5">
                              {esp.fuente_descripcion || '—'}
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#FAFDFB] border border-emerald-100/80">
                            <span className="text-[11px] text-[#526B5C]">Tecnología</span>
                            <p className="font-bold text-[#14281D] mt-0.5">
                              {esp.tecnologia_descripcion || '—'}
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#FAFDFB] border border-emerald-100/80">
                            <span className="text-[11px] text-[#526B5C]">Voltaje / Corriente</span>
                            <p className="font-bold text-[#14281D] mt-0.5">
                              {esp.voltaje_v || '—'} / {esp.corriente_a || '—'}
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#FAFDFB] border border-emerald-100/80">
                            <span className="text-[11px] text-[#526B5C]">Potencia / Frecuencia</span>
                            <p className="font-bold text-[#14281D] mt-0.5">
                              {esp.potencia_w || '—'} / {esp.frecuencia_hz || '—'}
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#FAFDFB] border border-emerald-100/80">
                            <span className="text-[11px] text-[#526B5C]">Dimensiones / Peso</span>
                            <p className="font-bold text-[#14281D] mt-0.5">
                              {esp.dimensiones || '—'} ({esp.peso_kg || '—'})
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#FAFDFB] border border-emerald-100/80">
                            <span className="text-[11px] text-[#526B5C]">Presión / Velocidad</span>
                            <p className="font-bold text-[#14281D] mt-0.5">
                              {esp.presion || '—'} / {esp.velocidad || '—'}
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#FAFDFB] border border-emerald-100/80">
                            <span className="text-[11px] text-[#526B5C]">Temp. Instalación</span>
                            <p className="font-bold text-[#14281D] mt-0.5">
                              {esp.temperatura || '—'}
                            </p>
                          </div>
                          <div className="col-span-2 p-2.5 rounded-xl bg-[#FAFDFB] border border-emerald-100/80">
                            <span className="text-[11px] text-[#526B5C]">Notas Instalación</span>
                            <p className="font-bold text-[#14281D] mt-0.5">
                              {esp.otros_instalacion || '—'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-emerald-100">
                        <p className="text-xs font-bold text-[#1B5E43] mb-2.5">
                          B. Características de Funcionamiento
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="p-2.5 rounded-xl bg-[#FAFDFB] border border-emerald-100/80">
                            <span className="text-[11px] text-[#526B5C]">Rango Voltaje / Corr.</span>
                            <p className="font-bold text-[#14281D] mt-0.5">
                              {esp.rango_voltaje || '—'} / {esp.rango_corriente || '—'}
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#FAFDFB] border border-emerald-100/80">
                            <span className="text-[11px] text-[#526B5C]">Rango Potencia</span>
                            <p className="font-bold text-[#14281D] mt-0.5">
                              {esp.rango_potencia || '—'}
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#FAFDFB] border border-emerald-100/80">
                            <span className="text-[11px] text-[#526B5C]">Rango Presión / Vel.</span>
                            <p className="font-bold text-[#14281D] mt-0.5">
                              {esp.rango_presion || '—'} / {esp.rango_velocidad || '—'}
                            </p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#FAFDFB] border border-emerald-100/80">
                            <span className="text-[11px] text-[#526B5C]">Rango Temp. / Hum.</span>
                            <p className="font-bold text-[#14281D] mt-0.5">
                              {esp.rango_temperatura || '—'} / {esp.rango_humedad || '—'}
                            </p>
                          </div>
                        </div>
                        {esp.otros_funcionamiento && (
                          <p className="text-xs text-[#526B5C] mt-2.5">
                            <strong className="text-[#14281D]">Notas de funcionamiento:</strong>{' '}
                            {esp.otros_funcionamiento}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="p-4 text-xs text-[#526B5C]">
                      Este equipo aún no tiene especificaciones técnicas detalladas registradas.
                    </p>
                  )}
                </div>

                {/* 3. Componentes y Accesorios */}
                <div className="rounded-2xl border border-emerald-100 overflow-hidden bg-white">
                  <div className="px-4 py-3 bg-[#F6F9F7] border-b border-emerald-100 flex items-center gap-2">
                    <Layers size={16} className="text-[#1B5E43]" />
                    <h4 className="text-sm font-bold text-[#14281D]">
                      Componentes y Accesorios ({(equipo.componentes || []).length})
                    </h4>
                  </div>
                  <div className="p-4">
                    {(equipo.componentes || []).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {equipo.componentes.map((c) => (
                          <div
                            key={c.id_componente}
                            className="p-3 rounded-xl bg-[#FAFDFB] border border-emerald-100 text-xs"
                          >
                            <p className="font-bold text-[#14281D]">{c.nombre_componente}</p>
                            <p className="text-[#526B5C]">
                              Marca: {c.marca || '—'} · Modelo: {c.modelo || '—'} · Serie:{' '}
                              {c.serie_referencia || '—'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#526B5C]">
                        Sin componentes adicionales registrados.
                      </p>
                    )}
                  </div>
                </div>

                {/* 4. Historial de Mantenimientos y Calibración (Visible en el Panel de Administrador) */}
                {!readOnly && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mantenimientos del equipo */}
                    <div className="rounded-2xl border border-emerald-100 overflow-hidden bg-white">
                      <div className="px-4 py-3 bg-[#F6F9F7] border-b border-emerald-100 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-[#14281D] flex items-center gap-2">
                          <Wrench size={15} className="text-[#1B5E43]" />
                          Mantenimientos ({mantenimientosEquipo.length})
                        </h4>
                      </div>
                      <div className="p-4 space-y-2">
                        {mantenimientosEquipo.length > 0 ? (
                          mantenimientosEquipo.map((m) => (
                            <div
                              key={m.id_registro_mantenimiento}
                              className="p-3 rounded-xl bg-[#FAFDFB] border border-emerald-100 text-xs flex items-center justify-between gap-2"
                            >
                              <div>
                                <p className="font-bold text-[#14281D]">
                                  {m.tipo_mantenimiento || 'Mantenimiento'} ·{' '}
                                  {m.fecha_mantenimiento}
                                </p>
                                <p className="text-[11px] text-[#526B5C]">
                                  Resp: {m.responsable_mantenimiento || '—'} · Costo: $
                                  {Number(m.costo || 0).toLocaleString('es-CO')}
                                </p>
                              </div>
                              {m.ruta_evidencia_pdf && (
                                <a
                                  href={m.ruta_evidencia_pdf}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-[#E7F5ED] text-[#145338] font-semibold text-[11px] shrink-0"
                                >
                                  Ver PDF
                                </a>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-[#526B5C]">
                            Sin mantenimientos registrados para este equipo.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Calibraciones del equipo */}
                    <div className="rounded-2xl border border-emerald-100 overflow-hidden bg-white">
                      <div className="px-4 py-3 bg-[#F6F9F7] border-b border-emerald-100 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-[#14281D] flex items-center gap-2">
                          <Activity size={15} className="text-[#1B5E43]" />
                          Calibración ({calibracionesEquipo.length})
                        </h4>
                      </div>
                      <div className="p-4 space-y-2">
                        {calibracionesEquipo.length > 0 ? (
                          calibracionesEquipo.map((c) => (
                            <div
                              key={c.id_registro_calibracion}
                              className="p-3 rounded-xl bg-[#FAFDFB] border border-emerald-100 text-xs flex items-center justify-between gap-2"
                            >
                              <div>
                                <p className="font-bold text-[#14281D]">
                                  {c.entidad_calibradora} · {c.fecha_calibracion}
                                </p>
                                <p className="text-[11px] text-[#526B5C]">
                                  Resultado:{' '}
                                  <strong>
                                    {c.resultado_conforme ? 'Conforme' : 'No conforme'}
                                  </strong>
                                </p>
                              </div>
                              {c.ruta_certificado_pdf && (
                                <a
                                  href={c.ruta_certificado_pdf}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-[#E7F5ED] text-[#145338] font-semibold text-[11px] shrink-0"
                                >
                                  Certificado
                                </a>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-[#526B5C]">
                            Sin certificados de calibración registrados.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

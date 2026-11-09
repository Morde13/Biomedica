import React, { useMemo, useState } from 'react';
import {
  Check,
  Plus,
  Trash2,
  Upload,
  FileText,
  Image as ImageIcon,
  Cpu,
  Layers,
  Copy,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import EquipoSearchSelect from '../components/EquipoSearchSelect';

const INITIAL_FORM = {
  nombre_equipo: '',
  fabricante: '',
  modelo: '',
  serie_universidad: '',
  serie_equipo: '',
  serie_laboratorio: '',
  registro_sanitario_invima: '',
  fecha_adquisicion: '',
  valor_adquisicion: '',
  responsable_equipo: '',
  periodicidad_mantenimiento_meses: 6,
  requiere_calibracion: false,
  periodicidad_calibracion_meses: 12,
  id_sede: '',
  id_laboratorio: '',
  id_tipo_movilidad: '',
  id_tipo_adquisicion: '',
  id_proveedor: '',
  id_riesgo: '',
  id_uso: '',
};

const INITIAL_ESP = {
  id_fuente: '',
  id_tecnologia: '',
  voltaje_v: '',
  corriente_a: '',
  potencia_w: '',
  frecuencia_hz: '',
  presion: '',
  velocidad: '',
  peso_kg: '',
  temperatura: '',
  dimensiones: '',
  otros_instalacion: '',
  rango_voltaje: '',
  rango_corriente: '',
  rango_potencia: '',
  rango_presion: '',
  rango_velocidad: '',
  rango_humedad: '',
  rango_temperatura: '',
  otros_funcionamiento: '',
};

export default function RegistroEquipoView({
  equipos = [],
  catalogos,
  esquemaListo,
  onOpenCatalogos,
  onRefresh,
  onNavigate,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [esp, setEsp] = useState(INITIAL_ESP);
  const [componentes, setComponentes] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [equipoImportadoId, setEquipoImportadoId] = useState('');
  const [importarModalOpen, setImportarModalOpen] = useState(false);
  const [mensajeImportacion, setMensajeImportacion] = useState('');
  const [tipoDocActual, setTipoDocActual] = useState('');
  const [descImgActual, setDescImgActual] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [exito, setExito] = useState('');

  const updateForm = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));
  const updateEsp = (field, val) => setEsp((prev) => ({ ...prev, [field]: val }));

  // Filtrar laboratorios según la Sede seleccionada
  const laboratoriosDeSede = useMemo(() => {
    const todos = catalogos.laboratorios || [];
    if (!form.id_sede) return [];
    return todos.filter((l) => String(l.id_sede) === String(form.id_sede));
  }, [catalogos.laboratorios, form.id_sede]);

  const handleChangeSede = (nuevaSedeId) => {
    setForm((prev) => ({
      ...prev,
      id_sede: nuevaSedeId,
      id_laboratorio: '',
    }));
  };

  // Importar todas las propiedades de otro equipo EXCEPTO los 3 seriales
  const handleImportarPropiedades = (idSeleccionado, eqOrigen) => {
    setEquipoImportadoId(idSeleccionado);
    const eq =
      eqOrigen || equipos.find((x) => String(x.id_equipo) === String(idSeleccionado));
    if (!eq) return;

    const sedeDeLab =
      eq.id_sede ||
      (catalogos.laboratorios || []).find(
        (l) => Number(l.id_laboratorio) === Number(eq.id_laboratorio)
      )?.id_sede ||
      '';

    setForm({
      nombre_equipo: eq.nombre_equipo || '',
      fabricante: eq.fabricante || '',
      modelo: eq.modelo || '',
      // Los 3 seriales quedan en blanco intencionalmente
      serie_universidad: '',
      serie_equipo: '',
      serie_laboratorio: '',
      registro_sanitario_invima: eq.registro_sanitario_invima || '',
      fecha_adquisicion: eq.fecha_adquisicion || '',
      valor_adquisicion: eq.valor_adquisicion != null ? String(eq.valor_adquisicion) : '',
      responsable_equipo: eq.responsable_equipo || '',
      periodicidad_mantenimiento_meses:
        eq.periodicidad_mantenimiento_meses != null
          ? eq.periodicidad_mantenimiento_meses
          : 6,
      requiere_calibracion: Boolean(eq.requiere_calibracion),
      periodicidad_calibracion_meses:
        eq.periodicidad_calibracion_meses != null
          ? eq.periodicidad_calibracion_meses
          : 12,
      id_sede: sedeDeLab ? String(sedeDeLab) : '',
      id_laboratorio: eq.id_laboratorio ? String(eq.id_laboratorio) : '',
      id_tipo_movilidad: eq.id_tipo_movilidad ? String(eq.id_tipo_movilidad) : '',
      id_tipo_adquisicion: eq.id_tipo_adquisicion ? String(eq.id_tipo_adquisicion) : '',
      id_proveedor: eq.id_proveedor ? String(eq.id_proveedor) : '',
      id_riesgo: eq.id_riesgo ? String(eq.id_riesgo) : '',
      id_uso: eq.id_uso ? String(eq.id_uso) : '',
    });

    const e = eq.especificaciones || {};
    setEsp({
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

    setComponentes(
      (eq.componentes || []).map((c) => ({
        nombre_componente: c.nombre_componente || '',
        marca: c.marca || '',
        modelo: c.modelo || '',
        serie_referencia: '',
      }))
    );

    setDocumentos(
      (eq.documentos || []).map((d) => ({
        id_tipo_doc: d.id_tipo_doc || null,
        tipo_etiqueta: d.nombre_tipo || 'Documento',
        nombre_archivo: (d.ruta_archivo_pdf || '').split('/').pop() || 'Manual PDF',
        ruta_archivo_pdf: d.ruta_archivo_pdf,
      }))
    );

    setImagenes(
      (eq.imagenes || []).map((img) => ({
        descripcion_imagen: img.descripcion_imagen || '',
        ruta_imagen: img.ruta_imagen,
      }))
    );

    setMensajeImportacion(
      `Se importaron las propiedades de "${eq.nombre_equipo}". Ingresa únicamente los 3 números de serie de esta nueva unidad.`
    );
    setImportarModalOpen(false);
    setTimeout(() => setMensajeImportacion(''), 5000);
  };

  const agregarComponente = () => {
    setComponentes((prev) => [
      ...prev,
      { nombre_componente: '', marca: '', modelo: '', serie_referencia: '' },
    ]);
  };

  const actualizarComponente = (idx, field, val) => {
    setComponentes((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: val } : c))
    );
  };

  const eliminarComponente = (idx) => {
    setComponentes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUploadDatasheet = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoArchivo(true);
    try {
      const res = await api.subirArchivo('datasheets', file);
      const td = (catalogos.tipos_documentos || []).find(
        (t) => Number(t.id) === Number(tipoDocActual)
      );
      setDocumentos((prev) => [
        ...prev,
        {
          id_tipo_doc: tipoDocActual ? Number(tipoDocActual) : null,
          tipo_etiqueta: td ? td.descripcion : 'Documento General',
          nombre_archivo: file.name,
          ruta_archivo_pdf: res.ruta,
        },
      ]);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubiendoArchivo(false);
      e.target.value = '';
    }
  };

  const handleUploadImagen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoArchivo(true);
    try {
      const res = await api.subirArchivo('imagenes', file);
      setImagenes((prev) => [
        ...prev,
        {
          descripcion_imagen: descImgActual || file.name,
          ruta_imagen: res.ruta,
        },
      ]);
      setDescImgActual('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubiendoArchivo(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre_equipo.trim()) return;

    setGuardando(true);
    try {
      const toIntOrNull = (v) => (v !== '' && v !== null ? Number(v) : null);
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
          ...esp,
          id_fuente: toIntOrNull(esp.id_fuente),
          id_tecnologia: toIntOrNull(esp.id_tecnologia),
        },
        componentes: componentes.filter((c) => c.nombre_componente.trim() !== ''),
        documentos: documentos.map((d) => ({
          id_tipo_doc: d.id_tipo_doc,
          ruta_archivo_pdf: d.ruta_archivo_pdf,
        })),
        imagenes,
      };

      await api.registrarEquipo(payload, esquemaListo);
      await onRefresh();
      setForm(INITIAL_FORM);
      setEsp(INITIAL_ESP);
      setComponentes([]);
      setDocumentos([]);
      setImagenes([]);
      setEquipoImportadoId('');
      setExito('Equipo registrado exitosamente.');
      setTimeout(() => {
        setExito('');
        onNavigate('Inventario');
      }, 1100);
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200/90 rounded-xl focus:outline-none focus:border-[#1B5E43] text-[#14281D] placeholder:text-[#8BA395]';
  const labelClass = 'block text-xs font-semibold text-[#2E4839] mb-1.5';
  const addBtnClass =
    'px-3 py-2.5 rounded-xl bg-[#EEF6F1] border border-emerald-200 text-[#1B5E43] hover:bg-[#1B5E43] hover:text-white transition-colors shrink-0 flex items-center justify-center';

  return (
    <form onSubmit={handleSubmit} className="space-y-7 pb-10">
      {/* Header + Importar propiedades de otro equipo */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-[#5E7A6B] mb-1.5">
            GESTIÓN DE LABORATORIO &nbsp;/&nbsp; ALTA TÉCNICA
          </p>
          <h1 className="text-3xl font-extrabold text-[#14281D] tracking-tight">
            Registro de equipo
          </h1>
          <p className="text-sm text-[#526B5C] mt-1">
            Diligencia la información general, especificaciones técnicas, componentes, manuales e imágenes.
          </p>
        </div>

        {/* Botón limpio para abrir el buscador e importar propiedades de otro equipo */}
        <button
          type="button"
          onClick={() => setImportarModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-white border border-emerald-200 text-[#1B5E43] text-xs sm:text-sm font-semibold hover:bg-[#E7F5ED] transition-colors shadow-xs flex items-center gap-2 self-start lg:self-auto"
        >
          <Copy size={16} />
          Importar propiedades de otro equipo
        </button>
      </div>

      {/* Modal emergente al presionar "Importar propiedades de otro equipo" */}
      {importarModalOpen && (
        <div
          onClick={() => setImportarModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D261A]/40 backdrop-blur-xs p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-emerald-100 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3 border-b border-emerald-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EEF6F1] text-[#1B5E43] flex items-center justify-center shrink-0">
                  <Copy size={17} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#14281D]">
                    Importar propiedades de otro equipo
                  </h3>
                  <p className="text-xs text-[#6B8576]">
                    Copia toda la ficha técnica excepto los 3 números de serie (universidad, fábrica y laboratorio).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportarModalOpen(false)}
                className="p-1.5 rounded-xl text-[#526B5C] hover:bg-emerald-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 pb-16">
              <label className="block text-xs font-semibold text-[#2E4839]">
                Buscar equipo plantilla por nombre, serie de universidad o serie de laboratorio
              </label>
              <EquipoSearchSelect
                equipos={equipos}
                multiple={false}
                value={equipoImportadoId}
                onChange={handleImportarPropiedades}
                placeholder="Escribe nombre o serie para filtrar y elegir..."
              />
            </div>
          </div>
        </div>
      )}

      {mensajeImportacion && (
        <div className="p-4 rounded-2xl bg-[#E7F5ED] border border-emerald-300 text-[#145338] text-xs font-semibold flex items-center gap-2">
          <Copy size={16} />
          {mensajeImportacion}
        </div>
      )}

      {exito && (
        <div className="p-4 rounded-2xl bg-[#E7F5ED] border border-emerald-300 text-[#145338] text-sm font-semibold flex items-center gap-2">
          <Check size={18} />
          {exito}
        </div>
      )}

      {/* SECCIÓN 1: Datos Generales */}
      <div className="bg-white rounded-2xl border border-emerald-100/90 p-6 space-y-5 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
        <div className="border-b border-emerald-100 pb-3.5">
          <h2 className="text-base font-bold text-[#14281D]">
            1. Datos Generales, Ubicación y Clasificación
          </h2>
          <p className="text-xs text-[#6B8576]">
            Identificación institucional, sede, laboratorio, proveedor comercial y periodicidades
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Nombre del equipo */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className={labelClass}>Nombre del Equipo *</label>
            <input
              type="text"
              required
              value={form.nombre_equipo}
              onChange={(e) => updateForm('nombre_equipo', e.target.value)}
              placeholder="Ej: Espectrofotómetro UV-Vis"
              className={inputClass}
            />
          </div>

          {/* Sede con botón + */}
          <div>
            <label className={labelClass}>Sede</label>
            <div className="flex gap-1.5">
              <select
                value={form.id_sede}
                onChange={(e) => handleChangeSede(e.target.value)}
                className={inputClass}
              >
                <option value="">-- Seleccionar sede --</option>
                {(catalogos.sedes || []).map((s) => (
                  <option key={s.id_sede} value={s.id_sede}>
                    {s.nombre_sede}
                  </option>
                ))}
              </select>
              <button
                type="button"
                title="Agregar nueva Sede"
                onClick={() =>
                  onOpenCatalogos({
                    tab: 'ubicacion',
                    focus: 'sede',
                    title: 'Agregar nueva Sede',
                    onCreated: (newSedeId) => handleChangeSede(String(newSedeId)),
                  })
                }
                className={addBtnClass}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Laboratorio dependiente de la Sede seleccionada + botón + */}
          <div>
            <label className={labelClass}>Laboratorio Asignado</label>
            <div className="flex gap-1.5">
              <select
                value={form.id_laboratorio}
                onChange={(e) => updateForm('id_laboratorio', e.target.value)}
                disabled={!form.id_sede}
                className={`${inputClass} ${
                  !form.id_sede ? 'bg-[#F5F8F6] text-[#8BA395] cursor-not-allowed' : ''
                }`}
              >
                <option value="">
                  {form.id_sede
                    ? '-- Seleccionar laboratorio --'
                    : '-- Primero selecciona una sede --'}
                </option>
                {laboratoriosDeSede.map((l) => (
                  <option key={l.id_laboratorio} value={l.id_laboratorio}>
                    {l.nombre_laboratorio}
                  </option>
                ))}
              </select>
              <button
                type="button"
                title="Agregar nuevo Laboratorio"
                onClick={() =>
                  onOpenCatalogos({
                    tab: 'ubicacion',
                    focus: 'laboratorio',
                    id_sede: form.id_sede,
                    title: 'Agregar nuevo Laboratorio',
                    onCreated: (newLabId, sedeAsociada) => {
                      if (sedeAsociada) updateForm('id_sede', String(sedeAsociada));
                      updateForm('id_laboratorio', String(newLabId));
                    },
                  })
                }
                className={addBtnClass}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Fabricante</label>
            <input
              type="text"
              value={form.fabricante}
              onChange={(e) => updateForm('fabricante', e.target.value)}
              placeholder="Ej: Shimadzu, Tektronix, Fluke"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Modelo</label>
            <input
              type="text"
              value={form.modelo}
              onChange={(e) => updateForm('modelo', e.target.value)}
              placeholder="Ej: UV-1900i"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Registro Sanitario INVIMA</label>
            <input
              type="text"
              value={form.registro_sanitario_invima}
              onChange={(e) => updateForm('registro_sanitario_invima', e.target.value)}
              placeholder="Ej: 2024DM-0018290 o N/A"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Serie Equipo (Fábrica)</label>
            <input
              type="text"
              value={form.serie_equipo}
              onChange={(e) => updateForm('serie_equipo', e.target.value)}
              placeholder="Número de serie del fabricante"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Serie Universidad (Placa Activo)</label>
            <input
              type="text"
              value={form.serie_universidad}
              onChange={(e) => updateForm('serie_universidad', e.target.value)}
              placeholder="Código inventario universidad"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Serie Interna Laboratorio</label>
            <input
              type="text"
              value={form.serie_laboratorio}
              onChange={(e) => updateForm('serie_laboratorio', e.target.value)}
              placeholder="Ej: LAB-MEC-01"
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
              min="0"
              value={form.valor_adquisicion}
              onChange={(e) => updateForm('valor_adquisicion', e.target.value)}
              placeholder="Ej: 14500000"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Responsable del Equipo</label>
            <input
              type="text"
              value={form.responsable_equipo}
              onChange={(e) => updateForm('responsable_equipo', e.target.value)}
              placeholder="Nombre del docente o ingeniero a cargo"
              className={inputClass}
            />
          </div>

          {/* Proveedor Comercial con botón + */}
          <div>
            <label className={labelClass}>Proveedor Comercial</label>
            <div className="flex gap-1.5">
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
              <button
                type="button"
                title="Agregar Proveedor Comercial"
                onClick={() =>
                  onOpenCatalogos({
                    tab: 'proveedores',
                    focus: 'proveedor',
                    title: 'Agregar Proveedor Comercial',
                    onCreated: (id) => updateForm('id_proveedor', String(id)),
                  })
                }
                className={addBtnClass}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Tipo de Movilidad con botón + */}
          <div>
            <label className={labelClass}>Tipo de Movilidad</label>
            <div className="flex gap-1.5">
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
              <button
                type="button"
                title="Agregar Tipo de Movilidad"
                onClick={() =>
                  onOpenCatalogos({
                    tab: 'parametricas',
                    focus: 'catalogo',
                    catKey: 'tipos_movilidad',
                    title: 'Agregar Tipo de Movilidad',
                    onCreated: (id) => updateForm('id_tipo_movilidad', String(id)),
                  })
                }
                className={addBtnClass}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Tipo de Adquisición con botón + */}
          <div>
            <label className={labelClass}>Tipo de Adquisición</label>
            <div className="flex gap-1.5">
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
              <button
                type="button"
                title="Agregar Tipo de Adquisición"
                onClick={() =>
                  onOpenCatalogos({
                    tab: 'parametricas',
                    focus: 'catalogo',
                    catKey: 'tipos_adquisicion',
                    title: 'Agregar Tipo de Adquisición',
                    onCreated: (id) => updateForm('id_tipo_adquisicion', String(id)),
                  })
                }
                className={addBtnClass}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Clasificación de Riesgo con botón + */}
          <div>
            <label className={labelClass}>Clasificación de Riesgo</label>
            <div className="flex gap-1.5">
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
              <button
                type="button"
                title="Agregar Clasificación de Riesgo"
                onClick={() =>
                  onOpenCatalogos({
                    tab: 'parametricas',
                    focus: 'catalogo',
                    catKey: 'clasificacion_riesgos',
                    title: 'Agregar Clasificación de Riesgo',
                    onCreated: (id) => updateForm('id_riesgo', String(id)),
                  })
                }
                className={addBtnClass}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Clasificación de Uso con botón + */}
          <div>
            <label className={labelClass}>Clasificación de Uso</label>
            <div className="flex gap-1.5">
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
              <button
                type="button"
                title="Agregar Clasificación de Uso"
                onClick={() =>
                  onOpenCatalogos({
                    tab: 'parametricas',
                    focus: 'catalogo',
                    catKey: 'clasificacion_usos',
                    title: 'Agregar Clasificación de Uso',
                    onCreated: (id) => updateForm('id_uso', String(id)),
                  })
                }
                className={addBtnClass}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Periodicidad Mantenimiento (meses)</label>
            <input
              type="number"
              min="0"
              value={form.periodicidad_mantenimiento_meses}
              onChange={(e) => updateForm('periodicidad_mantenimiento_meses', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-4 pt-5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.requiere_calibracion}
                onChange={(e) => updateForm('requiere_calibracion', e.target.checked)}
                className="w-4 h-4 accent-[#1B5E43] rounded"
              />
              <span className="text-sm font-semibold text-[#14281D]">
                ¿Requiere Calibración?
              </span>
            </label>
          </div>

          {form.requiere_calibracion && (
            <div>
              <label className={labelClass}>Periodicidad Calibración (meses)</label>
              <input
                type="number"
                min="1"
                value={form.periodicidad_calibracion_meses}
                onChange={(e) => updateForm('periodicidad_calibracion_meses', e.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 2: Especificaciones Técnicas separadas en A y B */}
      <div className="bg-white rounded-2xl border border-emerald-100/90 p-6 space-y-6 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
        <div className="border-b border-emerald-100 pb-3.5 flex items-center gap-2.5">
          <Cpu size={18} className="text-[#1B5E43]" />
          <div>
            <h2 className="text-base font-bold text-[#14281D]">
              2. Especificaciones Técnicas
            </h2>
            <p className="text-xs text-[#6B8576]">
              Magnitudes nominales de instalación y rangos de operación del equipo
            </p>
          </div>
        </div>

        {/* SUBSECCIÓN A: Características de instalación */}
        <div className="p-5 rounded-2xl bg-[#FAFDFB] border border-emerald-100 space-y-4">
          <div className="border-b border-emerald-100 pb-2.5">
            <h3 className="text-sm font-extrabold text-[#1B5E43]">
              A. Características de instalación
            </h3>
            <p className="text-[11px] text-[#6B8576]">
              Requerimientos físicos, eléctricos y nominales para instalar el equipo
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Fuente de Alimentación con botón + */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Fuente de Alimentación</label>
              <div className="flex gap-1.5">
                <select
                  value={esp.id_fuente}
                  onChange={(e) => updateEsp('id_fuente', e.target.value)}
                  className={inputClass}
                >
                  <option value="">-- Seleccionar fuente --</option>
                  {(catalogos.fuentes_alimentacion || []).map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.descripcion}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  title="Agregar Fuente de Alimentación"
                  onClick={() =>
                    onOpenCatalogos({
                      tab: 'parametricas',
                      focus: 'catalogo',
                      catKey: 'fuentes_alimentacion',
                      title: 'Agregar Fuente de Alimentación',
                      onCreated: (id) => updateEsp('id_fuente', String(id)),
                    })
                  }
                  className={addBtnClass}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Tecnología Predominante con botón + */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Tecnología Predominante</label>
              <div className="flex gap-1.5">
                <select
                  value={esp.id_tecnologia}
                  onChange={(e) => updateEsp('id_tecnologia', e.target.value)}
                  className={inputClass}
                >
                  <option value="">-- Seleccionar tecnología --</option>
                  {(catalogos.tecnologias || []).map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.descripcion}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  title="Agregar Tecnología Predominante"
                  onClick={() =>
                    onOpenCatalogos({
                      tab: 'parametricas',
                      focus: 'catalogo',
                      catKey: 'tecnologias',
                      title: 'Agregar Tecnología Predominante',
                      onCreated: (id) => updateEsp('id_tecnologia', String(id)),
                    })
                  }
                  className={addBtnClass}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {[
              ['voltaje_v', 'Voltaje (V)', '110 - 220 V'],
              ['corriente_a', 'Corriente (A)', '1.5 A'],
              ['potencia_w', 'Potencia (W)', '150 W'],
              ['frecuencia_hz', 'Frecuencia (Hz)', '50/60 Hz'],
              ['presion', 'Presión', 'Atmosférica / PSI'],
              ['velocidad', 'Velocidad', 'RPM / nm/min'],
              ['peso_kg', 'Peso (kg)', '12.5 kg'],
              ['temperatura', 'Temperatura', '20 °C'],
              ['dimensiones', 'Dimensiones', '400 x 320 x 180 mm'],
            ].map(([key, lbl, ph]) => (
              <div key={key}>
                <label className={labelClass}>{lbl}</label>
                <input
                  type="text"
                  value={esp[key]}
                  onChange={(e) => updateEsp(key, e.target.value)}
                  placeholder={ph}
                  className={inputClass}
                />
              </div>
            ))}

            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelClass}>Otros Requisitos de Instalación</label>
              <textarea
                rows="2"
                value={esp.otros_instalacion}
                onChange={(e) => updateEsp('otros_instalacion', e.target.value)}
                placeholder="Polo a tierra, extracción de gases, mesa antivibratoria..."
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* SUBSECCIÓN B: Características de funcionamiento */}
        <div className="p-5 rounded-2xl bg-[#FAFDFB] border border-emerald-100 space-y-4">
          <div className="border-b border-emerald-100 pb-2.5">
            <h3 className="text-sm font-extrabold text-[#1B5E43]">
              B. Características de funcionamiento
            </h3>
            <p className="text-[11px] text-[#6B8576]">
              Rangos operativos y condiciones ambientales de trabajo del equipo
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['rango_voltaje', 'Rango Voltaje', '100V - 240V'],
              ['rango_corriente', 'Rango Corriente', '0.5A - 2.0A'],
              ['rango_potencia', 'Rango Potencia', '100W - 180W'],
              ['rango_presion', 'Rango Presión', '70 - 106 kPa'],
              ['rango_velocidad', 'Rango Velocidad', '0 - 4000 RPM'],
              ['rango_humedad', 'Rango Humedad', '20% - 80% HR'],
              ['rango_temperatura', 'Rango Temperatura', '10 °C - 40 °C'],
            ].map(([key, lbl, ph]) => (
              <div key={key}>
                <label className={labelClass}>{lbl}</label>
                <input
                  type="text"
                  value={esp[key]}
                  onChange={(e) => updateEsp(key, e.target.value)}
                  placeholder={ph}
                  className={inputClass}
                />
              </div>
            ))}

            <div className="sm:col-span-2 lg:col-span-4">
              <label className={labelClass}>Otros Parámetros de Funcionamiento</label>
              <textarea
                rows="2"
                value={esp.otros_funcionamiento}
                onChange={(e) => updateEsp('otros_funcionamiento', e.target.value)}
                placeholder="Condiciones operativas especiales..."
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: Componentes y Accesorios */}
      <div className="bg-white rounded-2xl border border-emerald-100/90 p-6 space-y-4 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers size={18} className="text-[#1B5E43]" />
            <div>
              <h2 className="text-base font-bold text-[#14281D]">
                3. Componentes y Accesorios
              </h2>
              <p className="text-xs text-[#6B8576]">
                Sondas, sensores, fuentes externas o accesorios incluidos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={agregarComponente}
            className="px-3.5 py-2 rounded-xl bg-[#EEF6F1] text-[#1B5E43] text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1.5"
          >
            <Plus size={14} /> Añadir componente
          </button>
        </div>

        {componentes.length === 0 ? (
          <p className="text-xs text-[#6B8576] bg-[#FAFDFB] p-4 rounded-xl border border-emerald-100/70">
            Sin componentes registrados. Haz clic en &ldquo;Añadir componente&rdquo; si el equipo cuenta con partes inventariables.
          </p>
        ) : (
          <div className="space-y-2.5">
            {componentes.map((comp, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3 rounded-xl bg-[#FAFDFB] border border-emerald-100 items-center"
              >
                <input
                  type="text"
                  placeholder="Nombre del componente *"
                  value={comp.nombre_componente}
                  onChange={(e) => actualizarComponente(idx, 'nombre_componente', e.target.value)}
                  className={`${inputClass} sm:col-span-4`}
                />
                <input
                  type="text"
                  placeholder="Marca"
                  value={comp.marca}
                  onChange={(e) => actualizarComponente(idx, 'marca', e.target.value)}
                  className={`${inputClass} sm:col-span-3`}
                />
                <input
                  type="text"
                  placeholder="Modelo"
                  value={comp.modelo}
                  onChange={(e) => actualizarComponente(idx, 'modelo', e.target.value)}
                  className={`${inputClass} sm:col-span-2`}
                />
                <input
                  type="text"
                  placeholder="Serie / Ref"
                  value={comp.serie_referencia}
                  onChange={(e) => actualizarComponente(idx, 'serie_referencia', e.target.value)}
                  className={`${inputClass} sm:col-span-2`}
                />
                <button
                  type="button"
                  onClick={() => eliminarComponente(idx)}
                  className="p-2 rounded-xl text-[#526B5C] hover:bg-emerald-100 sm:col-span-1 flex justify-center"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN 4: Datasheets e Imágenes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datasheets */}
        <div className="bg-white rounded-2xl border border-emerald-100/90 p-6 space-y-4 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
          <div className="flex items-center gap-2.5">
            <FileText size={18} className="text-[#1B5E43]" />
            <div>
              <h2 className="text-base font-bold text-[#14281D]">
                4. Datasheets y Manuales
              </h2>
              <p className="text-xs text-[#6B8576]">
                Puedes elegir un tipo, subir su PDF, y luego cambiar de tipo para subir otro sin que se borre el anterior
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-1.5 flex-1">
              <select
                value={tipoDocActual}
                onChange={(e) => setTipoDocActual(e.target.value)}
                className={`${inputClass} flex-1`}
              >
                <option value="">-- Tipo de documento --</option>
                {(catalogos.tipos_documentos || []).map((td) => (
                  <option key={td.id} value={td.id}>
                    {td.descripcion}
                  </option>
                ))}
              </select>
              <button
                type="button"
                title="Agregar Tipo de Documento"
                onClick={() =>
                  onOpenCatalogos({
                    tab: 'parametricas',
                    focus: 'catalogo',
                    catKey: 'tipos_documentos',
                    title: 'Agregar Tipo de Documento',
                    onCreated: (id) => setTipoDocActual(String(id)),
                  })
                }
                className={addBtnClass}
              >
                <Plus size={16} />
              </button>
            </div>

            <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-[#1B5E43] text-white text-xs font-semibold hover:bg-[#144732] flex items-center justify-center gap-2 shrink-0">
              <Upload size={15} />
              {subiendoArchivo ? 'Subiendo...' : 'Subir PDF'}
              <input
                type="file"
                accept=".pdf"
                onChange={handleUploadDatasheet}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-2">
            {documentos.map((d, i) => (
              <div
                key={i}
                className="px-3.5 py-2.5 rounded-xl bg-[#FAFDFB] border border-emerald-100 flex items-center justify-between text-xs gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E7F5ED] text-[#145338] font-bold shrink-0">
                    {d.tipo_etiqueta}
                  </span>
                  <span className="font-semibold text-[#14281D] truncate">
                    {d.nombre_archivo}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDocumentos((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-emerald-800 hover:underline shrink-0 font-semibold"
                >
                  Quitar
                </button>
              </div>
            ))}
            {documentos.length === 0 && (
              <p className="text-xs text-[#6B8576]">
                Aún no se han adjuntado manuales para este equipo.
              </p>
            )}
          </div>
        </div>

        {/* Imágenes */}
        <div className="bg-white rounded-2xl border border-emerald-100/90 p-6 space-y-4 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
          <div className="flex items-center gap-2.5">
            <ImageIcon size={18} className="text-[#1B5E43]" />
            <div>
              <h2 className="text-base font-bold text-[#14281D]">
                5. Fotografías del Equipo
              </h2>
              <p className="text-xs text-[#6B8576]">
                Registro visual e identificación del equipo
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={descImgActual}
              onChange={(e) => setDescImgActual(e.target.value)}
              placeholder="Descripción (Ej: Vista frontal y panel)"
              className={`${inputClass} flex-1`}
            />
            <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-[#1B5E43] text-white text-xs font-semibold hover:bg-[#144732] flex items-center justify-center gap-2 shrink-0">
              <Upload size={15} />
              {subiendoArchivo ? 'Subiendo...' : 'Subir Imagen'}
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadImagen}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {imagenes.map((img, i) => (
              <div
                key={i}
                className="relative rounded-xl overflow-hidden border border-emerald-200 aspect-video bg-[#FAFDFB]"
              >
                <img
                  src={img.ruta_imagen}
                  alt={img.descripcion_imagen}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImagenes((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 bg-white/90 text-[#14281D] rounded-lg p-1 text-[10px] font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => onNavigate('Inventario')}
          className="px-5 py-2.5 rounded-xl bg-white border border-emerald-200 text-[#14281D] text-sm font-semibold hover:bg-emerald-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando}
          className="px-6 py-2.5 rounded-xl bg-[#1B5E43] text-white text-sm font-semibold hover:bg-[#144732] flex items-center gap-2 shadow-sm"
        >
          <Check size={17} />
          {guardando ? 'Guardando...' : 'Finalizar y Registrar Equipo'}
        </button>
      </div>
    </form>
  );
}

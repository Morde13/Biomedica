import React, { useEffect, useState } from 'react';
import { X, Plus, Building2, Truck, Layers, Check } from 'lucide-react';
import { api } from '../services/api';

const CATALOGOS_SIMPLES = [
  { key: 'tipos_movilidad', label: 'Tipos de Movilidad' },
  { key: 'tipos_adquisicion', label: 'Tipos de Adquisición' },
  { key: 'clasificacion_riesgos', label: 'Clasificación de Riesgos' },
  { key: 'clasificacion_usos', label: 'Clasificación de Usos' },
  { key: 'tipos_documentos', label: 'Tipos de Documentos' },
  { key: 'fuentes_alimentacion', label: 'Fuente de Alimentación' },
  { key: 'tecnologias', label: 'Tecnología Predominante' },
  { key: 'tipos_mantenimiento', label: 'Tipos de Mantenimiento' },
];

export default function CatalogosModal({
  isOpen,
  onClose,
  catalogos,
  esquemaListo,
  onRefresh,
  initialConfig = null,
}) {
  const [tab, setTab] = useState('ubicacion');
  const [nombreSede, setNombreSede] = useState('');
  const [labData, setLabData] = useState({ nombre_laboratorio: '', id_sede: '' });
  const [provData, setProvData] = useState({
    nombre_proveedor: '',
    nit: '',
    correo_electronico: '',
    direccion: '',
    pais_origen: '',
    telefono: '',
  });
  const [catKey, setCatKey] = useState('tipos_movilidad');
  const [catValor, setCatValor] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Si viene desde un botón "+" específico, mostramos únicamente esa categoría
  const modoIndividual = Boolean(initialConfig?.focus);
  const focusType = initialConfig?.focus || null; // 'sede' | 'laboratorio' | 'proveedor' | 'catalogo'

  useEffect(() => {
    if (isOpen) {
      setMensaje('');
      if (initialConfig) {
        if (initialConfig.tab) setTab(initialConfig.tab);
        if (initialConfig.catKey) setCatKey(initialConfig.catKey);
        setLabData({
          nombre_laboratorio: '',
          id_sede: initialConfig.id_sede ? String(initialConfig.id_sede) : '',
        });
      } else {
        setTab('ubicacion');
      }
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const notify = (msg) => {
    setMensaje(msg);
    setTimeout(() => setMensaje(''), 2500);
  };

  const handleCrearSede = async (e) => {
    e.preventDefault();
    if (!nombreSede.trim()) return;
    const creada = await api.crearSede(nombreSede.trim(), esquemaListo);
    setNombreSede('');
    await onRefresh();
    if (initialConfig?.onCreated && focusType === 'sede') {
      initialConfig.onCreated(creada.id_sede);
    }
    notify('Sede agregada correctamente');
  };

  const handleCrearLab = async (e) => {
    e.preventDefault();
    if (!labData.nombre_laboratorio.trim()) return;
    const creado = await api.crearLaboratorio(
      {
        nombre_laboratorio: labData.nombre_laboratorio.trim(),
        id_sede: labData.id_sede ? Number(labData.id_sede) : null,
      },
      esquemaListo
    );
    setLabData((prev) => ({ ...prev, nombre_laboratorio: '' }));
    await onRefresh();
    if (initialConfig?.onCreated && focusType === 'laboratorio') {
      initialConfig.onCreated(creado.id_laboratorio, creado.id_sede);
    }
    notify('Laboratorio vinculado correctamente');
  };

  const handleCrearProveedor = async (e) => {
    e.preventDefault();
    if (!provData.nombre_proveedor.trim()) return;
    const creado = await api.crearProveedor(provData, esquemaListo);
    setProvData({
      nombre_proveedor: '',
      nit: '',
      correo_electronico: '',
      direccion: '',
      pais_origen: '',
      telefono: '',
    });
    await onRefresh();
    if (initialConfig?.onCreated && focusType === 'proveedor') {
      initialConfig.onCreated(creado.id_proveedor);
    }
    notify('Proveedor comercial registrado');
  };

  const handleCrearSimple = async (e) => {
    e.preventDefault();
    if (!catValor.trim()) return;
    const creado = await api.crearItemCatalogo(catKey, catValor.trim(), esquemaListo);
    setCatValor('');
    await onRefresh();
    if (initialConfig?.onCreated && focusType === 'catalogo') {
      initialConfig.onCreated(creado.id);
    }
    notify('Opción agregada correctamente');
  };

  const catalogoActualLabel =
    CATALOGOS_SIMPLES.find((c) => c.key === catKey)?.label || 'Categoría';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D261A]/40 backdrop-blur-xs p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white border border-emerald-100 rounded-2xl shadow-xl w-full ${
          modoIndividual && (focusType === 'sede' || focusType === 'laboratorio' || focusType === 'catalogo')
            ? 'max-w-lg'
            : 'max-w-2xl'
        } max-h-[88vh] flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-100 flex items-center justify-between bg-[#F6F9F7]">
          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-emerald-700">
              {modoIndividual ? 'AGREGAR OPCIÓN' : 'CONFIGURACIÓN DE CATEGORÍAS Y SOPORTE'}
            </p>
            <h3 className="text-lg font-bold text-[#14281D]">
              {initialConfig?.title || 'Gestión de Sedes, Laboratorios, Proveedores y Catálogos'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-800 hover:bg-emerald-100/70 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-tabs: SOLO se muestran cuando se abre el administrador general, NO en el botón "+" individual */}
        {!modoIndividual && (
          <div className="px-6 pt-4 flex gap-2 border-b border-emerald-100 bg-white">
            {[
              { id: 'ubicacion', label: 'Sedes y Laboratorios', icon: <Building2 size={15} /> },
              { id: 'proveedores', label: 'Proveedores', icon: <Truck size={15} /> },
              { id: 'parametricas', label: 'Categorías Técnicas', icon: <Layers size={15} /> },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-[#1B5E43] text-[#1B5E43] bg-emerald-50/60'
                    : 'border-transparent text-[#526B5C] hover:text-[#14281D]'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        )}

        {mensaje && (
          <div className="mx-6 mt-4 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2">
            <Check size={15} className="text-emerald-700" />
            {mensaje}
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-5">
          {/* MODO INDIVIDUAL: SOLO SEDE */}
          {modoIndividual && focusType === 'sede' && (
            <div className="space-y-4">
              <form onSubmit={handleCrearSede} className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={nombreSede}
                  onChange={(e) => setNombreSede(e.target.value)}
                  placeholder="Nombre de la nueva sede..."
                  className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#1B5E43] text-white text-xs font-semibold hover:bg-[#144732] flex items-center gap-1.5"
                >
                  <Plus size={15} /> Guardar Sede
                </button>
              </form>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                <p className="text-[11px] font-semibold text-[#526B5C]">Sedes registradas:</p>
                {(catalogos.sedes || []).map((s) => (
                  <div
                    key={s.id_sede}
                    className="px-3.5 py-2 text-xs font-medium bg-[#FAFDFB] border border-emerald-100 rounded-xl text-[#14281D]"
                  >
                    {s.nombre_sede}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODO INDIVIDUAL: SOLO LABORATORIO */}
          {modoIndividual && focusType === 'laboratorio' && (
            <div className="space-y-4">
              <form onSubmit={handleCrearLab} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#314B3C] mb-1">
                    Sede a la que pertenece *
                  </label>
                  <select
                    required
                    value={labData.id_sede}
                    onChange={(e) => setLabData({ ...labData, id_sede: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
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
                  <label className="block text-xs font-semibold text-[#314B3C] mb-1">
                    Nombre del Laboratorio *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      autoFocus
                      value={labData.nombre_laboratorio}
                      onChange={(e) =>
                        setLabData({ ...labData, nombre_laboratorio: e.target.value })
                      }
                      placeholder="Ej: Laboratorio de Bioinstrumentación"
                      className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-[#1B5E43] text-white text-xs font-semibold hover:bg-[#144732] flex items-center gap-1.5"
                    >
                      <Plus size={15} /> Guardar
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                <p className="text-[11px] font-semibold text-[#526B5C]">Laboratorios registrados:</p>
                {(catalogos.laboratorios || [])
                  .filter((l) => !labData.id_sede || String(l.id_sede) === String(labData.id_sede))
                  .map((l) => (
                    <div
                      key={l.id_laboratorio}
                      className="px-3.5 py-2 text-xs bg-[#FAFDFB] border border-emerald-100 rounded-xl flex justify-between items-center"
                    >
                      <span className="font-semibold text-[#14281D]">{l.nombre_laboratorio}</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        {l.nombre_sede || 'Sin sede'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* MODO INDIVIDUAL: SOLO CATEGORÍA ESPECÍFICA */}
          {modoIndividual && focusType === 'catalogo' && (
            <div className="space-y-4">
              <form onSubmit={handleCrearSimple} className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={catValor}
                  onChange={(e) => setCatValor(e.target.value)}
                  placeholder={`Escribe la nueva opción para ${catalogoActualLabel}...`}
                  className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#1B5E43] text-white text-xs font-semibold hover:bg-[#144732] flex items-center gap-1.5"
                >
                  <Plus size={15} /> Agregar
                </button>
              </form>

              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                <p className="text-[11px] font-semibold text-[#526B5C]">
                  Opciones actuales en {catalogoActualLabel}:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(catalogos[catKey] || []).map((item) => (
                    <div
                      key={item.id}
                      className="px-3.5 py-2 bg-[#FAFDFB] border border-emerald-100 rounded-xl text-xs font-medium text-[#14281D] flex items-center justify-between"
                    >
                      <span>{item.descripcion}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODO GENERAL: SEDES Y LABORATORIOS */}
          {!modoIndividual && tab === 'ubicacion' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-2xl border border-emerald-100 bg-[#FAFDFB] space-y-4">
                <h4 className="text-sm font-bold text-[#14281D]">Sedes</h4>
                <form onSubmit={handleCrearSede} className="flex gap-2">
                  <input
                    type="text"
                    value={nombreSede}
                    onChange={(e) => setNombreSede(e.target.value)}
                    placeholder="Nombre de la sede..."
                    className="flex-1 px-3 py-2 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-[#1B5E43] text-white text-xs font-semibold hover:bg-[#144732] flex items-center gap-1"
                  >
                    <Plus size={14} /> Crear
                  </button>
                </form>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(catalogos.sedes || []).map((s) => (
                    <div
                      key={s.id_sede}
                      className="px-3 py-2 text-xs font-medium bg-white border border-emerald-100 rounded-lg text-[#14281D]"
                    >
                      {s.nombre_sede}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-emerald-100 bg-[#FAFDFB] space-y-4">
                <h4 className="text-sm font-bold text-[#14281D]">Laboratorios</h4>
                <form onSubmit={handleCrearLab} className="space-y-2.5">
                  <select
                    value={labData.id_sede}
                    onChange={(e) => setLabData({ ...labData, id_sede: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
                  >
                    <option value="">Seleccionar sede asociada...</option>
                    {(catalogos.sedes || []).map((s) => (
                      <option key={s.id_sede} value={s.id_sede}>
                        {s.nombre_sede}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={labData.nombre_laboratorio}
                      onChange={(e) =>
                        setLabData({ ...labData, nombre_laboratorio: e.target.value })
                      }
                      placeholder="Nombre del laboratorio..."
                      className="flex-1 px-3 py-2 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-[#1B5E43] text-white text-xs font-semibold hover:bg-[#144732] flex items-center gap-1"
                    >
                      <Plus size={14} /> Crear
                    </button>
                  </div>
                </form>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {(catalogos.laboratorios || []).map((l) => (
                    <div
                      key={l.id_laboratorio}
                      className="px-3 py-2 text-xs bg-white border border-emerald-100 rounded-lg flex justify-between items-center"
                    >
                      <span className="font-semibold text-[#14281D]">{l.nombre_laboratorio}</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {l.nombre_sede || 'Sin sede'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PROVEEDORES (Tanto en modo individual '+' como en pestaña general) */}
          {((modoIndividual && focusType === 'proveedor') ||
            (!modoIndividual && tab === 'proveedores')) && (
            <div className="space-y-5">
              <form
                onSubmit={handleCrearProveedor}
                className="p-4 rounded-2xl border border-emerald-100 bg-[#FAFDFB] grid grid-cols-1 sm:grid-cols-2 gap-3.5"
              >
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#314B3C] mb-1">
                    Nombre del Proveedor *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus={focusType === 'proveedor'}
                    value={provData.nombre_proveedor}
                    onChange={(e) => setProvData({ ...provData, nombre_proveedor: e.target.value })}
                    placeholder="Ej: Instrumentación Científica S.A.S."
                    className="w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#314B3C] mb-1">NIT</label>
                  <input
                    type="text"
                    value={provData.nit}
                    onChange={(e) => setProvData({ ...provData, nit: e.target.value })}
                    placeholder="900.123.456-7"
                    className="w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#314B3C] mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={provData.telefono}
                    onChange={(e) => setProvData({ ...provData, telefono: e.target.value })}
                    placeholder="+57 601..."
                    className="w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#314B3C] mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={provData.correo_electronico}
                    onChange={(e) =>
                      setProvData({ ...provData, correo_electronico: e.target.value })
                    }
                    placeholder="contacto@proveedor.com"
                    className="w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#314B3C] mb-1">
                    País de Origen
                  </label>
                  <input
                    type="text"
                    value={provData.pais_origen}
                    onChange={(e) => setProvData({ ...provData, pais_origen: e.target.value })}
                    placeholder="Colombia / Alemania / Japón"
                    className="w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#314B3C] mb-1">Dirección</label>
                  <input
                    type="text"
                    value={provData.direccion}
                    onChange={(e) => setProvData({ ...provData, direccion: e.target.value })}
                    placeholder="Dirección comercial..."
                    className="w-full px-3 py-2 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#1B5E43] text-white text-xs font-semibold hover:bg-[#144732] flex items-center gap-1.5"
                  >
                    <Plus size={15} /> Guardar Proveedor
                  </button>
                </div>
              </form>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(catalogos.proveedores || []).map((p) => (
                  <div
                    key={p.id_proveedor}
                    className="px-4 py-2.5 bg-white border border-emerald-100 rounded-xl flex flex-wrap justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#14281D]">{p.nombre_proveedor}</p>
                      <p className="text-[#526B5C]">
                        NIT: {p.nit || 'N/A'} · {p.correo_electronico || 'Sin correo'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-medium">
                      {p.pais_origen || 'Local'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODO GENERAL: CATEGORÍAS TÉCNICAS */}
          {!modoIndividual && tab === 'parametricas' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#314B3C] mb-1.5">
                  Seleccionar Categoría
                </label>
                <select
                  value={catKey}
                  onChange={(e) => setCatKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FAFDFB] border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
                >
                  {CATALOGOS_SIMPLES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleCrearSimple} className="flex gap-2">
                <input
                  type="text"
                  value={catValor}
                  onChange={(e) => setCatValor(e.target.value)}
                  placeholder={`Agregar nuevo en ${catalogoActualLabel}...`}
                  className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#1B5E43] text-white text-xs font-semibold hover:bg-[#144732] flex items-center gap-1.5"
                >
                  <Plus size={15} /> Agregar
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {(catalogos[catKey] || []).map((item) => (
                  <div
                    key={item.id}
                    className="px-3.5 py-2 bg-[#FAFDFB] border border-emerald-100 rounded-xl text-xs font-medium text-[#14281D] flex items-center justify-between"
                  >
                    <span>{item.descripcion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

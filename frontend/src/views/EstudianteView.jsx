import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  QrCode,
  FileText,
  User,
  Lock,
  X,
  AlertCircle,
} from 'lucide-react';
import EquipoDetalleModal from '../components/EquipoDetalleModal';
import QrBarcodeScannerModal from '../components/QrBarcodeScannerModal';

export default function EstudianteView({
  equipos = [],
  catalogos = {},
  esquemaListo = false,
  logoUrl = '/img/escudo_universidad.png',
  selectedLabId = 'all',
  onSelectLabId,
  onLogin,
  onRefresh,
}) {
  const [busqueda, setBusqueda] = useState('');
  const [sedeFiltro, setSedeFiltro] = useState('all');
  const [equipoSeleccionadoId, setEquipoSeleccionadoId] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  // Menú desplegable de acceso administrativo (solo ícono de ingreso arriba a la derecha)
  const [accesoMenuOpen, setAccesoMenuOpen] = useState(false);
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [autenticando, setAutenticando] = useState(false);
  const [alertaError, setAlertaError] = useState('');

  const accesoRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accesoRef.current && !accesoRef.current.contains(e.target)) {
        setAccesoMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Laboratorios disponibles según la Sede seleccionada en el filtro de búsqueda
  const laboratoriosDisponibles = useMemo(() => {
    const todos = catalogos.laboratorios || [];
    if (sedeFiltro === 'all') return todos;
    return todos.filter((l) => String(l.id_sede) === String(sedeFiltro));
  }, [catalogos.laboratorios, sedeFiltro]);

  const equiposFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return equipos.filter((eq) => {
      if (sedeFiltro !== 'all') {
        const labDeEq = (catalogos.laboratorios || []).find(
          (l) => Number(l.id_laboratorio) === Number(eq.id_laboratorio)
        );
        const idSedeEq = eq.id_sede || labDeEq?.id_sede;
        if (String(idSedeEq) !== String(sedeFiltro)) return false;
      }

      if (!q) return true;
      const texto = `${eq.nombre_equipo || ''} ${eq.fabricante || ''} ${eq.modelo || ''} ${
        eq.serie_universidad || ''
      } ${eq.serie_laboratorio || ''} ${eq.serie_equipo || ''} ${
        eq.nombre_laboratorio || ''
      }`.toLowerCase();
      return texto.includes(q);
    });
  }, [equipos, busqueda, sedeFiltro, catalogos.laboratorios]);

  const equipoDetalle = useMemo(
    () => equipos.find((e) => e.id_equipo === equipoSeleccionadoId) || null,
    [equipos, equipoSeleccionadoId]
  );

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setAlertaError('');
    setAutenticando(true);
    try {
      await onLogin(correo, contrasena);
      setAccesoMenuOpen(false);
      setCorreo('');
      setContrasena('');
    } catch (err) {
      setAlertaError(err.message || 'Usuario o contraseña incorrectos.');
    } finally {
      setAutenticando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F9F7] text-[#14281D] flex flex-col">
      {/* Notificación flotante de error de acceso (esquina superior derecha) */}
      {alertaError && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-emerald-200 shadow-xl rounded-xl px-4 py-3 flex items-center gap-3 min-w-[290px] max-w-sm">
          <AlertCircle size={18} className="text-[#1B5E43] shrink-0" />
          <p className="text-xs font-semibold text-[#14281D] flex-1">{alertaError}</p>
          <button
            type="button"
            onClick={() => setAlertaError('')}
            className="p-1 rounded-lg text-[#526B5C] hover:bg-emerald-50"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ===================================================================
          ENCABEZADO SUPERIOR VERDE MUY CLARITO Y TEXTOS CENTRADOS
         =================================================================== */}
      <header className="bg-[#EAF5EE] border-b border-emerald-200/80 text-[#14281D]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-5 pb-7">
          {/* Fila superior: Escudo Universidad | Título fijo centrado "Inventario / Universidad Simón Bolívar" | Solo Ícono de Ingreso */}
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Izquierda: Logo Universidad */}
            <div className="flex items-center gap-3 justify-self-start">
              <div className="w-11 h-11 rounded-2xl bg-white border border-emerald-200/90 flex items-center justify-center p-1 shrink-0 shadow-2xs">
                <img
                  src={logoUrl}
                  onError={(e) => {
                    e.currentTarget.src = '/archivos/img/escudo_universidad.png';
                  }}
                  alt="Universidad Simón Bolívar"
                  className="w-full h-full object-contain select-none pointer-events-none"
                />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[11px] font-extrabold tracking-wider uppercase text-[#1B5E43] leading-tight">
                  UNIVERSIDAD
                </p>
                <p className="text-xs font-black tracking-wide uppercase text-[#14281D] leading-tight">
                  SIMÓN BOLÍVAR
                </p>
              </div>
            </div>

            {/* Centro: Título fijo "Biblioteca de Equipos" y subtítulo "Universidad Simón Bolívar" centrados */}
            <div className="text-center justify-self-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#14281D]">
                Biblioteca de Equipos
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-[#1B5E43] mt-0.5">
                Universidad Simón Bolívar
              </p>
            </div>

            {/* Derecha: SOLO EL ÍCONO DE INGRESO con menú desplegable de acceso */}
            <div className="relative justify-self-end" ref={accesoRef}>
              <button
                type="button"
                onClick={() => {
                  setAccesoMenuOpen(!accesoMenuOpen);
                  setAlertaError('');
                }}
                title="Acceso Administrativo"
                className="w-10 h-10 rounded-full bg-white hover:bg-[#1B5E43] text-[#1B5E43] hover:text-white border border-emerald-200 flex items-center justify-center transition-colors shadow-xs"
              >
                <User size={19} />
              </button>

              {accesoMenuOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white text-[#14281D] border border-emerald-200 rounded-2xl shadow-2xl z-40 p-5 space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#EEF6F1] text-[#1B5E43] flex items-center justify-center">
                        <Lock size={15} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#14281D]">
                          Acceso Administrativo
                        </h3>
                        <p className="text-[11px] text-[#6B8576]">
                          Ingresa tus credenciales de gestión
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAccesoMenuOpen(false)}
                      className="p-1 rounded-lg text-[#526B5C] hover:bg-emerald-50"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitLogin} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#2E4839] mb-1">
                        Usuario o Correo
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        placeholder="admin"
                        className="w-full px-3 py-2 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#2E4839] mb-1">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        required
                        value={contrasena}
                        onChange={(e) => setContrasena(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={autenticando}
                      className="w-full py-2.5 rounded-xl bg-[#1B5E43] text-white text-xs font-bold hover:bg-[#144732] transition-colors shadow-xs"
                    >
                      {autenticando ? 'Verificando...' : 'Ingresar al Panel'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Subtítulo centrado + Barra de Búsqueda con QR y Filtros de Sede / Laboratorio abajo */}
          <div className="mt-4 max-w-3xl mx-auto text-center space-y-3">
            <p className="text-xs sm:text-sm text-[#4A6657] font-medium">
              Consulta de equipos disponibles y expedientes técnicos
            </p>

            {/* Barra de búsqueda arriba + Filtros de Sede y Laboratorio centrados DEBAJO */}
            <div className="space-y-3 max-w-2xl mx-auto">
              <div className="relative w-full">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B8576] pointer-events-none"
                />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar equipo, marca, serial..."
                  className="w-full pl-11 pr-12 py-3 text-sm bg-white text-[#14281D] rounded-full shadow-xs border border-emerald-200 focus:outline-none focus:border-[#1B5E43] placeholder:text-[#8BA395]"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda('')}
                    title="Limpiar búsqueda"
                    className="absolute right-11 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#6B8576] hover:bg-emerald-50"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  title="Escanear código QR o Código de Barras"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[#1B5E43] hover:bg-[#E7F5ED] transition-colors flex items-center justify-center"
                >
                  <QrCode size={18} />
                </button>
              </div>

              {/* Filtros de Sede y Laboratorio ubicados abajo de la barra de búsqueda */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <select
                  value={sedeFiltro}
                  onChange={(e) => {
                    setSedeFiltro(e.target.value);
                    onSelectLabId?.('all');
                  }}
                  className="w-full sm:w-56 px-4 py-2 text-xs font-semibold bg-white text-[#14281D] border border-emerald-200 rounded-full shadow-2xs focus:outline-none focus:border-[#1B5E43]"
                >
                  <option value="all">Sede: Todas las sedes</option>
                  {(catalogos.sedes || []).map((s) => (
                    <option key={s.id_sede} value={s.id_sede}>
                      Sede: {s.nombre_sede}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedLabId}
                  onChange={(e) => onSelectLabId?.(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2 text-xs font-semibold bg-white text-[#14281D] border border-emerald-200 rounded-full shadow-2xs focus:outline-none focus:border-[#1B5E43]"
                >
                  <option value="all">Laboratorio: Todos los laboratorios</option>
                  {laboratoriosDisponibles.map((l) => (
                    <option key={l.id_laboratorio} value={l.id_laboratorio}>
                      Laboratorio: {l.nombre_laboratorio}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===================================================================
          CUERPO PRINCIPAL: CUADRÍCULA DE EQUIPOS REGISTRADOS
         =================================================================== */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-5">
        <div className="flex items-center justify-center sm:justify-start gap-2.5">
          <h2 className="text-lg font-extrabold text-[#2E4839] tracking-tight">
            Equipos Registrados
          </h2>
          <span className="px-2.5 py-0.5 rounded-full bg-[#E7F5ED] text-[#145338] text-xs font-bold">
            {equiposFiltrados.length}
          </span>
        </div>

        {/* Cuadrícula de Tarjetas (Vista Previa: Cuadro 2x2 bien proporcionado + Solo Nombre + Solo Seriales a la izquierda) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equiposFiltrados.map((eq) => {
            const imgs = eq.imagenes || [];
            return (
              <div
                key={eq.id_equipo}
                className="bg-white rounded-2xl border border-emerald-100/90 shadow-[0_2px_14px_rgba(20,40,29,0.04)] hover:shadow-[0_8px_24px_rgba(20,40,29,0.08)] transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  {/* Cabecera: Cuadro 2x2 de fotos bien proporcionado + SOLO el nombre del equipo */}
                  <div className="flex items-center gap-4">
                    {imgs.length === 0 ? (
                      <div className="w-24 h-24 rounded-xl bg-[#F6F9F7] border border-emerald-100 flex items-center justify-center text-[11px] font-medium text-[#8BA395] shrink-0">
                        Sin foto
                      </div>
                    ) : imgs.length === 1 ? (
                      <button
                        type="button"
                        onClick={() => setImagenAmpliada(imgs[0])}
                        title="Haz clic para ampliar la fotografía"
                        className="w-24 h-24 rounded-xl overflow-hidden border border-emerald-200 bg-[#F6F9F7] shrink-0 group relative"
                      >
                        <img
                          src={imgs[0].ruta_imagen}
                          alt={eq.nombre_equipo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </button>
                    ) : (
                      /* Cuadrícula 2x2 fija (grid-cols-2 grid-rows-2) para que 2, 3 o 4 imágenes queden siempre cuadradas sin deformarse */
                      <div className="w-24 h-24 grid grid-cols-2 grid-rows-2 gap-1 shrink-0">
                        {[0, 1, 2, 3].map((slotIdx) => {
                          const img = imgs[slotIdx];
                          if (!img) {
                            return (
                              <div
                                key={slotIdx}
                                className="rounded-md bg-[#F6F9F7] border border-emerald-100/70 w-full h-full"
                              />
                            );
                          }
                          return (
                            <button
                              key={img.id_imagen || slotIdx}
                              type="button"
                              onClick={() => setImagenAmpliada(img)}
                              title={img.descripcion_imagen || eq.nombre_equipo}
                              className="relative rounded-md overflow-hidden border border-emerald-200 bg-[#F6F9F7] w-full h-full group"
                            >
                              <img
                                src={img.ruta_imagen}
                                alt={img.descripcion_imagen || eq.nombre_equipo}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              />
                              {slotIdx === 3 && imgs.length > 4 && (
                                <span className="absolute inset-0 bg-[#0D261A]/65 text-white text-[10px] font-bold flex items-center justify-center">
                                  +{imgs.length - 4}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Solo el Nombre del Equipo centrado en su espacio */}
                    <div className="min-w-0 flex-1 text-center">
                      <h3 className="text-base font-extrabold text-[#1B5E43] leading-snug">
                        {eq.nombre_equipo}
                      </h3>
                    </div>
                  </div>

                  {/* SOLO los 3 Seriales alineados a la izquierda */}
                  <div className="space-y-1.5 text-xs pt-1 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#2E4839]">Serial Universidad:</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#EEF6F1] text-[#1B5E43] font-mono font-semibold text-[11px]">
                        {eq.serie_universidad || 'S/N'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#2E4839]">Serial Laboratorio:</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#EEF6F1] text-[#1B5E43] font-mono font-semibold text-[11px]">
                        {eq.serie_laboratorio || 'S/N'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#2E4839]">Serial Fábrica:</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#EEF6F1] text-[#1B5E43] font-mono font-semibold text-[11px]">
                        {eq.serie_equipo || 'S/N'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Separador + Botón Ver Hoja de Vida */}
                <div className="pt-3 border-t border-emerald-100/80">
                  <button
                    type="button"
                    onClick={() => setEquipoSeleccionadoId(eq.id_equipo)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1B5E43] hover:bg-[#144732] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <FileText size={14} />
                    Ver Hoja de Vida
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {equiposFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-emerald-100 p-12 text-center space-y-2">
            <p className="text-sm font-bold text-[#14281D]">
              No se encontraron equipos registrados con ese criterio
            </p>
            <p className="text-xs text-[#6B8576]">
              Intenta buscar por otro nombre, serie de universidad, serie de laboratorio o escanea el código QR.
            </p>
          </div>
        )}
      </main>

      {/* Visor rápido si el estudiante hace clic sobre una miniatura de foto */}
      {imagenAmpliada && (
        <div
          onClick={() => setImagenAmpliada(null)}
          className="fixed inset-0 z-50 bg-[#0D261A]/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-3 max-w-2xl w-full space-y-2 shadow-2xl"
          >
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-xs font-bold text-[#14281D]">
                {imagenAmpliada.descripcion_imagen || 'Vista previa del equipo'}
              </p>
              <button
                type="button"
                onClick={() => setImagenAmpliada(null)}
                className="p-1 rounded-lg text-[#526B5C] hover:bg-emerald-50"
              >
                <X size={16} />
              </button>
            </div>
            <img
              src={imagenAmpliada.ruta_imagen}
              alt={imagenAmpliada.descripcion_imagen || 'Equipo'}
              className="w-full max-h-[75vh] object-contain rounded-xl bg-[#F6F9F7]"
            />
          </div>
        </div>
      )}

      {/* Hoja de Vida en modo Solo Lectura (readOnly={true}) */}
      {equipoDetalle && (
        <EquipoDetalleModal
          equipo={equipoDetalle}
          catalogos={catalogos}
          esquemaListo={esquemaListo}
          readOnly={true}
          onClose={() => setEquipoSeleccionadoId(null)}
          onRefresh={onRefresh}
        />
      )}

      {/* Escáner de Cámara QR y Código de Barras */}
      <QrBarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(codigo) => setBusqueda(codigo)}
        title="Buscar equipo por Código QR o Código de Barras"
      />
    </div>
  );
}

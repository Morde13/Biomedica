import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutGrid,
  Plus,
  Wrench,
  Activity,
  ArrowUpRight,
  ChevronDown,
  Calendar,
  Bell,
  LifeBuoy,
  Menu,
  X,
  Database,
  FolderOpen,
  Upload,
  ShieldCheck,
  LogOut,
  Lock,
  UserCheck,
} from 'lucide-react';
import { api } from './services/api';
import InventarioView from './views/InventarioView';
import RegistroEquipoView from './views/RegistroEquipoView';
import MantenimientoView from './views/MantenimientoView';
import CalibracionView from './views/CalibracionView';
import PrestamosView from './views/PrestamosView';
import UsuariosView from './views/UsuariosView';
import EstudianteView from './views/EstudianteView';
import CatalogosModal from './components/CatalogosModal';

const SESSION_KEY = 'labora_admin_session_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState('Inventario');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState('all');

  const workspaceDropdownRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        workspaceDropdownRef.current &&
        !workspaceDropdownRef.current.contains(event.target)
      ) {
        setWorkspaceDropdownOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sesión administrativa vs Vista Estudiante
  const [usuarioActual, setUsuarioActual] = useState(() => {
    try {
      localStorage.removeItem('labora_demo_store_v1');
      localStorage.removeItem('labora_admin_session_v1');
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw || raw === 'LOGGED_OUT') return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginCorreo, setLoginCorreo] = useState('');
  const [loginContrasena, setLoginContrasena] = useState('');
  const [loginError, setLoginError] = useState('');
  const [autenticando, setAutenticando] = useState(false);

  const [estadoBd, setEstadoBd] = useState({ conectado: false, esquema_listo: false });
  const logoUrl = '/img/escudo_universidad.png';
  const [catalogos, setCatalogos] = useState({});
  const [equipos, setEquipos] = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [calibraciones, setCalibraciones] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [roles, setRoles] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const [catalogosModalOpen, setCatalogosModalOpen] = useState(false);
  const [catalogosInitialConfig, setCatalogosInitialConfig] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const abrirCatalogosConConfig = (config = null) => {
    setCatalogosInitialConfig(config);
    setCatalogosModalOpen(true);
  };

  // Refresca las listas de datos directamente desde la base de datos real en el servidor
  const refrescarDatos = async () => {
    try {
      const [cats, eqs, mants, cals, prests, rls, usrs] = await Promise.all([
        api.obtenerCatalogos(),
        api.listarEquipos(),
        api.listarMantenimientos(),
        api.listarCalibraciones(),
        api.listarPrestamos(),
        api.listarRoles(),
        api.listarUsuarios(),
      ]);

      setCatalogos(cats || {});
      setEquipos(eqs || []);
      setMantenimientos(mants || []);
      setCalibraciones(cals || []);
      setPrestamos(prests || []);
      setRoles(rls || []);
      setUsuarios(usrs || []);
    } catch (err) {
      console.error('Error al consultar la base de datos:', err);
    }
  };

  // Verifica el estado del servidor FastAPI/MySQL y carga datos reales
  const verificarEstadoServidor = async (forzar = false) => {
    const estado = await api.obtenerEstado(forzar);
    setEstadoBd(estado);
    await refrescarDatos();
  };

  useEffect(() => {
    verificarEstadoServidor();
  }, []);

  const handleCerrarSesionIrAEstudiante = () => {
    setProfileMenuOpen(false);
    setUsuarioActual(null);
    localStorage.setItem(SESSION_KEY, 'LOGGED_OUT');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setAutenticando(true);
    try {
      const user = await api.iniciarSesion(
        loginCorreo,
        loginContrasena,
        Boolean(estadoBd.esquema_listo)
      );
      setUsuarioActual(user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      setLoginModalOpen(false);
      setLoginCorreo('');
      setLoginContrasena('');
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setAutenticando(false);
    }
  };

  // Filtrar datos por Laboratorio seleccionado en "Espacio de trabajo"
  const laboratorioActual = useMemo(() => {
    if (selectedLabId === 'all') return null;
    return (catalogos.laboratorios || []).find(
      (l) => String(l.id_laboratorio) === String(selectedLabId)
    );
  }, [selectedLabId, catalogos]);

  const equiposFiltrados = useMemo(() => {
    if (!laboratorioActual) return equipos;
    return equipos.filter(
      (e) => Number(e.id_laboratorio) === Number(laboratorioActual.id_laboratorio)
    );
  }, [equipos, laboratorioActual]);

  const mantenimientosFiltrados = useMemo(() => {
    if (!laboratorioActual) return mantenimientos;
    return mantenimientos.filter(
      (m) => Number(m.id_laboratorio) === Number(laboratorioActual.id_laboratorio)
    );
  }, [mantenimientos, laboratorioActual]);

  const calibracionesFiltradas = useMemo(() => {
    if (!laboratorioActual) return calibraciones;
    return calibraciones.filter(
      (c) => Number(c.id_laboratorio) === Number(laboratorioActual.id_laboratorio)
    );
  }, [calibraciones, laboratorioActual]);

  const prestamosFiltrados = useMemo(() => {
    if (!laboratorioActual) return prestamos;
    return prestamos.filter(
      (p) => Number(p.id_laboratorio) === Number(laboratorioActual.id_laboratorio)
    );
  }, [prestamos, laboratorioActual]);

  const fechaActualTexto = useMemo(() => {
    return new Date().toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, []);

  const navItems = [
    { name: 'Inventario', icon: LayoutGrid, badge: null },
    { name: 'Registro de equipo', icon: Plus, badge: null },
    {
      name: 'Registro de mantenimiento',
      icon: Wrench,
      badge: mantenimientosFiltrados.length || null,
    },
    {
      name: 'Registro de calibración',
      icon: Activity,
      badge: calibracionesFiltradas.length || null,
    },
    {
      name: 'Préstamos',
      icon: ArrowUpRight,
      badge:
        prestamosFiltrados.filter(
          (p) => (p.estado_prestamo || '').toLowerCase() !== 'devuelto'
        ).length || null,
    },
    {
      name: 'Usuarios y Roles',
      icon: ShieldCheck,
      badge: null,
    },
  ];

  const inicialesWorkspace = laboratorioActual
    ? laboratorioActual.nombre_laboratorio
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'IC';

  const nombreWorkspace = laboratorioActual
    ? laboratorioActual.nombre_laboratorio
    : catalogos.sedes?.[0]?.nombre_sede || 'Instituto Central';

  const subtituloWorkspace = laboratorioActual
    ? laboratorioActual.nombre_sede || 'Universidad'
    : 'Todos los laboratorios';

  const inicialesUsuario = usuarioActual?.nombre_completo
    ? usuarioActual.nombre_completo
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'MG';

  // =====================================================================
  // VISTA DE ESTUDIANTE (CATÁLOGO EN CUADRÍCULA + HOJA DE VIDA SOLO LECTURA)
  // =====================================================================
  if (!usuarioActual) {
    return (
      <EstudianteView
        equipos={equiposFiltrados}
        catalogos={catalogos}
        esquemaListo={Boolean(estadoBd.esquema_listo)}
        logoUrl={logoUrl}
        selectedLabId={selectedLabId}
        onSelectLabId={setSelectedLabId}
        onLogin={async (correo, contrasena) => {
          const user = await api.iniciarSesion(
            correo,
            contrasena,
            Boolean(estadoBd.esquema_listo)
          );
          setUsuarioActual(user);
          localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        }}
        onRefresh={() => refrescarDatos()}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F6F9F7] text-[#14281D]">
      {/* Overlay móvil */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-[#0D261A]/30 lg:hidden"
        />
      )}

      {/* SIDEBAR BLANCA Y VERDE */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[276px] bg-white border-r border-emerald-100/90 flex flex-col justify-between transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 space-y-6">
          {/* Logo Institucional Fijo (Escudo Universidad Simón Bolívar - No modificable) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white border border-emerald-200/80 flex items-center justify-center overflow-hidden shrink-0 p-1">
                <img
                  src={logoUrl}
                  onError={(e) => {
                    e.currentTarget.src = '/archivos/img/escudo_universidad.png';
                  }}
                  alt="Escudo Universidad Simón Bolívar"
                  className="w-full h-full object-contain select-none pointer-events-none"
                />
              </div>
              <div>
                <span className="block text-lg font-extrabold text-[#14281D] leading-none tracking-tight">
                  Inventario
                </span>
                <span className="block text-[10px] font-bold tracking-widest uppercase text-[#6B8576] mt-1">
                  Universidad Simón Bolívar
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-[#526B5C] hover:bg-emerald-50"
            >
              <X size={18} />
            </button>
          </div>

          {/* Selector ESPACIO DE TRABAJO */}
          <div className="relative" ref={workspaceDropdownRef}>
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#7B9385] mb-2 px-1">
              ESPACIO DE TRABAJO
            </p>
            <button
              type="button"
              onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
              className="w-full p-3 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 transition-colors flex items-center justify-between text-left shadow-[0_1px_4px_rgba(20,40,29,0.03)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#EEF5F0] text-[#1B5E43] font-bold text-xs flex items-center justify-center shrink-0">
                  {inicialesWorkspace}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#14281D] truncate">{nombreWorkspace}</p>
                  <p className="text-[11px] text-[#6B8576] truncate">{subtituloWorkspace}</p>
                </div>
              </div>
              <ChevronDown size={16} className="text-[#6B8576] shrink-0 ml-2" />
            </button>

            {workspaceDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-emerald-200 rounded-2xl shadow-lg z-30 p-2 space-y-1">
                <button
                  onClick={() => {
                    setSelectedLabId('all');
                    setWorkspaceDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                    selectedLabId === 'all'
                      ? 'bg-[#EBF5EE] text-[#1B5E43]'
                      : 'text-[#14281D] hover:bg-[#F6F9F7]'
                  }`}
                >
                  Todas las Sedes y Laboratorios
                </button>
                {(catalogos.laboratorios || []).map((lab) => (
                  <button
                    key={lab.id_laboratorio}
                    onClick={() => {
                      setSelectedLabId(String(lab.id_laboratorio));
                      setWorkspaceDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs ${
                      String(selectedLabId) === String(lab.id_laboratorio)
                        ? 'bg-[#EBF5EE] text-[#1B5E43] font-bold'
                        : 'text-[#14281D] hover:bg-[#F6F9F7] font-medium'
                    }`}
                  >
                    <span className="block truncate">{lab.nombre_laboratorio}</span>
                    <span className="block text-[10px] text-[#6B8576]">
                      {lab.nombre_sede || 'Sede universitaria'}
                    </span>
                  </button>
                ))}
                <div className="pt-1 border-t border-emerald-100">
                  <button
                    onClick={() => {
                      setWorkspaceDropdownOpen(false);
                      abrirCatalogosConConfig({ tab: 'ubicacion' });
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#1B5E43] hover:bg-emerald-50"
                  >
                    + Gestionar Sedes y Laboratorios
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MENÚ PRINCIPAL */}
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#7B9385] mb-2.5 px-1">
              MENÚ PRINCIPAL
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setActiveTab(item.name);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm transition-colors ${
                      active
                        ? 'bg-[#EBF5EE] text-[#145338] font-bold'
                        : 'text-[#4F685A] hover:bg-[#F5F9F7] hover:text-[#14281D] font-medium'
                    }`}
                  >
                    <span className="flex items-center gap-3 truncate">
                      <Icon
                        size={18}
                        className={active ? 'text-[#1B5E43]' : 'text-[#6B8576]'}
                      />
                      <span className="truncate">{item.name}</span>
                    </span>
                    {item.badge !== null && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          active ? 'bg-white text-[#1B5E43]' : 'text-[#6B8576]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tarjeta inferior de guía */}
        <div className="p-5">
          <div className="p-4 rounded-2xl bg-[#F6FAF7] border border-emerald-100 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E3F2E8] text-[#1B5E43] flex items-center justify-center">
              <LifeBuoy size={17} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#14281D]">¿Necesitas ayuda?</p>
              <p className="text-[11px] text-[#6B8576] mt-0.5 leading-relaxed">
                Consulta las carpetas de archivos, escudo institucional y conexión SQL.
              </p>
            </div>
            <button
              onClick={() => setInfoModalOpen(true)}
              className="text-xs font-bold text-[#1B5E43] hover:underline inline-flex items-center gap-1"
            >
              Ver estado y carpetas <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra Superior Minimalista Blanca */}
        <header className="h-16 bg-white border-b border-emerald-100/90 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#14281D] hover:bg-emerald-50"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm truncate">
              <span className="text-[#6B8576] font-medium truncate">{nombreWorkspace}</span>
              <span className="text-[#A0B5A8]">/</span>
              <span className="font-bold text-[#14281D] truncate">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Indicador estado SQL */}
            <button
              onClick={() => setInfoModalOpen(true)}
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                estadoBd.esquema_listo
                  ? 'bg-[#E7F5ED] border-emerald-200 text-[#145338]'
                  : 'bg-white border-emerald-200 text-[#1B5E43]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E43]" />
              {estadoBd.esquema_listo ? 'MySQL Conectado' : 'Verificando MySQL'}
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[#526B5C] px-2">
              <Calendar size={15} className="text-[#6B8576]" />
              <span>{fechaActualTexto}</span>
            </div>

            <button
              onClick={() => abrirCatalogosConConfig(null)}
              title="Categorías del sistema"
              className="w-9 h-9 rounded-xl border border-emerald-100 bg-white hover:bg-emerald-50 flex items-center justify-center text-[#314B3C] relative"
            >
              <Bell size={16} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E43] absolute top-2 right-2.5" />
            </button>

            {/* Menú desplegable de Perfil */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-emerald-100 hover:border-emerald-300 bg-white transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#E3EFE8] text-[#1B5E43] font-bold text-xs flex items-center justify-center">
                  {inicialesUsuario}
                </div>
                <ChevronDown size={14} className="text-[#526B5C]" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-emerald-200 rounded-2xl shadow-lg z-40 p-2 space-y-1">
                  <div className="px-3 py-2.5 border-b border-emerald-100">
                    <p className="text-xs font-bold text-[#14281D] truncate">
                      {usuarioActual.nombre_completo}
                    </p>
                    <p className="text-[11px] text-[#6B8576] truncate">
                      {usuarioActual.correo_electronico}
                    </p>
                    <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-[#E7F5ED] text-[#145338] text-[10px] font-bold">
                      Rol: {usuarioActual.nombre_rol}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setActiveTab('Usuarios y Roles');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#14281D] hover:bg-[#F5F9F7] flex items-center gap-2"
                  >
                    <UserCheck size={15} className="text-[#1B5E43]" />
                    Perfiles y Roles de Administrador
                  </button>

                  <button
                    onClick={handleCerrarSesionIrAEstudiante}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#14281D] hover:bg-[#EBF5EE] flex items-center gap-2"
                  >
                    <LogOut size={15} className="text-[#1B5E43]" />
                    Salir a Menú de Estudiante
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Área de Vistas */}
        <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {activeTab === 'Inventario' && (
            <InventarioView
              equipos={equiposFiltrados}
              mantenimientos={mantenimientos}
              calibraciones={calibraciones}
              catalogos={catalogos}
              esquemaListo={Boolean(estadoBd.esquema_listo)}
              onNavigate={setActiveTab}
              onOpenCatalogos={() => abrirCatalogosConConfig(null)}
              onRefresh={() => refrescarDatos()}
            />
          )}

          {activeTab === 'Registro de equipo' && (
            <RegistroEquipoView
              equipos={equipos}
              catalogos={catalogos}
              esquemaListo={Boolean(estadoBd.esquema_listo)}
              onOpenCatalogos={(cfg) => abrirCatalogosConConfig(cfg)}
              onRefresh={() => refrescarDatos()}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'Registro de mantenimiento' && (
            <MantenimientoView
              mantenimientos={mantenimientosFiltrados}
              equipos={equiposFiltrados}
              catalogos={catalogos}
              esquemaListo={Boolean(estadoBd.esquema_listo)}
              onOpenCatalogos={(cfg) => abrirCatalogosConConfig(cfg)}
              onRefresh={() => refrescarDatos()}
            />
          )}

          {activeTab === 'Registro de calibración' && (
            <CalibracionView
              calibraciones={calibracionesFiltradas}
              equipos={equiposFiltrados}
              esquemaListo={Boolean(estadoBd.esquema_listo)}
              onRefresh={() => refrescarDatos()}
            />
          )}

          {activeTab === 'Préstamos' && (
            <PrestamosView
              prestamos={prestamosFiltrados}
              equipos={equiposFiltrados}
              esquemaListo={Boolean(estadoBd.esquema_listo)}
              onRefresh={() => refrescarDatos()}
            />
          )}

          {activeTab === 'Usuarios y Roles' && (
            <UsuariosView
              usuarios={usuarios}
              roles={roles}
              esquemaListo={Boolean(estadoBd.esquema_listo)}
              onRefresh={() => refrescarDatos()}
            />
          )}
        </main>
      </div>

      {/* Modal de Catálogos, Sedes, Laboratorios y Proveedores */}
      <CatalogosModal
        isOpen={catalogosModalOpen}
        onClose={() => {
          setCatalogosModalOpen(false);
          setCatalogosInitialConfig(null);
        }}
        catalogos={catalogos}
        esquemaListo={Boolean(estadoBd.esquema_listo)}
        onRefresh={() => refrescarDatos()}
        initialConfig={catalogosInitialConfig}
      />

      {/* Modal de Estado de Base de Datos y Carpetas del Proyecto */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D261A]/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-emerald-100 rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <Database size={18} className="text-[#1B5E43]" />
                <h3 className="text-base font-bold text-[#14281D]">
                  Carpetas del Sistema y Estado de Conexión
                </h3>
              </div>
              <button
                onClick={() => setInfoModalOpen(false)}
                className="p-1.5 rounded-xl text-[#526B5C] hover:bg-emerald-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-[#F6FAF7] border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-[#14281D]">
                    Estado actual:{' '}
                    <span className="text-[#1B5E43]">
                      {estadoBd.esquema_listo
                        ? 'Conectado a MySQL (Esquema completo)'
                        : estadoBd.conectado
                        ? 'Conectado a MySQL (Faltan tablas del esquema)'
                        : 'Sin conexión a MySQL'}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => verificarEstadoServidor(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#1B5E43] text-white text-xs font-semibold hover:bg-[#144732]"
                  >
                    Reintentar conexión ahora
                  </button>
                </div>

                {estadoBd.detalle && (
                  <div className="p-3 rounded-lg bg-white border border-emerald-200 text-[#14281D] font-mono text-[11px] break-all">
                    Detalle técnico: {estadoBd.detalle}
                  </div>
                )}

                {!estadoBd.esquema_listo &&
                  (estadoBd.tablas_faltantes_esquema || []).length > 0 && (
                    <p className="text-[#526B5C]">
                      Tablas pendientes por encontrar:{' '}
                      {(estadoBd.tablas_faltantes_esquema || []).join(', ')}
                    </p>
                  )}
              </div>

              <div className="space-y-2">
                <p className="font-bold text-[#14281D] flex items-center gap-1.5">
                  <FolderOpen size={15} className="text-[#1B5E43]" />
                  Carpetas creadas y vinculadas:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    ['/datasheets', 'Manuales y fichas técnicas PDF'],
                    ['/imagenes', 'Fotografías de los equipos'],
                    ['/calibraciones', 'Certificados PDF de calibración'],
                    ['/mantenimientos', 'Reportes PDF de mantenimiento'],
                    ['/img', 'Escudo o logo de la universidad'],
                  ].map(([dir, desc]) => (
                    <div
                      key={dir}
                      className="p-3 rounded-xl border border-emerald-100 bg-white"
                    >
                      <p className="font-bold text-[#1B5E43]">{dir}</p>
                      <p className="text-[#526B5C] mt-0.5">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setInfoModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#1B5E43] text-white text-xs font-semibold"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

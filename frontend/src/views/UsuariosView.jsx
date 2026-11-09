import React, { useState } from 'react';
import {
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  Trash2,
  Check,
  X,
  KeyRound,
} from 'lucide-react';
import { api } from '../services/api';

export default function UsuariosView({
  usuarios,
  roles,
  esquemaListo,
  onRefresh,
}) {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormUsuario, setMostrarFormUsuario] = useState(false);
  const [mostrarFormRol, setMostrarFormRol] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formUsuario, setFormUsuario] = useState({
    nombre_completo: '',
    correo_electronico: '',
    contrasena: '',
    id_rol: roles?.[0]?.id_rol || 1,
    estado: 'Activo',
  });

  const [formRol, setFormRol] = useState({
    nombre_rol: '',
    descripcion: '',
  });

  const filtrados = (usuarios || []).filter((u) => {
    const q = `${u.nombre_completo} ${u.correo_electronico} ${u.nombre_rol || ''}`.toLowerCase();
    return q.includes(busqueda.toLowerCase());
  });

  const totalUsuarios = String((usuarios || []).length).padStart(2, '0');
  const conAccesoAdmin = String(
    (usuarios || []).filter(
      (u) =>
        (u.estado || 'Activo') === 'Activo' &&
        (u.nombre_rol || '').toLowerCase() !== 'estudiante'
    ).length
  ).padStart(2, '0');
  const totalRoles = String((roles || []).length).padStart(2, '0');

  const handleCrearRol = async (e) => {
    e.preventDefault();
    if (!formRol.nombre_rol.trim()) return;
    setGuardando(true);
    setErrorMsg('');
    try {
      const creado = await api.crearRol(
        {
          nombre_rol: formRol.nombre_rol.trim(),
          descripcion: formRol.descripcion.trim(),
        },
        esquemaListo
      );
      await onRefresh();
      setFormUsuario((prev) => ({ ...prev, id_rol: creado.id_rol }));
      setFormRol({ nombre_rol: '', descripcion: '' });
      setMostrarFormRol(false);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    if (
      !formUsuario.nombre_completo.trim() ||
      !formUsuario.correo_electronico.trim() ||
      !formUsuario.contrasena
    ) {
      return;
    }
    setGuardando(true);
    setErrorMsg('');
    try {
      await api.crearUsuario(
        {
          nombre_completo: formUsuario.nombre_completo.trim(),
          correo_electronico: formUsuario.correo_electronico.trim(),
          contrasena: formUsuario.contrasena,
          id_rol: Number(formUsuario.id_rol),
          estado: formUsuario.estado,
        },
        esquemaListo
      );
      await onRefresh();
      setFormUsuario({
        nombre_completo: '',
        correo_electronico: '',
        contrasena: '',
        id_rol: roles?.[0]?.id_rol || 1,
        estado: 'Activo',
      });
      setMostrarFormUsuario(false);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const toggleEstadoUsuario = async (u) => {
    const nuevoEstado = u.estado === 'Activo' ? 'Inactivo' : 'Activo';
    await api.actualizarUsuario(u.id_usuario, { estado: nuevoEstado }, esquemaListo);
    await onRefresh();
  };

  const handleEliminarUsuario = async (u) => {
    if (!window.confirm(`¿Eliminar el perfil de "${u.nombre_completo}"?`)) return;
    await api.eliminarUsuario(u.id_usuario, esquemaListo);
    await onRefresh();
  };

  return (
    <div className="space-y-7">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-[#5E7A6B] mb-1.5">
            ADMINISTRACIÓN &nbsp;/&nbsp; CONTROL DE ACCESO
          </p>
          <h1 className="text-3xl font-extrabold text-[#14281D] tracking-tight">
            Usuarios y Roles
          </h1>
          <p className="text-sm text-[#526B5C] mt-1">
            Crea perfiles administrativos, asigna roles de seguridad y restringe el acceso de estudiantes al panel.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setMostrarFormRol(!mostrarFormRol);
              setMostrarFormUsuario(false);
            }}
            className="px-4 py-2.5 rounded-xl bg-white border border-emerald-200 text-[#1B5E43] text-sm font-semibold hover:bg-emerald-50 transition-colors flex items-center gap-2"
          >
            <ShieldCheck size={16} />
            {mostrarFormRol ? 'Cerrar rol' : 'Crear rol'}
          </button>
          <button
            onClick={() => {
              setMostrarFormUsuario(!mostrarFormUsuario);
              setMostrarFormRol(false);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#1B5E43] text-white text-sm font-semibold hover:bg-[#144732] transition-colors flex items-center gap-2"
          >
            {mostrarFormUsuario ? <X size={17} /> : <Plus size={17} />}
            {mostrarFormUsuario ? 'Cerrar formulario' : 'Registrar perfil'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-white border border-[#14281D] text-[#14281D] text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Formulario Crear Rol */}
      {mostrarFormRol && (
        <form
          onSubmit={handleCrearRol}
          className="bg-white rounded-2xl border border-emerald-200 p-6 space-y-4 shadow-[0_4px_20px_rgba(20,40,29,0.05)]"
        >
          <div className="border-b border-emerald-100 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#14281D]">Crear Nuevo Rol de Sistema</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Nombre del Rol *
              </label>
              <input
                type="text"
                required
                value={formRol.nombre_rol}
                onChange={(e) => setFormRol({ ...formRol, nombre_rol: e.target.value })}
                placeholder="Ej: Administrador, Laboratorista, Estudiante"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Descripción de Permisos
              </label>
              <input
                type="text"
                value={formRol.descripcion}
                onChange={(e) => setFormRol({ ...formRol, descripcion: e.target.value })}
                placeholder="Alcance operativo dentro del laboratorio"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {(roles || []).map((r) => (
              <span
                key={r.id_rol}
                className="px-3 py-1 rounded-full bg-[#EEF6F1] text-[#1B5E43] text-xs font-semibold"
              >
                {r.nombre_rol}
              </span>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setMostrarFormRol(false)}
              className="px-4 py-2 rounded-xl bg-white border border-emerald-200 text-xs font-semibold text-[#14281D]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2 rounded-xl bg-[#1B5E43] text-white text-xs font-semibold hover:bg-[#144732] flex items-center gap-1.5"
            >
              <Check size={15} /> Guardar rol
            </button>
          </div>
        </form>
      )}

      {/* Formulario Crear Usuario / Perfil Administrativo */}
      {mostrarFormUsuario && (
        <form
          onSubmit={handleCrearUsuario}
          className="bg-white rounded-2xl border border-emerald-200 p-6 space-y-5 shadow-[0_4px_20px_rgba(20,40,29,0.05)]"
        >
          <div className="border-b border-emerald-100 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#14281D]">
              Registrar Nuevo Perfil de Usuario
            </h3>
            <span className="text-xs font-semibold text-[#145338] bg-[#E7F5ED] px-3 py-1 rounded-full">
              Contraseña encriptada
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={formUsuario.nombre_completo}
                onChange={(e) =>
                  setFormUsuario({ ...formUsuario, nombre_completo: e.target.value })
                }
                placeholder="Ej: Ing. Mateo Gómez"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Correo Electrónico / Usuario de Acceso *
              </label>
              <input
                type="text"
                required
                value={formUsuario.correo_electronico}
                onChange={(e) =>
                  setFormUsuario({ ...formUsuario, correo_electronico: e.target.value })
                }
                placeholder="usuario@universidad.edu.co"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Contraseña *
              </label>
              <input
                type="password"
                required
                value={formUsuario.contrasena}
                onChange={(e) =>
                  setFormUsuario({ ...formUsuario, contrasena: e.target.value })
                }
                placeholder="Contraseña de ingreso"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Rol Asignado *
              </label>
              <div className="flex gap-1.5">
                <select
                  value={formUsuario.id_rol}
                  onChange={(e) =>
                    setFormUsuario({ ...formUsuario, id_rol: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
                >
                  {(roles || []).map((r) => (
                    <option key={r.id_rol} value={r.id_rol}>
                      {r.nombre_rol}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  title="Crear nuevo Rol"
                  onClick={() => {
                    setMostrarFormRol(true);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-[#EEF6F1] border border-emerald-200 text-[#1B5E43] hover:bg-[#1B5E43] hover:text-white transition-colors shrink-0 flex items-center justify-center"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E4839] mb-1.5">
                Estado del Perfil
              </label>
              <select
                value={formUsuario.estado}
                onChange={(e) => setFormUsuario({ ...formUsuario, estado: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-[#1B5E43]"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setMostrarFormUsuario(false)}
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
              {guardando ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </div>
        </form>
      )}

      {/* 3 KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
          <p className="text-xs font-medium text-[#526B5C]">Total de usuarios</p>
          <p className="text-4xl font-extrabold text-[#14281D] my-2.5 tracking-tight">
            {totalUsuarios}
          </p>
          <p className="text-xs text-[#6B8576]">Registrados en el sistema</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
          <p className="text-xs font-medium text-[#526B5C]">Perfiles administrativos</p>
          <p className="text-4xl font-extrabold text-[#14281D] my-2.5 tracking-tight">
            {conAccesoAdmin}
          </p>
          <p className="text-xs text-[#6B8576]">Autorizados para ingresar al panel</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)]">
          <p className="text-xs font-medium text-[#526B5C]">Roles definidos</p>
          <p className="text-4xl font-extrabold text-[#14281D] my-2.5 tracking-tight">
            {totalRoles}
          </p>
          <p className="text-xs text-[#6B8576]">Niveles de seguridad configurados</p>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-2xl border border-emerald-100/90 shadow-[0_2px_12px_rgba(20,40,29,0.03)] overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#14281D]">Directorio de Perfiles</h2>
              <p className="text-xs text-[#6B8576] mt-0.5">
                Los usuarios con rol Estudiante tienen bloqueado el ingreso al panel administrativo
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#EFF5F1] text-[#234735] text-xs font-semibold">
              {filtrados.length} perfiles
            </span>
          </div>

          <div className="relative w-full md:max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B8576]"
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, correo o rol..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-emerald-100 rounded-xl focus:outline-none focus:border-[#1B5E43] placeholder:text-[#8BA395]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-emerald-100/80 bg-[#FAFDFB] text-[11px] font-bold uppercase tracking-wider text-[#6B8576]">
                <th className="py-3.5 px-6">Usuario</th>
                <th className="py-3.5 px-4">Correo / Login</th>
                <th className="py-3.5 px-4">Rol de Seguridad</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 text-sm">
              {filtrados.map((u) => {
                const esEstudiante = (u.nombre_rol || '').toLowerCase() === 'estudiante';
                const esActivo = (u.estado || 'Activo') === 'Activo';
                return (
                  <tr key={u.id_usuario} className="hover:bg-[#F7FBF8] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#EEF6F1] border border-emerald-100 flex items-center justify-center text-[#1B5E43] shrink-0">
                          <UserCheck size={17} />
                        </div>
                        <div>
                          <p className="font-bold text-[#14281D]">{u.nombre_completo}</p>
                          <p className="text-xs text-[#6B8576]">
                            {esEstudiante
                              ? 'Solo vista estudiante'
                              : 'Acceso a panel administrativo'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs font-semibold text-[#14281D]">
                      {u.correo_electronico}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          esEstudiante
                            ? 'bg-white border border-emerald-200 text-[#526B5C]'
                            : 'bg-[#E7F5ED] text-[#145338]'
                        }`}
                      >
                        <KeyRound size={12} />
                        {u.nombre_rol}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => toggleEstadoUsuario(u)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          esActivo
                            ? 'bg-[#E7F5ED] text-[#145338]'
                            : 'bg-white border border-[#14281D] text-[#14281D]'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {u.estado || 'Activo'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleEliminarUsuario(u)}
                        className="p-2 rounded-xl text-[#6B8576] hover:bg-emerald-50 hover:text-[#14281D]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

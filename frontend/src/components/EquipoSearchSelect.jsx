import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ChevronDown, Check, X, QrCode } from 'lucide-react';

/**
 * Selector de equipos con búsqueda integrada directamente en el mismo input superior:
 * Filtra en tiempo real al escribir en la barra principal por:
 * - Nombre del equipo (nombre_equipo)
 * - Serie de universidad (serie_universidad)
 * - Serie de laboratorio (serie_laboratorio)
 * - Serie de fábrica (serie_equipo)
 * Soporta selección única (multiple=false) o múltiple (multiple=true).
 */
export default function EquipoSearchSelect({
  equipos = [],
  multiple = false,
  value = '', // id único cuando multiple=false
  values = [], // array de ids cuando multiple=true
  onChange,
  placeholder = 'Escribe para buscar por nombre, serie universidad o serie laboratorio...',
  onOpenScanner = null,
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
        setBusqueda('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const equiposFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return equipos;
    return equipos.filter((eq) => {
      const texto = `${eq.nombre_equipo || ''} ${eq.serie_universidad || ''} ${
        eq.serie_laboratorio || ''
      } ${eq.serie_equipo || ''} ${eq.fabricante || ''} ${eq.modelo || ''}`.toLowerCase();
      return texto.includes(q);
    });
  }, [equipos, busqueda]);

  const equipoSeleccionadoUnico = useMemo(() => {
    if (multiple || !value) return null;
    return equipos.find((e) => String(e.id_equipo) === String(value)) || null;
  }, [equipos, multiple, value]);

  const equiposSeleccionadosMultiples = useMemo(() => {
    if (!multiple) return [];
    const setIds = new Set((values || []).map((v) => String(v)));
    return equipos.filter((e) => setIds.has(String(e.id_equipo)));
  }, [equipos, multiple, values]);

  const textoMostradoEnInput = useMemo(() => {
    if (abierto) return busqueda;
    if (!multiple && equipoSeleccionadoUnico) {
      return `${equipoSeleccionadoUnico.nombre_equipo} — Univ: ${
        equipoSeleccionadoUnico.serie_universidad || 'S/N'
      } | Lab: ${equipoSeleccionadoUnico.serie_laboratorio || 'S/N'}`;
    }
    return busqueda;
  }, [abierto, busqueda, multiple, equipoSeleccionadoUnico]);

  const handleToggleItem = (eq) => {
    if (!multiple) {
      onChange(String(eq.id_equipo), eq);
      setAbierto(false);
      setBusqueda('');
      return;
    }

    const strId = String(eq.id_equipo);
    const actuales = (values || []).map((v) => String(v));
    if (actuales.includes(strId)) {
      onChange(actuales.filter((id) => id !== strId));
    } else {
      onChange([...actuales, strId]);
    }
  };

  const quitarDeMultiples = (idQuitar) => {
    const actuales = (values || []).map((v) => String(v));
    onChange(actuales.filter((id) => id !== String(idQuitar)));
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      {/* Único input superior integrado donde se escribe y filtra directamente */}
      <div className="relative flex items-center">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B8576] pointer-events-none"
        />

        <input
          ref={inputRef}
          type="text"
          value={textoMostradoEnInput}
          onFocus={() => setAbierto(true)}
          onClick={() => setAbierto(true)}
          onChange={(e) => {
            setAbierto(true);
            setBusqueda(e.target.value);
          }}
          placeholder={
            multiple && equiposSeleccionadosMultiples.length > 0
              ? `${equiposSeleccionadosMultiples.length} equipo(s) seleccionado(s) — escribe para buscar más...`
              : placeholder
          }
          className={`w-full pl-9 ${
            onOpenScanner ? 'pr-16' : 'pr-9'
          } py-2.5 text-sm bg-white border border-emerald-200/90 rounded-xl focus:outline-none focus:border-[#1B5E43] text-[#14281D] placeholder:text-[#8BA395] ${
            !abierto && !multiple && equipoSeleccionadoUnico ? 'font-semibold' : ''
          }`}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {!multiple && equipoSeleccionadoUnico && !abierto && (
            <button
              type="button"
              title="Limpiar selección"
              onClick={(e) => {
                e.stopPropagation();
                onChange('', null);
                setBusqueda('');
              }}
              className="p-1 rounded-lg text-[#6B8576] hover:bg-emerald-50 hover:text-[#14281D]"
            >
              <X size={14} />
            </button>
          )}

          {onOpenScanner && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenScanner();
              }}
              title="Iniciar cámara para buscar por QR o Código de Barras"
              className="p-1.5 rounded-lg text-[#1B5E43] hover:bg-[#E7F5ED] transition-colors flex items-center justify-center"
            >
              <QrCode size={16} />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              const next = !abierto;
              setAbierto(next);
              if (next) inputRef.current?.focus();
            }}
            className="p-1 rounded-lg text-[#526B5C] hover:bg-emerald-50"
          >
            <ChevronDown size={15} />
          </button>
        </div>
      </div>

      {/* Etiquetas de equipos seleccionados cuando es múltiple (Préstamos) */}
      {multiple && equiposSeleccionadosMultiples.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {equiposSeleccionadosMultiples.map((eq) => (
            <span
              key={eq.id_equipo}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#E7F5ED] border border-emerald-200 text-[#145338] text-xs font-semibold"
            >
              <span>
                {eq.nombre_equipo}{' '}
                <span className="text-[11px] font-normal text-[#2E5A44]">
                  (Univ: {eq.serie_universidad || '—'} · Lab: {eq.serie_laboratorio || '—'})
                </span>
              </span>
              <button
                type="button"
                onClick={() => quitarDeMultiples(eq.id_equipo)}
                className="p-0.5 rounded-full hover:bg-emerald-200/70 text-[#145338]"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Lista desplegable directa debajo del input (sin doble buscador) */}
      {abierto && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-emerald-200 rounded-2xl shadow-xl z-40 overflow-hidden">
          <div className="max-h-60 overflow-y-auto divide-y divide-emerald-50">
            {equiposFiltrados.map((eq) => {
              const seleccionado = multiple
                ? (values || []).map(String).includes(String(eq.id_equipo))
                : String(value) === String(eq.id_equipo);

              return (
                <button
                  key={eq.id_equipo}
                  type="button"
                  onClick={() => handleToggleItem(eq)}
                  className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between gap-3 ${
                    seleccionado ? 'bg-[#E7F5ED]' : 'hover:bg-[#F6FAF7]'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[#14281D] truncate">
                      {eq.nombre_equipo}{' '}
                      {eq.en_prestamo && (
                        <span className="ml-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[#1B5E43] text-[#1B5E43]">
                          Prestado
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[#526B5C] truncate mt-0.5">
                      Serie Univ: <strong>{eq.serie_universidad || '—'}</strong> &nbsp;|&nbsp; Serie
                      Lab: <strong>{eq.serie_laboratorio || '—'}</strong> &nbsp;|&nbsp; Fábrica:{' '}
                      {eq.serie_equipo || '—'}
                    </p>
                  </div>

                  {seleccionado && (
                    <div className="w-5 h-5 rounded-full bg-[#1B5E43] text-white flex items-center justify-center shrink-0">
                      <Check size={12} />
                    </div>
                  )}
                </button>
              );
            })}

            {equiposFiltrados.length === 0 && (
              <div className="p-4 text-center text-xs text-[#6B8576]">
                No se encontraron equipos con ese nombre o número de serie.
              </div>
            )}
          </div>

          {multiple && (
            <div className="px-4 py-2 bg-[#F6F9F7] border-t border-emerald-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#526B5C]">
                {equiposSeleccionadosMultiples.length} seleccionado(s)
              </span>
              <button
                type="button"
                onClick={() => {
                  setAbierto(false);
                  setBusqueda('');
                }}
                className="px-3 py-1 rounded-lg bg-[#1B5E43] text-white text-xs font-semibold"
              >
                Listo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

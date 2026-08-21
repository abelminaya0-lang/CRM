import React, { useState } from 'react';
import { DJState, Nota, Recordatorio } from '../types';
import { NOTA_COLORS, uid } from '../utils/crmData';

interface NotasTabProps {
  state: DJState;
  onUpdateState: (updater: (prev: DJState) => DJState) => void;
  onOpenNuevoProyecto: () => void;
  onOpenEditProyecto: (id: string) => void;
  onShowToast: (msg: string) => void;
}

export const NotasTab: React.FC<NotasTabProps> = ({
  state,
  onUpdateState,
  onOpenNuevoProyecto,
  onOpenEditProyecto,
  onShowToast,
}) => {
  const [notaTexto, setNotaTexto] = useState('');
  const [notaColor, setNotaColor] = useState<'c1' | 'c2' | 'c3' | 'c4' | 'c5'>('c1');

  const [recTexto, setRecTexto] = useState('');
  const [recCuando, setRecCuando] = useState('');

  const handleAddNota = (e: React.FormEvent) => {
    e.preventDefault();
    const t = notaTexto.trim();
    if (!t) return;

    const newNota: Nota = {
      id: uid(),
      texto: t,
      color: notaColor,
      pin: false,
      creado: Date.now(),
    };

    onUpdateState((prev) => ({
      ...prev,
      notas: [newNota, ...(prev.notas || [])],
    }));

    setNotaTexto('');
    onShowToast('Nota guardada ✓');
  };

  const handleTogglePinNota = (id: string) => {
    onUpdateState((prev) => ({
      ...prev,
      notas: (prev.notas || []).map((n) =>
        n.id === id ? { ...n, pin: !n.pin } : n
      ),
    }));
  };

  const handleEditNota = (id: string) => {
    const n = (state.notas || []).find((x) => x.id === id);
    if (!n) return;
    const nuevo = window.prompt('Editar nota:', n.texto);
    if (nuevo !== null) {
      onUpdateState((prev) => ({
        ...prev,
        notas: (prev.notas || []).map((x) =>
          x.id === id ? { ...x, texto: nuevo.trim() || x.texto } : x
        ),
      }));
    }
  };

  const handleDeleteNota = (id: string) => {
    onUpdateState((prev) => ({
      ...prev,
      notas: (prev.notas || []).filter((n) => n.id !== id),
    }));
    onShowToast('Nota eliminada');
  };

  const handleAddRec = (e: React.FormEvent) => {
    e.preventDefault();
    const t = recTexto.trim();
    if (!t) return;

    const newRec: Recordatorio = {
      id: uid(),
      texto: t,
      cuando: recCuando || '',
      hecho: false,
      creado: Date.now(),
    };

    onUpdateState((prev) => ({
      ...prev,
      recordatorios: [...(prev.recordatorios || []), newRec],
    }));

    setRecTexto('');
    setRecCuando('');
    onShowToast('Recordatorio guardado ✓');
  };

  const handleToggleRec = (id: string) => {
    onUpdateState((prev) => ({
      ...prev,
      recordatorios: (prev.recordatorios || []).map((r) =>
        r.id === id ? { ...r, hecho: !r.hecho } : r
      ),
    }));
  };

  const handleDeleteRec = (id: string) => {
    onUpdateState((prev) => ({
      ...prev,
      recordatorios: (prev.recordatorios || []).filter((r) => r.id !== id),
    }));
    onShowToast('Recordatorio eliminado');
  };

  // Sort notes: pinned first, then by date
  const sortedNotas = [...(state.notas || [])].sort((a, b) => {
    if (a.pin !== b.pin) return a.pin ? -1 : 1;
    return (b.creado || 0) - (a.creado || 0);
  });

  // Sort reminders: active first (sorted by date), done last
  const sortedRecs = [...(state.recordatorios || [])].sort((a, b) => {
    if (a.hecho !== b.hecho) return a.hecho ? 1 : -1;
    return (a.cuando || '9999').localeCompare(b.cuando || '9999');
  });

  const now = new Date();
  const formatWhen = (iso: string) => {
    if (!iso) return { text: 'Sin fecha', cls: 'fut' };
    const d = new Date(iso);
    const diffHours = (d.getTime() - now.getTime()) / 3600000;
    const isToday = d.toDateString() === now.toDateString();

    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
    const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;

    if (diffHours < 0) {
      const daysAgo = Math.abs(Math.floor(diffHours / 24));
      return {
        text: `Vencido ${daysAgo === 0 ? 'hoy' : `hace ${daysAgo}d`}`,
        cls: 'venc',
      };
    }
    if (isToday) {
      return { text: `Hoy a las ${timeStr}`, cls: 'hoy' };
    }
    return { text: `${dateStr} · ${timeStr}`, cls: 'fut' };
  };

  const PROY_ESTADOS_LABEL: Record<string, string> = {
    idea: 'Idea',
    probando: 'Probando',
    activo: 'Activo',
    pausado: 'Pausado',
    descartado: 'Descartado',
  };

  return (
    <section className="screen active" id="tab-notas">
      <div className="grid-2" style={{ marginBottom: '14px' }}>
        {/* Notas rápidas */}
        <div className="card">
          <span className="eyebrow" style={{ marginBottom: '14px' }}>
            Notas rápidas
          </span>
          <form onSubmit={handleAddNota} style={{ marginBottom: '16px' }}>
            <div className="field" style={{ marginBottom: '8px' }}>
              <textarea
                id="notaTexto"
                placeholder="Escribí una idea, contacto, requerimiento técnico..."
                value={notaTexto}
                onChange={(e) => setNotaTexto(e.target.value)}
                style={{ minHeight: '80px' }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                {NOTA_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`pd ${notaColor === c ? 'ring-2 ring-white' : ''}`}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background:
                        c === 'c1'
                          ? 'var(--accent)'
                          : c === 'c2'
                          ? 'var(--mid)'
                          : c === 'c3'
                          ? 'var(--high)'
                          : c === 'c4'
                          ? 'var(--accent-2)'
                          : '#4db8ff',
                      cursor: 'pointer',
                      border: 'none',
                    }}
                    onClick={() => setNotaColor(c)}
                  />
                ))}
              </div>
              <button className="btn sm" type="submit">
                Guardar nota
              </button>
            </div>
          </form>

          <div className="notas-grid" id="gridNotas">
            {sortedNotas.length === 0 ? (
              <div
                className="empty"
                style={{ gridColumn: '1 / -1', padding: '20px' }}
              >
                <p>No tenés notas guardadas.</p>
              </div>
            ) : (
              sortedNotas.map((n) => (
                <div
                  key={n.id}
                  className={`nota ${n.color || 'c1'} ${n.pin ? 'pin' : ''}`}
                >
                  <div className="n-text">{n.texto}</div>
                  <div className="n-foot">
                    <span className="n-date">
                      {new Date(n.creado).toLocaleDateString('es-AR')}
                    </span>
                    <div className="n-actions">
                      <button
                        className={`pinb ${n.pin ? 'on' : ''}`}
                        title="Fijar nota"
                        onClick={() => handleTogglePinNota(n.id)}
                      >
                        📌
                      </button>
                      <button
                        title="Editar nota"
                        onClick={() => handleEditNota(n.id)}
                      >
                        ✎
                      </button>
                      <button
                        title="Borrar nota"
                        onClick={() => handleDeleteNota(n.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recordatorios con fecha */}
        <div className="card">
          <span className="eyebrow" style={{ marginBottom: '14px' }}>
            Recordatorios con fecha
          </span>
          <form onSubmit={handleAddRec} style={{ marginBottom: '16px' }}>
            <div className="field" style={{ marginBottom: '8px' }}>
              <input
                id="recTexto"
                placeholder="Qué tenés que recordar..."
                value={recTexto}
                onChange={(e) => setRecTexto(e.target.value)}
              />
            </div>
            <div className="field-row">
              <input
                type="datetime-local"
                value={recCuando}
                onChange={(e) => setRecCuando(e.target.value)}
                style={{
                  background: 'var(--panel-2)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                  padding: '10px 12px',
                  borderRadius: '11px',
                  fontSize: '13px',
                }}
              />
              <button className="btn sm block" type="submit">
                Agregar
              </button>
            </div>
          </form>

          <ul className="rec-list" id="listaRec">
            {sortedRecs.length === 0 ? (
              <li className="rec-item" style={{ opacity: 0.6 }}>
                <span className="r-text">No tenés recordatorios pendientes.</span>
              </li>
            ) : (
              sortedRecs.map((r) => {
                const w = formatWhen(r.cuando);
                return (
                  <li
                    key={r.id}
                    className={`rec-item ${r.hecho ? 'done' : w.cls}`}
                  >
                    <span
                      className={`cb ${r.hecho ? 'on' : ''}`}
                      onClick={() => handleToggleRec(r.id)}
                    >
                      {r.hecho ? '✓' : ''}
                    </span>
                    <div className="r-body">
                      <div className="r-text">{r.texto}</div>
                      {r.cuando && (
                        <span className={`r-when ${w.cls}`}>{w.text}</span>
                      )}
                    </div>
                    <button
                      className="del"
                      title="Borrar recordatorio"
                      onClick={() => handleDeleteRec(r.id)}
                    >
                      ✕
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>

      {/* Proyectos e Ideas de Negocio */}
      <div className="card">
        <div className="row-head">
          <span className="eyebrow" style={{ margin: 0 }}>
            Proyectos e ideas de negocio
          </span>
          <button
            className="btn ghost sm"
            id="btnNuevoProy"
            onClick={onOpenNuevoProyecto}
          >
            ＋ Nuevo proyecto
          </button>
        </div>

        <div className="proy-board" id="boardProy">
          {(state.proyectos || []).length === 0 ? (
            <div className="proy-empty">
              No tenés proyectos cargados. Sumá tu primera idea con el botón de
              arriba.
            </div>
          ) : (
            state.proyectos.map((p) => (
              <div
                key={p.id}
                className={`proy e-${p.estado || 'idea'}`}
                onClick={() => onOpenEditProyecto(p.id)}
              >
                <div className="p-top">
                  <span className="p-estado">
                    {PROY_ESTADOS_LABEL[p.estado] || p.estado}
                  </span>
                  <span className="p-prio" title={`Prioridad ${p.prio}`}>
                    {p.prio === 'alta' ? '🔴' : p.prio === 'media' ? '🟡' : '🟢'}
                  </span>
                </div>
                <div className="p-name">{p.nombre || 'Sin título'}</div>
                {p.desc && <div className="p-desc">{p.desc}</div>}
                {p.paso && (
                  <div className="p-paso">
                    <span>➔</span> {p.paso}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { ChecklistItem, DJState } from '../types';
import { GANADAS, MESES_LARGO, monthKey, uid } from '../utils/crmData';

interface ObjetivosTabProps {
  state: DJState;
  onUpdateState: (updater: (prev: DJState) => DJState) => void;
}

export const ObjetivosTab: React.FC<ObjetivosTabProps> = ({
  state,
  onUpdateState,
}) => {
  const [pasoInput, setPasoInput] = useState('');
  const [objInput, setObjInput] = useState('');

  const now = new Date();
  const mk = now.toISOString().slice(0, 7);

  const c = state.contenido;
  const metaC = +state.perfil.metaContenido || 0;
  const pctC = metaC > 0 ? Math.min(100, Math.round((c.hechos / metaC) * 100)) : 0;
  const doneC = metaC > 0 && c.hechos >= metaC;

  const mesGan = state.fechas.filter(
    (f) => GANADAS.includes(f.estado) && monthKey(f.fecha) === mk
  ).length;
  const metaF = +state.perfil.metaFechas || 0;
  const pctF = metaF > 0 ? Math.min(100, Math.round((mesGan / metaF) * 100)) : 0;
  const doneF = metaF > 0 && mesGan >= metaF;

  const handleMinusContenido = () => {
    onUpdateState((prev) => ({
      ...prev,
      contenido: {
        ...prev.contenido,
        hechos: Math.max(0, prev.contenido.hechos - 1),
      },
    }));
  };

  const handlePlusContenido = () => {
    onUpdateState((prev) => ({
      ...prev,
      contenido: {
        ...prev.contenido,
        hechos: prev.contenido.hechos + 1,
      },
    }));
  };

  const handleAddPaso = () => {
    const t = pasoInput.trim();
    if (!t) return;
    const newItem: ChecklistItem = { id: uid(), texto: t, hecho: false };
    onUpdateState((prev) => ({
      ...prev,
      pasos: [...prev.pasos, newItem],
    }));
    setPasoInput('');
  };

  const handleAddObj = () => {
    const t = objInput.trim();
    if (!t) return;
    const newItem: ChecklistItem = { id: uid(), texto: t, hecho: false };
    onUpdateState((prev) => ({
      ...prev,
      objetivos: [...prev.objetivos, newItem],
    }));
    setObjInput('');
  };

  const handleTogglePaso = (id: string) => {
    onUpdateState((prev) => ({
      ...prev,
      pasos: prev.pasos.map((p) => (p.id === id ? { ...p, hecho: !p.hecho } : p)),
    }));
  };

  const handleDeletePaso = (id: string) => {
    onUpdateState((prev) => ({
      ...prev,
      pasos: prev.pasos.filter((p) => p.id !== id),
    }));
  };

  const handleToggleObj = (id: string) => {
    onUpdateState((prev) => ({
      ...prev,
      objetivos: prev.objetivos.map((o) =>
        o.id === id ? { ...o, hecho: !o.hecho } : o
      ),
    }));
  };

  const handleDeleteObj = (id: string) => {
    onUpdateState((prev) => ({
      ...prev,
      objetivos: prev.objetivos.filter((o) => o.id !== id),
    }));
  };

  return (
    <section className="screen active" id="tab-objetivos">
      <div className="grid-2" style={{ marginBottom: '14px' }}>
        {/* Videos TikTok de la semana */}
        <div className="goal-card" id="goalContenido">
          <h3>Videos TikTok Producidos (Semana)</h3>
          <div className="g-sub">
            Videos grabados, editados o entregados esta semana en la agencia.
          </div>
          <div className="counter">
            <button id="cMinus" onClick={handleMinusContenido}>
              −
            </button>
            <div className="cnum">
              {c.hechos}
              <small>/{metaC || '—'}</small>
            </div>
            <button id="cPlus" onClick={handlePlusContenido}>
              +
            </button>
          </div>
          <div className={`prog ${doneC ? 'high' : ''}`}>
            <i style={{ width: `${pctC}%` }}></i>
          </div>
          <div className="prog-lab">
            <span>{doneC ? '¡Meta semanal superada! 🚀' : `Avance: ${pctC}%`}</span>
            <span>Meta: {metaC || '—'} videos/sem</span>
          </div>
        </div>

        {/* Clientes / Paquetes del mes */}
        <div className="goal-card" id="goalFechas">
          <h3>Paquetes / Clientes Activos (Mes)</h3>
          <div className="g-sub">
            Rodajes agendados, confirmados y cobrados en {MESES_LARGO[now.getMonth()]}.
          </div>
          <div className="counter">
            <div className="cnum" style={{ fontSize: '48px' }}>
              {mesGan}
              <small>/{metaF || '—'}</small>
            </div>
          </div>
          <div className={`prog ${doneF ? 'high' : ''}`}>
            <i style={{ width: `${pctF}%` }}></i>
          </div>
          <div className="prog-lab">
            <span>{doneF ? '¡Meta mensual lograda! 🎯' : `Avance: ${pctF}%`}</span>
            <span>Faltan {Math.max(0, metaF - mesGan)} para la meta</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Checklist de Producción */}
        <div className="card">
          <span className="eyebrow" style={{ marginBottom: '14px' }}>
            Checklist de Producción & Rodajes
          </span>
          <ul className="checklist" id="pasos">
            {state.pasos.length === 0 ? (
              <li className="check-item" style={{ opacity: 0.6 }}>
                <span className="ci-text">
                  No hay tareas pendientes. Agrega la primera abajo.
                </span>
              </li>
            ) : (
              state.pasos.map((it) => (
                <li
                  key={it.id}
                  className={`check-item ${it.hecho ? 'done' : ''}`}
                >
                  <span
                    className={`cb ${it.hecho ? 'on' : ''}`}
                    onClick={() => handleTogglePaso(it.id)}
                  >
                    {it.hecho ? '✓' : ''}
                  </span>
                  <span className="ci-text">{it.texto}</span>
                  <button
                    className="del"
                    onClick={() => handleDeletePaso(it.id)}
                  >
                    ✕
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="add-inline">
            <input
              id="pasoInput"
              placeholder="Ej: Preparar escaleta de tomas para nuevo restaurante..."
              maxLength={140}
              value={pasoInput}
              onChange={(e) => setPasoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddPaso();
              }}
            />
            <button className="btn sm" id="pasoAdd" onClick={handleAddPaso}>
              Agregar
            </button>
          </div>
        </div>

        {/* Objetivos Comerciales de la Agencia */}
        <div className="card">
          <span className="eyebrow" style={{ marginBottom: '14px' }}>
            Objetivos de Crecimiento & Marca
          </span>
          <ul className="checklist" id="objetivos">
            {state.objetivos.length === 0 ? (
              <li className="check-item" style={{ opacity: 0.6 }}>
                <span className="ci-text">
                  No hay objetivos registrados. Escribe abajo y suma tu meta.
                </span>
              </li>
            ) : (
              state.objetivos.map((it) => (
                <li
                  key={it.id}
                  className={`check-item ${it.hecho ? 'done' : ''}`}
                >
                  <span
                    className={`cb ${it.hecho ? 'on' : ''}`}
                    onClick={() => handleToggleObj(it.id)}
                  >
                    {it.hecho ? '✓' : ''}
                  </span>
                  <span className="ci-text">{it.texto}</span>
                  <button
                    className="del"
                    onClick={() => handleDeleteObj(it.id)}
                  >
                    ✕
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="add-inline">
            <input
              id="objInput"
              placeholder="Ej: Lograr 10 clientes con contrato fijo de 12 videos..."
              maxLength={140}
              value={objInput}
              onChange={(e) => setObjInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddObj();
              }}
            />
            <button className="btn sm" id="objAdd" onClick={handleAddObj}>
              Agregar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

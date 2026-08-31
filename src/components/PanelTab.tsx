import React from 'react';
import { DJState } from '../types';
import { ESTADOS, GANADAS, MESES, MESES_LARGO, money, monthKey, parseISO, todayISO } from '../utils/crmData';

interface PanelTabProps {
  state: DJState;
  onGotoTab: (tab: 'fechas' | 'objetivos') => void;
  onOpenNuevaFecha: () => void;
}

export const PanelTab: React.FC<PanelTabProps> = ({
  state,
  onGotoTab,
  onOpenNuevaFecha,
}) => {
  const now = new Date();
  const mk = now.toISOString().slice(0, 7);
  const currency = state.perfil.moneda || 'S/';

  // Calculations
  const factMes = state.pagos
    .filter((p) => monthKey(p.fecha) === mk)
    .reduce((a, p) => a + (+p.monto || 0), 0);

  const todayStr = todayISO();
  const futuras = state.fechas.filter(
    (f) => f.fecha && f.fecha >= todayStr && f.estado !== 'caida'
  );

  const pagosDe = (gigId: string) =>
    state.pagos
      .filter((p) => p.fechaId === gigId)
      .reduce((a, p) => a + (+p.monto || 0), 0);

  const porCobrar = state.fechas
    .filter((f) => f.estado !== 'caida')
    .reduce((a, f) => a + Math.max(0, (+f.ticket || 0) - pagosDe(f.id)), 0);

  const ganadas = state.fechas.filter((f) => GANADAS.includes(f.estado));
  const tickets = ganadas.map((f) => +f.ticket || 0).filter((v) => v > 0);
  const prom = tickets.length ? tickets.reduce((a, b) => a + b, 0) / tickets.length : 0;

  // Sorted upcoming dates
  const sortedFuturas = [...futuras]
    .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
    .slice(0, 5);

  // Objectives metrics
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

  return (
    <section className="screen active" id="tab-panel">
      {/* 4 KPIs */}
      <div className="kpis" id="kpis">
        <div className="kpi">
          <span className="k-label">Facturado este mes</span>
          <div className="k-val high">{money(factMes, currency)}</div>
          <div className="k-foot">{MESES_LARGO[now.getMonth()]} · Ingresos reales</div>
        </div>
        <div className="kpi">
          <span className="k-label">Próximos Rodajes</span>
          <div className="k-val accent">{futuras.length}</div>
          <div className="k-foot">
            {futuras.length ? 'grabaciones programadas' : 'agenda un nuevo cliente'}
          </div>
        </div>
        <div className="kpi">
          <span className="k-label">Por cobrar</span>
          <div className="k-val">{money(porCobrar, currency)}</div>
          <div className="k-foot">saldos tras entregas</div>
        </div>
        <div className="kpi">
          <span className="k-label">Ticket promedio</span>
          <div className="k-val">{money(prom, currency)}</div>
          <div className="k-foot">por paquete de videos</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Próximos Rodajes y Clientes */}
        <div className="card">
          <div className="row-head">
            <span className="eyebrow" style={{ margin: 0 }}>
              Próximos Rodajes & Grabaciones
            </span>
            <button
              className="btn ghost sm"
              onClick={() => onGotoTab('fechas')}
            >
              Ver Pipeline
            </button>
          </div>
          <div id="proximas">
            {sortedFuturas.length === 0 ? (
              <div className="empty" style={{ padding: '26px 12px' }}>
                <div className="e-emoji">🎬</div>
                <p>No tienes rodajes próximos agendados.</p>
                <button className="btn sm" onClick={onOpenNuevaFecha}>
                  ＋ Agendar Rodaje / Cliente
                </button>
              </div>
            ) : (
              <ul className="up-list">
                {sortedFuturas.map((f) => {
                  const d = parseISO(f.fecha);
                  const est = ESTADOS[f.estado] || ESTADOS.consulta;
                  return (
                    <li key={f.id} className="up-item">
                      <div className="u-date">
                        {d ? d.getDate() : '--'}
                        <small>{d ? MESES[d.getMonth()] : ''}</small>
                      </div>
                      <div className="u-body">
                        <b>{f.lugar || 'Cliente sin nombre'}</b>
                        <span>
                          {f.horario ? `${f.horario} · ` : ''}
                          <span
                            className="pill"
                            style={{
                              background: 'transparent',
                              padding: 0,
                              color: est.color,
                            }}
                          >
                            {est.label}
                          </span>
                        </span>
                      </div>
                      <div className="u-tick">
                        {f.ticket ? money(f.ticket, currency) : '—'}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Objetivos de la Agencia */}
        <div className="card">
          <span className="eyebrow" style={{ marginBottom: '14px' }}>
            Objetivos de Producción TikTok
          </span>
          <div id="panelObjetivos">
            <div style={{ marginBottom: '16px' }}>
              <div className="prog-lab" style={{ margin: '0 0 7px' }}>
                <span>Videos TikTok editados esta semana</span>
                <b style={{ color: 'var(--ink)' }}>
                  {c.hechos} / {metaC || '—'}
                </b>
              </div>
              <div className={`prog ${doneC ? 'high' : ''}`}>
                <i style={{ width: `${pctC}%` }}></i>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div className="prog-lab" style={{ margin: '0 0 7px' }}>
                <span>Paquetes / Clientes cerrados este mes</span>
                <b style={{ color: 'var(--ink)' }}>
                  {mesGan} / {metaF || '—'}
                </b>
              </div>
              <div className={`prog ${doneF ? 'high' : ''}`}>
                <i style={{ width: `${pctF}%` }}></i>
              </div>
            </div>

            <button
              className="btn ghost sm block"
              style={{ marginTop: '6px' }}
              onClick={() => onGotoTab('objetivos')}
            >
              Ver Objetivos & Checklist de Producción
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

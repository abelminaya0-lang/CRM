import React from 'react';
import { DJState } from '../types';
import { ESTADOS, GANADAS, MESES, money, monthKey, ORDEN, todayISO } from '../utils/crmData';

interface StatsTabProps {
  state: DJState;
}

export const StatsTab: React.FC<StatsTabProps> = ({ state }) => {
  const currency = state.perfil.moneda || 'S/';

  const totalFact = state.pagos.reduce((a, p) => a + (+p.monto || 0), 0);
  const ganadas = state.fechas.filter((f) => GANADAS.includes(f.estado));
  const perdidas = state.fechas.filter((f) => f.estado === 'caida');
  const cerrables = ganadas.length + perdidas.length;
  const cierrePct = cerrables ? Math.round((ganadas.length / cerrables) * 100) : 0;

  const tickets = ganadas.map((f) => +f.ticket || 0).filter((v) => v > 0);
  const prom = tickets.length ? tickets.reduce((a, b) => a + b, 0) / tickets.length : 0;

  const pagosDe = (gigId: string) =>
    state.pagos
      .filter((p) => p.fechaId === gigId)
      .reduce((a, p) => a + (+p.monto || 0), 0);

  const porCobrar = state.fechas
    .filter((f) => f.estado !== 'caida')
    .reduce((a, f) => a + Math.max(0, (+f.ticket || 0) - pagosDe(f.id)), 0);

  // 6 months buckets
  const now = new Date();
  const buckets: { key: string; lab: string; val: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: dt.toISOString().slice(0, 7),
      lab: MESES[dt.getMonth()],
      val: 0,
    });
  }

  state.pagos.forEach((p) => {
    const b = buckets.find((x) => x.key === monthKey(p.fecha));
    if (b) {
      b.val += +p.monto || 0;
    }
  });

  const maxVal = Math.max(1, ...buckets.map((b) => b.val));

  const consultasAbiertas = state.fechas.filter((f) => f.estado === 'consulta').length;
  const todayStr = todayISO();
  const futuras = state.fechas.filter(
    (f) => f.fecha && f.fecha >= todayStr && f.estado !== 'caida'
  ).length;

  return (
    <section className="screen active" id="tab-stats">
      {/* 4 KPIs */}
      <div className="kpis" id="statKpis">
        <div className="kpi">
          <span className="k-label">Facturado total</span>
          <div className="k-val high">{money(totalFact, currency)}</div>
          <div className="k-foot">todos los pagos cargados</div>
        </div>
        <div className="kpi">
          <span className="k-label">Fechas cerradas</span>
          <div className="k-val accent">{ganadas.length}</div>
          <div className="k-foot">reservadas + confirmadas + cobradas</div>
        </div>
        <div className="kpi">
          <span className="k-label">Ticket promedio</span>
          <div className="k-val">{money(prom, currency)}</div>
          <div className="k-foot">por fecha cerrada</div>
        </div>
        <div className="kpi">
          <span className="k-label">Por cobrar</span>
          <div className="k-val">{money(porCobrar, currency)}</div>
          <div className="k-foot">saldos pendientes</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '14px' }}>
        {/* Billing chart */}
        <div className="card">
          <span className="eyebrow" style={{ marginBottom: '8px' }}>
            Facturación por mes
          </span>
          <div className="bars-chart" id="chart">
            {buckets.map((b) => {
              const h = b.val > 0 ? Math.max(4, Math.round((b.val / maxVal) * 140)) : 3;
              return (
                <div key={b.key} className="bar-col">
                  <div className="bar" style={{ height: `${h}px` }}>
                    {b.val > 0 && (
                      <span className="bv">{money(b.val, currency)}</span>
                    )}
                  </div>
                  <span className="bar-lab">{b.lab}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Close rate ring */}
        <div className="card">
          <span className="eyebrow" style={{ marginBottom: '16px' }}>
            Tasa de cierre
          </span>
          <div className="close-ring">
            <div
              className="ring"
              style={
                {
                  '--p': cierrePct,
                  background: `conic-gradient(var(--high) ${cierrePct}%, var(--line) 0)`,
                } as React.CSSProperties
              }
            >
              <div className="ring-in">
                <b>{cierrePct}%</b>
                <span>cierre</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="stat-line">
                <span className="sl-lab">Fechas cerradas</span>
                <span className="sl-val">{ganadas.length}</span>
              </div>
              <div className="stat-line">
                <span className="sl-lab">Perdidas / no cerró</span>
                <span className="sl-val">{perdidas.length}</span>
              </div>
              <div className="stat-line">
                <span className="sl-lab">Consultas abiertas</span>
                <span className="sl-val">{consultasAbiertas}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business summary */}
      <div className="card">
        <span className="eyebrow" style={{ marginBottom: '8px' }}>
          Resumen del negocio
        </span>
        <div id="statResumen">
          <div className="stat-line">
            <span className="sl-lab">Total de fechas cargadas</span>
            <span className="sl-val">{state.fechas.length}</span>
          </div>
          <div className="stat-line">
            <span className="sl-lab">Próximas (de hoy en adelante)</span>
            <span className="sl-val">{futuras}</span>
          </div>
          {ORDEN.map((est) => {
            const count = state.fechas.filter((f) => f.estado === est).length;
            return (
              <div key={est} className="stat-line">
                <span className="sl-lab">{ESTADOS[est].label}</span>
                <span className="sl-val">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

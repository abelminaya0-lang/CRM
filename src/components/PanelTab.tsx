import React, { useState } from 'react';
import { Eye, EyeOff, ChevronLeft, ChevronRight, Calendar, DollarSign, ArrowUpRight, Clock, CheckCircle2 } from 'lucide-react';
import { DJState } from '../types';
import { ESTADOS, GANADAS, MESES, MESES_LARGO, money, monthKey, parseISO, todayISO } from '../utils/crmData';

interface PanelTabProps {
  state: DJState;
  hidePrices?: boolean;
  onToggleHidePrices?: () => void;
  onGotoTab: (tab: 'fechas' | 'objetivos' | 'pagos' | 'finanzas') => void;
  onOpenNuevaFecha: () => void;
}

export const PanelTab: React.FC<PanelTabProps> = ({
  state,
  hidePrices = false,
  onToggleHidePrices,
  onGotoTab,
  onOpenNuevaFecha,
}) => {
  const now = new Date();
  const currentMonthKey = now.toISOString().slice(0, 7);
  const currency = state.perfil.moneda || 'S/';

  // Month navigation offset from current month (0 = current month, -1 = past, +1 = future)
  const [monthOffset, setMonthOffset] = useState<number>(0);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(true);

  // Target selected month calculation
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const selMonthKey = targetDate.toISOString().slice(0, 7);
  const selMonthIdx = targetDate.getMonth();
  const selYear = targetDate.getFullYear();
  const selMonthName = MESES_LARGO[selMonthIdx];
  const isCurrentMonth = selMonthKey === currentMonthKey;
  const isPast = selMonthKey < currentMonthKey;
  const isFuture = selMonthKey > currentMonthKey;

  // Payments in selected month (for past and current months)
  const pagosMes = state.pagos.filter((p) => monthKey(p.fecha) === selMonthKey);
  const totalFacturadoReal = pagosMes.reduce((acc, p) => acc + (+p.monto || 0), 0);

  // Projection calculation for future months
  // 1. Configured recurring clients (e.g. Papá Plátano: S/ 400 monthly on the 15th)
  interface ProjectedItem {
    id: string;
    cliente: string;
    concepto: string;
    fechaEstimada: string;
    monto: number;
    tipo: 'recurrente' | 'rodaje_agendado';
  }

  const projectedItems: ProjectedItem[] = [];

  if (isFuture) {
    // Check for Papá Plátano or any monthly retainer clients
    const isPapaPlatanoActive = state.fechas.some(
      (f) => f.lugar?.toLowerCase().includes('plátano') || f.lugar?.toLowerCase().includes('platano')
    ) || (state.proyectos || []).some((p) => p.nombre?.toLowerCase().includes('plátano') || p.nombre?.toLowerCase().includes('platano'));

    if (isPapaPlatanoActive) {
      projectedItems.push({
        id: 'proj_papa_platano',
        cliente: 'Papá Plátano',
        concepto: `Mensualidad ${selMonthName} (6 Videos TikTok · Retainer)`,
        fechaEstimada: `${selYear}-${String(selMonthIdx + 1).padStart(2, '0')}-15`,
        monto: 400,
        tipo: 'recurrente',
      });
    }

    // Check for other scheduled gigs in this specific future month with positive ticket
    const futureGigsInMonth = state.fechas.filter(
      (f) =>
        monthKey(f.fecha) === selMonthKey &&
        +f.ticket > 0 &&
        f.estado !== 'caida' &&
        !f.lugar?.toLowerCase().includes('plátano') // Avoid double counting if already in retainer
    );

    futureGigsInMonth.forEach((g) => {
      projectedItems.push({
        id: 'proj_gig_' + g.id,
        cliente: g.lugar || 'Cliente Agendado',
        concepto: `Rodaje agendado (${g.horario || 'Horario pactado'})`,
        fechaEstimada: g.fecha,
        monto: +g.ticket || 0,
        tipo: 'rodaje_agendado',
      });
    });
  }

  const totalProyectado = projectedItems.reduce((acc, item) => acc + item.monto, 0);

  // Active displayed billing amount
  const displayFacturacion = isFuture ? totalProyectado : totalFacturadoReal;

  // General CRM calculations
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
    (f) => GANADAS.includes(f.estado) && monthKey(f.fecha) === selMonthKey
  ).length;
  const metaF = +state.perfil.metaFechas || 0;
  const pctF = metaF > 0 ? Math.min(100, Math.round((mesGan / metaF) * 100)) : 0;
  const doneF = metaF > 0 && mesGan >= metaF;

  // Quick month pills list
  const quickMonths = [-1, 0, 1, 2, 3].map((off) => {
    const d = new Date(now.getFullYear(), now.getMonth() + off, 1);
    return {
      offset: off,
      key: d.toISOString().slice(0, 7),
      label: `${MESES_LARGO[d.getMonth()]} ${d.getFullYear()}`,
      shortLabel: `${MESES[d.getMonth()].toUpperCase()} ${d.getFullYear()}`,
      isCurrent: off === 0,
    };
  });

  return (
    <section className="screen active" id="tab-panel">
      {/* Month Navigation & Privacy Control Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-[#12121c] border border-[#222234] rounded-xl p-3 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mr-1">
            <Calendar className="w-3.5 h-3.5 text-[#ef4444]" />
            <span>Período de Facturación:</span>
          </span>

          <div className="flex items-center gap-1 bg-[#181826] border border-[#2d2d42] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setMonthOffset((prev) => prev - 1)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#252538] rounded-md transition-colors"
              title="Mes Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 text-sm font-bold text-white min-w-[135px] text-center">
              {selMonthName} {selYear}
            </span>

            <button
              type="button"
              onClick={() => setMonthOffset((prev) => prev + 1)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#252538] rounded-md transition-colors"
              title="Mes Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Month Chips */}
          <div className="hidden md:flex items-center gap-1.5 ml-2">
            {quickMonths.map((qm) => {
              const active = qm.offset === monthOffset;
              return (
                <button
                  key={qm.key}
                  type="button"
                  onClick={() => setMonthOffset(qm.offset)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    active
                      ? 'bg-[#ef4444] text-white shadow-[0_2px_10px_rgba(239,68,68,0.35)] font-bold'
                      : 'bg-[#181824] text-zinc-400 hover:text-zinc-200 hover:bg-[#222234] border border-[#27273a]'
                  }`}
                >
                  {qm.label} {qm.isCurrent ? '• Actual' : ''}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => setMonthOffset(0)}
              className="px-2.5 py-1 text-xs bg-[#1a1a28] hover:bg-[#26263b] text-zinc-300 rounded-lg border border-[#32324a] transition-colors"
            >
              ↺ Ir al Mes Actual ({MESES_LARGO[now.getMonth()]})
            </button>
          )}

          {/* Privacy Eye Toggle Button inside Panel */}
          {onToggleHidePrices && (
            <button
              type="button"
              onClick={onToggleHidePrices}
              className={`px-3 py-1 text-xs rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                hidePrices
                  ? 'bg-amber-950/50 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
                  : 'bg-[#181826] border-[#2e2e42] text-zinc-300 hover:text-white hover:border-[#ef4444]'
              }`}
              title={hidePrices ? 'Precios Ocultos · Clic para mostrar' : 'Ocultar Precios / Modo Privacidad'}
            >
              {hidePrices ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono">Montos Ocultos</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Modo Privacidad</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 4 KPIs */}
      <div className="kpis" id="kpis">
        {/* KPI 1: Facturación Dinámica según Mes Seleccionado */}
        <div className="kpi relative group">
          <div className="flex items-center justify-between mb-1">
            <span className="k-label text-zinc-300 font-semibold">
              {isFuture ? 'Facturación Proyectada' : `Facturado en ${selMonthName}`}
            </span>
            {onToggleHidePrices && (
              <button
                type="button"
                onClick={onToggleHidePrices}
                className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors"
                title={hidePrices ? 'Mostrar montos' : 'Ocultar montos'}
              >
                {hidePrices ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          <div className="k-val high">
            {money(displayFacturacion, currency, hidePrices)}
          </div>

          <div className="k-foot flex items-center justify-between text-xs mt-1">
            <span>
              {isFuture ? (
                <span className="text-amber-400 font-medium flex items-center gap-1">
                  🔮 {selMonthName} {selYear} · Proyección de clientes
                </span>
              ) : isPast ? (
                <span className="text-zinc-400 flex items-center gap-1">
                  📜 {selMonthName} {selYear} · Cobros reales cerrados
                </span>
              ) : (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  ✨ {selMonthName} {selYear} · Ingresos reales cobrados
                </span>
              )}
            </span>
          </div>
        </div>

        {/* KPI 2: Próximos Rodajes */}
        <div className="kpi">
          <span className="k-label">Próximos Rodajes</span>
          <div className="k-val accent">{futuras.length}</div>
          <div className="k-foot">
            {futuras.length ? 'grabaciones programadas' : 'agenda un nuevo cliente'}
          </div>
        </div>

        {/* KPI 3: Por Cobrar */}
        <div className="kpi">
          <span className="k-label">Por cobrar</span>
          <div className="k-val">{money(porCobrar, currency, hidePrices)}</div>
          <div className="k-foot">saldos tras entregas</div>
        </div>

        {/* KPI 4: Ticket Promedio */}
        <div className="kpi">
          <span className="k-label">Ticket promedio</span>
          <div className="k-val">{money(prom, currency, hidePrices)}</div>
          <div className="k-foot">por paquete de videos</div>
        </div>
      </div>

      {/* Monthly Billing Breakdown Card */}
      <div className="card mb-6 border border-[#222234]">
        <div className="row-head">
          <div className="flex items-center gap-2">
            <span className="eyebrow" style={{ margin: 0 }}>
              {isFuture
                ? `Desglose de Facturación Proyectada · ${selMonthName} ${selYear}`
                : `Clientes & Cobros Registrados en ${selMonthName} ${selYear}`}
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-medium ${
                isFuture
                  ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
                  : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              }`}
            >
              {isFuture ? 'Proyección Estimada' : 'Cobros Confirmados'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => onGotoTab('pagos')}
            >
              Ver Historial de Pagos
            </button>
          </div>
        </div>

        {/* Breakdown Items List */}
        <div>
          {isFuture ? (
            /* Future Month Projection List */
            projectedItems.length === 0 ? (
              <div className="empty" style={{ padding: '20px 12px' }}>
                <p className="text-zinc-400 text-sm">
                  No hay clientes recurrentes ni rodajes configurados para {selMonthName} {selYear}.
                </p>
                <button className="btn sm" onClick={onOpenNuevaFecha}>
                  ＋ Agendar Rodaje en {selMonthName}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {projectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#141420] border border-[#26263a] hover:border-[#383850] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-950/40 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">
                        🔄
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{item.cliente}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                            Recurrente Mensual
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                          <span>{item.concepto}</span>
                          <span>•</span>
                          <span className="text-zinc-500">Cobro pactado cada 15 de cada mes</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold text-amber-300">
                        {money(item.monto, currency, hidePrices)}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        Vence: {item.fechaEstimada}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-3 border-t border-[#26263a] text-xs text-zinc-400">
                  <span>
                    💡 Nota: La facturación futura se proyecta con tus clientes mensuales activos (como Papá Plátano a S/ 400/mes) y nuevos rodajes agendados.
                  </span>
                  <span className="font-bold text-zinc-200">
                    Total Proyectado: {money(totalProyectado, currency, hidePrices)}
                  </span>
                </div>
              </div>
            )
          ) : (
            /* Past and Current Months Actual Payments List */
            pagosMes.length === 0 ? (
              <div className="empty" style={{ padding: '20px 12px' }}>
                <p className="text-zinc-400 text-sm">
                  No se registraron cobros en {selMonthName} {selYear}.
                </p>
                <button className="btn sm" onClick={() => onGotoTab('pagos')}>
                  ＋ Registrar Pago en este Mes
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {pagosMes.map((p) => {
                  const gig = state.fechas.find((f) => f.id === p.fechaId);
                  const clienteNombre = gig?.lugar || (p.concepto.includes('Terminal Marino') ? 'Terminal Marino' : p.concepto.includes('Papá Plátano') ? 'Papá Plátano' : 'Cliente Directo');
                  const d = parseISO(p.fecha);
                  const fechaFormateada = d ? `${d.getDate()} de ${MESES_LARGO[d.getMonth()]} de ${d.getFullYear()}` : p.fecha;

                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#141420] border border-[#26263a] hover:border-[#383850] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
                          ✓
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{clienteNombre}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                              Cobrado 100%
                            </span>
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                            <span>{p.concepto}</span>
                            <span>•</span>
                            <span className="text-zinc-500">Método: {p.metodo || 'Transferencia'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-extrabold text-emerald-400">
                          {money(+p.monto, currency, hidePrices)}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {fechaFormateada}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between pt-3 border-t border-[#26263a] text-xs text-zinc-400">
                  <span>
                    Total cobrado en {selMonthName} {selYear} ({pagosMes.length} pagos registrados):
                  </span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {money(totalFacturadoReal, currency, hidePrices)}
                  </span>
                </div>
              </div>
            )
          )}
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
                        {f.ticket ? money(f.ticket, currency, hidePrices) : '—'}
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
                <span>Paquetes / Clientes cerrados en {selMonthName}</span>
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

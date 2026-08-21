import React, { useState } from 'react';
import { DJState, MovimientoFinanzas } from '../types';
import {
  CATS_GASTO_FIJO,
  CATS_GASTO_VAR,
  CATS_INGRESO,
  MESES,
  MESES_LARGO,
  money,
  monthKey,
  parseISO,
  todayISO,
  uid,
} from '../utils/crmData';

interface FinanzasTabProps {
  state: DJState;
  onUpdateState: (updater: (prev: DJState) => DJState) => void;
  onShowToast: (msg: string) => void;
}

export const FinanzasTab: React.FC<FinanzasTabProps> = ({
  state,
  onUpdateState,
  onShowToast,
}) => {
  const currency = state.perfil.moneda || 'S/';
  const [finMonthOffset, setFinMonthOffset] = useState<number>(0);
  const [gastoFilter, setGastoFilter] = useState<'all' | 'fijo' | 'variable'>('all');

  // Movement Form state
  const [movTipo, setMovTipo] = useState<'gasto' | 'ingreso'>('gasto');
  const [movClase, setMovClase] = useState<'variable' | 'fijo'>('variable');
  const [movMonto, setMovMonto] = useState<string>('');
  const [movCat, setMovCat] = useState<string>('');
  const [movFecha, setMovFecha] = useState<string>(todayISO());
  const [movConcepto, setMovConcepto] = useState<string>('');

  // Selected Month Date
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + finMonthOffset);
  const selYear = targetDate.getFullYear();
  const selMonthIdx = targetDate.getMonth();
  const selMonthKey = targetDate.toISOString().slice(0, 7);

  // Totals calculations
  const saldoIni = +state.finanzas?.saldoInicial || 0;

  const allPagos = state.pagos || [];
  const allMovs = state.finanzas?.movimientos || [];

  // Annual calculations for selYear
  const yearStr = String(selYear);

  const facturadoAnual = allPagos
    .filter((p) => (p.fecha || '').startsWith(yearStr))
    .reduce((a, p) => a + (+p.monto || 0), 0);

  const otrosIngresosAnual = allMovs
    .filter((m) => m.tipo === 'ingreso' && (m.fecha || '').startsWith(yearStr))
    .reduce((a, m) => a + (+m.monto || 0), 0);

  const ingresosAnual = facturadoAnual + otrosIngresosAnual;

  const gastosAnual = allMovs
    .filter((m) => m.tipo === 'gasto' && (m.fecha || '').startsWith(yearStr))
    .reduce((a, m) => a + (+m.monto || 0), 0);

  const flujoNetoAnual = ingresosAnual - gastosAnual;

  // Cumulative all-time cash
  const totalFactAll = allPagos.reduce((a, p) => a + (+p.monto || 0), 0);
  const totalIngAll = allMovs
    .filter((m) => m.tipo === 'ingreso')
    .reduce((a, m) => a + (+m.monto || 0), 0);
  const totalGastosAll = allMovs
    .filter((m) => m.tipo === 'gasto')
    .reduce((a, m) => a + (+m.monto || 0), 0);
  const cajaTotal = saldoIni + totalFactAll + totalIngAll - totalGastosAll;

  // Selected Month Metrics
  const facturadoMes = allPagos
    .filter((p) => monthKey(p.fecha) === selMonthKey)
    .reduce((a, p) => a + (+p.monto || 0), 0);

  const otrosIngMes = allMovs
    .filter((m) => m.tipo === 'ingreso' && monthKey(m.fecha) === selMonthKey)
    .reduce((a, m) => a + (+m.monto || 0), 0);

  const ingresosMes = facturadoMes + otrosIngMes;

  const gastosMesMovs = allMovs.filter(
    (m) => m.tipo === 'gasto' && monthKey(m.fecha) === selMonthKey
  );
  const gastosMes = gastosMesMovs.reduce((a, m) => a + (+m.monto || 0), 0);
  const flujoNetoMes = ingresosMes - gastosMes;

  // Expense breakdown in selected month
  const filteredGastos = gastosMesMovs.filter((m) => {
    if (gastoFilter === 'all') return true;
    return (m.clase || 'variable') === gastoFilter;
  });

  const gastosByCat: Record<string, number> = {};
  filteredGastos.forEach((m) => {
    const cat = m.categoria || 'Sin categoría';
    gastosByCat[cat] = (gastosByCat[cat] || 0) + (+m.monto || 0);
  });
  const maxGastoCat = Math.max(1, ...Object.values(gastosByCat));

  // Income breakdown in selected month
  const ingresosByCat: Record<string, number> = {};
  if (facturadoMes > 0) {
    ingresosByCat['Fechas DJ (CRM)'] = facturadoMes;
  }
  allMovs
    .filter((m) => m.tipo === 'ingreso' && monthKey(m.fecha) === selMonthKey)
    .forEach((m) => {
      const cat = m.categoria || 'Otro ingreso';
      ingresosByCat[cat] = (ingresosByCat[cat] || 0) + (+m.monto || 0);
    });
  const maxIngresoCat = Math.max(1, ...Object.values(ingresosByCat));

  // Month-by-month table data for selYear
  let acum = saldoIni;
  const mesesTabla = MESES.map((mesLabel, idx) => {
    const mk = `${selYear}-${String(idx + 1).padStart(2, '0')}`;
    const fDJ = allPagos
      .filter((p) => monthKey(p.fecha) === mk)
      .reduce((a, p) => a + (+p.monto || 0), 0);
    const oIng = allMovs
      .filter((m) => m.tipo === 'ingreso' && monthKey(m.fecha) === mk)
      .reduce((a, m) => a + (+m.monto || 0), 0);
    const gFijo = allMovs
      .filter(
        (m) => m.tipo === 'gasto' && m.clase === 'fijo' && monthKey(m.fecha) === mk
      )
      .reduce((a, m) => a + (+m.monto || 0), 0);
    const gVar = allMovs
      .filter(
        (m) =>
          m.tipo === 'gasto' &&
          m.clase !== 'fijo' &&
          monthKey(m.fecha) === mk
      )
      .reduce((a, m) => a + (+m.monto || 0), 0);
    const totG = gFijo + gVar;
    const neto = fDJ + oIng - totG;
    acum += neto;

    return {
      mesLabel,
      mk,
      fDJ,
      oIng,
      gFijo,
      gVar,
      totG,
      neto,
      acum,
      isCurrent: mk === todayISO().slice(0, 7),
    };
  });

  // Selected Month Movement list
  const movsMes = allMovs
    .filter((m) => monthKey(m.fecha) === selMonthKey)
    .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  const handleAddMov = (e: React.FormEvent) => {
    e.preventDefault();
    const m = +movMonto;
    if (!m || m <= 0) {
      onShowToast('Ingresá un monto válido');
      return;
    }

    const newMov: MovimientoFinanzas = {
      id: uid(),
      creado: Date.now(),
      tipo: movTipo,
      clase: movTipo === 'gasto' ? movClase : '',
      categoria: movCat.trim() || (movTipo === 'gasto' ? 'Varios' : 'Otro'),
      monto: m,
      fecha: movFecha || todayISO(),
      concepto: movConcepto.trim(),
    };

    onUpdateState((prev) => ({
      ...prev,
      finanzas: {
        ...prev.finanzas,
        movimientos: [newMov, ...(prev.finanzas?.movimientos || [])],
      },
    }));

    setMovMonto('');
    setMovCat('');
    setMovConcepto('');
    onShowToast(`${movTipo === 'gasto' ? 'Gasto' : 'Ingreso'} de ${money(m, currency)} guardado ✓`);
  };

  const handleDeleteMov = (id: string) => {
    if (window.confirm('¿Borrar este movimiento?')) {
      onUpdateState((prev) => ({
        ...prev,
        finanzas: {
          ...prev.finanzas,
          movimientos: (prev.finanzas?.movimientos || []).filter((m) => m.id !== id),
        },
      }));
      onShowToast('Movimiento eliminado');
    }
  };

  const handleEditSaldoInicial = () => {
    const val = window.prompt(
      'Ingresá tu saldo inicial de caja (en efectivo/bancos):',
      String(saldoIni)
    );
    if (val !== null) {
      const num = +val || 0;
      onUpdateState((prev) => ({
        ...prev,
        finanzas: {
          ...prev.finanzas,
          saldoInicial: num,
        },
      }));
      onShowToast(`Saldo inicial actualizado: ${money(num, currency)}`);
    }
  };

  return (
    <section className="screen active" id="tab-finanzas">
      {/* 4 KPIs Generales */}
      <div className="kpis" id="finKpis">
        <div className="kpi">
          <span className="k-label">Caja total</span>
          <div className="k-val accent">{money(cajaTotal, currency)}</div>
          <div className="k-foot">saldo acumulado</div>
        </div>
        <div className="kpi">
          <span className="k-label">Ingresos {selYear}</span>
          <div className="k-val high">{money(ingresosAnual, currency)}</div>
          <div className="k-foot">facturado + extras</div>
        </div>
        <div className="kpi">
          <span className="k-label">Gastos {selYear}</span>
          <div className="k-val" style={{ color: 'var(--low)' }}>
            {money(gastosAnual, currency)}
          </div>
          <div className="k-foot">fijos + variables</div>
        </div>
        <div className="kpi">
          <span className="k-label">Flujo neto {selYear}</span>
          <div
            className="k-val"
            style={{ color: flujoNetoAnual >= 0 ? 'var(--high)' : 'var(--low)' }}
          >
            {money(flujoNetoAnual, currency)}
          </div>
          <div className="k-foot">balance anual</div>
        </div>
      </div>

      {/* Month Navigator card */}
      <div className="card" style={{ marginBottom: '14px' }}>
        <div className="fin-nav">
          <button
            className="iconbtn"
            id="finPrev"
            onClick={() => setFinMonthOffset((o) => o - 1)}
          >
            ←
          </button>
          <div className="fin-month" id="finMonthLabel">
            {MESES_LARGO[selMonthIdx]} {selYear}
          </div>
          <button
            className="iconbtn"
            id="finNext"
            onClick={() => setFinMonthOffset((o) => o + 1)}
          >
            →
          </button>
        </div>

        <div className="fin-month-kpis" id="finMonthKpis">
          <div className="fin-mk">
            <span className="l">Ingresos</span>
            <div className="v in">{money(ingresosMes, currency)}</div>
          </div>
          <div className="fin-mk">
            <span className="l">Gastos</span>
            <div className="v out">{money(gastosMes, currency)}</div>
          </div>
          <div className="fin-mk">
            <span className="l">Flujo neto</span>
            <div
              className={`v ${flujoNetoMes >= 0 ? 'net' : 'out'}`}
            >
              {money(flujoNetoMes, currency)}
            </div>
          </div>
          <div className="fin-mk">
            <span className="l">Facturado DJ</span>
            <div className="v in">{money(facturadoMes, currency)}</div>
          </div>
        </div>
      </div>

      {/* Gastos vs Ingresos Breakdown */}
      <div className="grid-2" style={{ marginBottom: '14px' }}>
        {/* Gastos breakdown */}
        <div className="card">
          <div className="row-head" style={{ marginBottom: '10px' }}>
            <span className="eyebrow" style={{ margin: 0 }}>
              Gastos del mes
            </span>
            <div className="seg">
              <button
                type="button"
                className={`seg-b ${gastoFilter === 'all' ? 'active' : ''}`}
                onClick={() => setGastoFilter('all')}
              >
                Todos
              </button>
              <button
                type="button"
                className={`seg-b ${gastoFilter === 'fijo' ? 'active' : ''}`}
                onClick={() => setGastoFilter('fijo')}
              >
                Fijos
              </button>
              <button
                type="button"
                className={`seg-b ${gastoFilter === 'variable' ? 'active' : ''}`}
                onClick={() => setGastoFilter('variable')}
              >
                Var
              </button>
            </div>
          </div>

          <div id="breakGastos">
            {Object.keys(gastosByCat).length === 0 ? (
              <div className="break-empty">No hay gastos en este mes.</div>
            ) : (
              Object.entries(gastosByCat).map(([cat, val]) => {
                const pct = Math.max(4, Math.round((val / maxGastoCat) * 100));
                return (
                  <div key={cat} className="break-row">
                    <span className="br-lab" title={cat}>
                      {cat}
                    </span>
                    <div className="br-bar">
                      <i className="out" style={{ width: `${pct}%` }}></i>
                    </div>
                    <span className="br-val">{money(val, currency)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ingresos breakdown */}
        <div className="card">
          <span className="eyebrow" style={{ marginBottom: '10px' }}>
            Ingresos del mes
          </span>
          <div id="breakIngresos">
            {Object.keys(ingresosByCat).length === 0 ? (
              <div className="break-empty">No hay ingresos en este mes.</div>
            ) : (
              Object.entries(ingresosByCat).map(([cat, val]) => {
                const pct = Math.max(4, Math.round((val / maxIngresoCat) * 100));
                return (
                  <div key={cat} className="break-row">
                    <span className="br-lab" title={cat}>
                      {cat}
                    </span>
                    <div className="br-bar">
                      <i className="in" style={{ width: `${pct}%` }}></i>
                    </div>
                    <span className="br-val">{money(val, currency)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Tabla mes a mes */}
      <div className="card" style={{ marginBottom: '14px' }}>
        <span className="eyebrow" style={{ marginBottom: '10px' }}>
          Flujo mes a mes ({selYear})
        </span>
        <div className="fin-table-wrap">
          <table className="fin-table" id="finTable">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Facturado DJ</th>
                <th>Otros ing.</th>
                <th>Gastos fijos</th>
                <th>Gastos var.</th>
                <th>Total gastos</th>
                <th>Neto mes</th>
                <th>Caja acum.</th>
              </tr>
            </thead>
            <tbody>
              {mesesTabla.map((row) => (
                <tr key={row.mk} className={row.isCurrent ? 'cur' : ''}>
                  <td>{row.mesLabel}</td>
                  <td className="in">{row.fDJ ? money(row.fDJ, currency) : '—'}</td>
                  <td className="in">{row.oIng ? money(row.oIng, currency) : '—'}</td>
                  <td className="out">{row.gFijo ? money(row.gFijo, currency) : '—'}</td>
                  <td className="out">{row.gVar ? money(row.gVar, currency) : '—'}</td>
                  <td className="out">{row.totG ? money(row.totG, currency) : '—'}</td>
                  <td className={row.neto >= 0 ? 'in' : 'out'}>
                    {money(row.neto, currency)}
                  </td>
                  <td className="net">{money(row.acum, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cargar movimiento & Movimientos de este mes */}
      <div className="grid-2">
        {/* Cargar movimiento */}
        <div className="card">
          <span className="eyebrow" style={{ marginBottom: '14px' }}>
            Cargar movimiento
          </span>
          <form id="fMov" onSubmit={handleAddMov}>
            <div className="field">
              <label>Tipo</label>
              <div className="seg" id="segTipo">
                <button
                  type="button"
                  className={`seg-b ${movTipo === 'gasto' ? 'active' : ''}`}
                  onClick={() => setMovTipo('gasto')}
                >
                  Gasto
                </button>
                <button
                  type="button"
                  className={`seg-b ${movTipo === 'ingreso' ? 'active' : ''}`}
                  onClick={() => setMovTipo('ingreso')}
                >
                  Ingreso
                </button>
              </div>
            </div>

            {movTipo === 'gasto' && (
              <div className="field" id="fieldClase">
                <label>Clase de gasto</label>
                <div className="seg" id="segClase">
                  <button
                    type="button"
                    className={`seg-b ${movClase === 'variable' ? 'active' : ''}`}
                    onClick={() => setMovClase('variable')}
                  >
                    Variable (equipo, nafta...)
                  </button>
                  <button
                    type="button"
                    className={`seg-b ${movClase === 'fijo' ? 'active' : ''}`}
                    onClick={() => setMovClase('fijo')}
                  >
                    Fijo (alquiler, subs...)
                  </button>
                </div>
              </div>
            )}

            <div className="field-row">
              <div className="field">
                <label>Monto</label>
                <input
                  id="mMonto"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  required
                  value={movMonto}
                  onChange={(e) => setMovMonto(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Categoría</label>
                <input
                  id="mCat"
                  list="catsList"
                  placeholder="Elegí o escribí..."
                  value={movCat}
                  onChange={(e) => setMovCat(e.target.value)}
                />
                <datalist id="catsList">
                  {movTipo === 'ingreso'
                    ? CATS_INGRESO.map((c) => <option key={c} value={c} />)
                    : movClase === 'fijo'
                    ? CATS_GASTO_FIJO.map((c) => <option key={c} value={c} />)
                    : CATS_GASTO_VAR.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>

            <div className="field">
              <label>Fecha</label>
              <input
                id="mFecha"
                type="date"
                required
                value={movFecha}
                onChange={(e) => setMovFecha(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Concepto (opcional)</label>
              <input
                id="mConcepto"
                placeholder="Ej: Pioneer DDJ-FLX4, Nafta viaje a Rosario..."
                value={movConcepto}
                onChange={(e) => setMovConcepto(e.target.value)}
              />
            </div>

            <button className="btn block" type="submit">
              Guardar movimiento
            </button>
          </form>

          <div
            style={{
              marginTop: '16px',
              paddingTop: '14px',
              borderTop: '1px solid var(--line)',
            }}
          >
            <button
              className="btn ghost sm block"
              id="btnSaldoIni"
              onClick={handleEditSaldoInicial}
            >
              ⚙︎ Editar saldo inicial de caja ({money(saldoIni, currency)})
            </button>
          </div>
        </div>

        {/* Movimientos de este mes */}
        <div className="card">
          <span className="eyebrow" style={{ marginBottom: '14px' }}>
            Movimientos de {MESES_LARGO[selMonthIdx]}
          </span>
          <div id="listaMovs">
            {movsMes.length === 0 ? (
              <div className="empty" style={{ padding: '26px 12px' }}>
                <div className="e-emoji">📊</div>
                <p>No hay movimientos cargados en este mes.</p>
              </div>
            ) : (
              <ul className="mov-list">
                {movsMes.map((m) => {
                  const d = m.fecha ? parseISO(m.fecha) : null;
                  const dStr = d ? `${d.getDate()} ${MESES[d.getMonth()]}` : 's/f';
                  const isIn = m.tipo === 'ingreso';

                  return (
                    <li key={m.id} className="mov-item">
                      <div className={`m-ico ${isIn ? 'in' : 'out'}`}>
                        {isIn ? '↗' : '↘'}
                      </div>
                      <div className="m-body">
                        <b>{m.categoria || (isIn ? 'Ingreso' : 'Gasto')}</b>
                        <span>
                          {dStr}
                          {m.clase ? ` · ${m.clase}` : ''}
                          {m.concepto ? ` · ${m.concepto}` : ''}
                        </span>
                      </div>
                      <div className={`m-monto ${isIn ? 'in' : 'out'}`}>
                        {isIn ? '+' : '-'}
                        {money(m.monto, currency)}
                      </div>
                      <button
                        className="del"
                        title="Borrar movimiento"
                        onClick={() => handleDeleteMov(m.id)}
                      >
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

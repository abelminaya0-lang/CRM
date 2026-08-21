import React, { useState } from 'react';
import { DJState, Pago } from '../types';
import { MESES, money, monthKey, parseISO, todayISO, uid } from '../utils/crmData';

interface PagosTabProps {
  state: DJState;
  prefilledFechaId?: string | null;
  onUpdateState: (updater: (prev: DJState) => DJState) => void;
  onShowToast: (msg: string) => void;
}

export const PagosTab: React.FC<PagosTabProps> = ({
  state,
  prefilledFechaId,
  onUpdateState,
  onShowToast,
}) => {
  const currency = state.perfil.moneda || 'S/';
  const now = new Date();
  const mk = now.toISOString().slice(0, 7);

  const [monto, setMonto] = useState<string>('');
  const [concepto, setConcepto] = useState<string>('Seña');
  const [metodo, setMetodo] = useState<string>('Transferencia');
  const [fechaPago, setFechaPago] = useState<string>(todayISO());
  const [fechaId, setFechaId] = useState<string>(prefilledFechaId || '');

  // Keep in sync when prefilledFechaId changes
  React.useEffect(() => {
    if (prefilledFechaId) {
      setFechaId(prefilledFechaId);
    }
  }, [prefilledFechaId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = +monto;
    if (!m || m <= 0) {
      onShowToast('Ingresá un monto válido');
      return;
    }

    const newPago: Pago = {
      id: uid(),
      fechaId: fechaId || null,
      monto: m,
      fecha: fechaPago || todayISO(),
      concepto: concepto.trim() || 'Pago',
      metodo: metodo || 'Transferencia',
      creado: Date.now(),
    };

    onUpdateState((prev) => ({
      ...prev,
      pagos: [newPago, ...prev.pagos],
    }));

    setMonto('');
    setConcepto('Seña');
    setFechaPago(todayISO());
    setFechaId('');
    onShowToast(`Pago de ${money(m, currency)} registrado ✓`);
  };

  const handleDeletePago = (id: string) => {
    if (window.confirm('¿Borrar este pago?')) {
      onUpdateState((prev) => ({
        ...prev,
        pagos: prev.pagos.filter((p) => p.id !== id),
      }));
      onShowToast('Pago eliminado');
    }
  };

  const totalMes = state.pagos
    .filter((p) => monthKey(p.fecha) === mk)
    .reduce((a, p) => a + (+p.monto || 0), 0);

  const sortedPagos = [...state.pagos].sort((a, b) => {
    const da = a.fecha || '';
    const db = b.fecha || '';
    if (da !== db) return db.localeCompare(da);
    return (b.creado || 0) - (a.creado || 0);
  });

  return (
    <section className="screen active" id="tab-pagos">
      <div className="grid-2">
        {/* Registrar pago */}
        <div className="card">
          <span className="eyebrow" style={{ marginBottom: '14px' }}>
            Registrar pago
          </span>
          <form id="fPago" onSubmit={handleSubmit}>
            <div className="field">
              <label>Monto</label>
              <input
                id="pMonto"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                required
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Concepto</label>
                <input
                  id="pConcepto"
                  placeholder="Seña, saldo, total..."
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Método</label>
                <select
                  id="pMetodo"
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value)}
                >
                  <option>Transferencia</option>
                  <option>Yape / Plin</option>
                  <option>Transferencia BCP</option>
                  <option>Transferencia BBVA</option>
                  <option>Transferencia Interbank</option>
                  <option>Efectivo</option>
                  <option>Tarjeta</option>
                  <option>Otro</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Fecha del pago</label>
              <input
                id="pFecha"
                type="date"
                required
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Fecha asociada (opcional)</label>
              <select
                id="pFechaId"
                value={fechaId}
                onChange={(e) => setFechaId(e.target.value)}
              >
                <option value="">(Ninguna / pago suelto)</option>
                {state.fechas.map((f) => {
                  const d = f.fecha ? parseISO(f.fecha) : null;
                  const fStr = d ? `${d.getDate()} ${MESES[d.getMonth()]}` : 'sin fecha';
                  const tickStr = f.ticket ? ` · ticket ${money(f.ticket, currency)}` : '';
                  return (
                    <option key={f.id} value={f.id}>
                      {fStr} · {f.lugar || 'Sin nombre'} {tickStr}
                    </option>
                  );
                })}
              </select>
            </div>
            <button className="btn block" type="submit">
              Registrar pago
            </button>
          </form>
        </div>

        {/* Últimos pagos */}
        <div className="card">
          <div className="row-head">
            <span className="eyebrow" style={{ margin: 0 }}>
              Últimos pagos registrados
            </span>
            <span
              className="pill"
              id="pagosTotalMes"
              style={{ background: 'var(--panel-2)', color: 'var(--high)' }}
            >
              Este mes: {money(totalMes, currency)}
            </span>
          </div>
          <div id="listaPagos">
            {sortedPagos.length === 0 ? (
              <div className="empty" style={{ padding: '26px 12px' }}>
                <div className="e-emoji">💸</div>
                <p>Todavía no registraste ningún pago.</p>
              </div>
            ) : (
              <ul className="pay-list">
                {sortedPagos.map((p) => {
                  const d = p.fecha ? parseISO(p.fecha) : null;
                  const dStr = d ? `${d.getDate()} ${MESES[d.getMonth()]}` : 's/f';
                  const gig = p.fechaId ? state.fechas.find((x) => x.id === p.fechaId) : null;

                  return (
                    <li key={p.id} className="pay-item">
                      <div className="p-monto">{money(p.monto, currency)}</div>
                      <div className="p-info">
                        <b>{p.concepto || 'Pago'}</b>
                        <span>
                          {dStr} · {p.metodo || '—'}
                          {gig ? ` · ${gig.lugar || 'Fecha'}` : ''}
                        </span>
                      </div>
                      <button
                        className="del"
                        title="Borrar pago"
                        onClick={() => handleDeletePago(p.id)}
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

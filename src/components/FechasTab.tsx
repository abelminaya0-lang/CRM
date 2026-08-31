import React, { useState } from 'react';
import { DJState, EstadoFecha, FechaGig } from '../types';
import { ESTADOS, MESES, money, ORDEN, parseISO } from '../utils/crmData';

interface FechasTabProps {
  state: DJState;
  onOpenNuevaFecha: () => void;
  onOpenEditFecha: (id: string) => void;
  onMoverFecha: (id: string, nuevoEstado: EstadoFecha) => void;
  onPrefillPago: (gig: FechaGig) => void;
}

export const FechasTab: React.FC<FechasTabProps> = ({
  state,
  onOpenNuevaFecha,
  onOpenEditFecha,
  onMoverFecha,
  onPrefillPago,
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<EstadoFecha | null>(null);

  const currency = state.perfil.moneda || 'S/';

  const pagosDe = (gigId: string) =>
    state.pagos
      .filter((p) => p.fechaId === gigId)
      .reduce((a, p) => a + (+p.monto || 0), 0);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent, estado: EstadoFecha) => {
    e.preventDefault();
    if (dragOverCol !== estado) {
      setDragOverCol(estado);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, estado: EstadoFecha) => {
    if (dragOverCol === estado) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e: React.DragEvent, estado: EstadoFecha) => {
    e.preventDefault();
    setDragOverCol(null);
    const id = e.dataTransfer.getData('text/plain') || draggedId;
    if (id) {
      onMoverFecha(id, estado);
    }
  };

  return (
    <section className="screen active" id="tab-fechas">
      <div className="row-head">
        <div>
          <div className="sect-title">Pipeline de Rodajes & Clientes</div>
          <div className="sect-sub" style={{ margin: 0 }}>
            Control de producción: de prospecto a guion aprobado, grabación en locación y entrega final de videos.
          </div>
        </div>
        <button className="btn sm" id="btnNueva2" onClick={onOpenNuevaFecha}>
          ＋ Nuevo Cliente / Rodaje
        </button>
      </div>

      <div className="board" id="board">
        {ORDEN.map((est) => {
          const items = state.fechas
            .filter((f) => f.estado === est)
            .sort((a, b) => (a.fecha || '9999').localeCompare(b.fecha || '9999'));

          const estMeta = ESTADOS[est];
          const isOver = dragOverCol === est;

          return (
            <div
              key={est}
              className={`col ${isOver ? 'drag-over' : ''}`}
              data-estado={est}
              onDragOver={(e) => handleDragOver(e, est)}
              onDragLeave={(e) => handleDragLeave(e, est)}
              onDrop={(e) => handleDrop(e, est)}
            >
              <div className="col-head">
                <span className="ch-name">
                  <span
                    className="pd"
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: estMeta.dot,
                    }}
                  ></span>
                  {estMeta.label}
                </span>
                <span className="ch-count">{items.length}</span>
              </div>

              {items.length === 0 ? (
                <div className="empty-col">—</div>
              ) : (
                items.map((f) => {
                  const d = f.fecha ? parseISO(f.fecha) : null;
                  const fechaTxt = d ? `${d.getDate()} ${MESES[d.getMonth()]}` : 'Sin fecha';
                  const saldo = Math.max(0, (+f.ticket || 0) - pagosDe(f.id));
                  const isDragging = draggedId === f.id;

                  return (
                    <div
                      key={f.id}
                      className={`gig ${isDragging ? 'dragging' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, f.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onOpenEditFecha(f.id)}
                    >
                      <div className="g-top">
                        <span className="g-date">{fechaTxt}</span>
                        {f.ticket ? (
                          <span className="g-ticket">{money(f.ticket, currency)}</span>
                        ) : null}
                      </div>

                      <div className="g-place">{f.lugar || 'Cliente / Negocio'}</div>

                      <div className="g-meta">
                        {f.horario && <span>🕒 {f.horario}</span>}
                        {f.contacto && <span>📱 {f.contacto}</span>}
                      </div>

                      {f.ticket && saldo > 0 ? (
                        <span className="saldo-tag">Saldo pendiente: {money(saldo, currency)}</span>
                      ) : null}

                      <div className="g-foot">
                        <select
                          title="Cambiar estado"
                          value={f.estado}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            onMoverFecha(f.id, e.target.value as EstadoFecha);
                          }}
                        >
                          {ORDEN.map((o) => (
                            <option key={o} value={o}>
                              {ESTADOS[o].label}
                            </option>
                          ))}
                        </select>
                        <button
                          className="mini pay"
                          title="Registrar cobro / anticipo"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPrefillPago(f);
                          }}
                        >
                          ＄
                        </button>
                        <button
                          className="mini edit"
                          title="Editar detalles"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEditFecha(f.id);
                          }}
                        >
                          ✎
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

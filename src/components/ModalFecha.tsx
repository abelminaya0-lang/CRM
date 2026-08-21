import React, { useState, useEffect } from 'react';
import { DJState, EstadoFecha, FechaGig, Pago } from '../types';
import { ESTADOS, ORDEN, todayISO, uid } from '../utils/crmData';

interface ModalFechaProps {
  isOpen: boolean;
  onClose: () => void;
  fechaId?: string | null;
  initialDate?: string;
  state: DJState;
  onUpdateState: (updater: (prev: DJState) => DJState) => void;
  onShowToast: (msg: string) => void;
}

export const ModalFecha: React.FC<ModalFechaProps> = ({
  isOpen,
  onClose,
  fechaId,
  initialDate,
  state,
  onUpdateState,
  onShowToast,
}) => {
  const isEditing = Boolean(fechaId);
  const gig = isEditing ? state.fechas.find((f) => f.id === fechaId) : null;
  const currency = state.perfil.moneda || 'S/';

  const [lugar, setLugar] = useState('');
  const [fecha, setFecha] = useState(todayISO());
  const [horario, setHorario] = useState('');
  const [contacto, setContacto] = useState('');
  const [ticket, setTicket] = useState('');
  const [sena, setSena] = useState('');
  const [estado, setEstado] = useState<EstadoFecha>('consulta');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (gig) {
      setLugar(gig.lugar || '');
      setFecha(gig.fecha || todayISO());
      setHorario(gig.horario || '');
      setContacto(gig.contacto || '');
      setTicket(gig.ticket ? String(gig.ticket) : '');
      setSena(gig.sena ? String(gig.sena) : '');
      setEstado(gig.estado || 'consulta');
      setNotas(gig.notas || '');
    } else {
      setLugar('');
      setFecha(initialDate || todayISO());
      setHorario('');
      setContacto('');
      setTicket('');
      setSena('');
      setEstado('consulta');
      setNotas('');
    }
  }, [isOpen, gig, initialDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const l = lugar.trim();
    if (!l) {
      onShowToast('El nombre del lugar es obligatorio');
      return;
    }

    const t = +ticket || 0;
    const s = +sena || 0;

    if (isEditing && gig) {
      const updated: FechaGig = {
        ...gig,
        lugar: l,
        fecha: fecha || '',
        horario: horario.trim(),
        contacto: contacto.trim(),
        ticket: t,
        sena: s,
        estado,
        notas: notas.trim(),
      };

      onUpdateState((prev) => ({
        ...prev,
        fechas: prev.fechas.map((f) => (f.id === gig.id ? updated : f)),
      }));
      onShowToast('Fecha actualizada ✓');
    } else {
      const newId = uid();
      const newGig: FechaGig = {
        id: newId,
        creado: Date.now(),
        lugar: l,
        fecha: fecha || '',
        horario: horario.trim(),
        contacto: contacto.trim(),
        ticket: t,
        sena: s,
        estado,
        notas: notas.trim(),
      };

      // If user entered a down payment (seña > 0), automatically register it as a payment
      let extraPago: Pago | null = null;
      if (s > 0) {
        extraPago = {
          id: uid(),
          fechaId: newId,
          monto: s,
          fecha: fecha || todayISO(),
          concepto: 'Seña',
          metodo: 'Transferencia',
          creado: Date.now(),
        };
      }

      onUpdateState((prev) => ({
        ...prev,
        fechas: [newGig, ...prev.fechas],
        pagos: extraPago ? [extraPago, ...prev.pagos] : prev.pagos,
      }));
      onShowToast('Nueva fecha guardada ✓');
    }

    onClose();
  };

  const handleDelete = () => {
    if (!gig) return;
    if (window.confirm('¿Borrar esta fecha?')) {
      onUpdateState((prev) => ({
        ...prev,
        fechas: prev.fechas.filter((f) => f.id !== gig.id),
      }));
      onShowToast('Fecha eliminada');
      onClose();
    }
  };

  return (
    <div className="overlay" id="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 id="modalTitle">{isEditing ? 'Editar fecha' : 'Nueva fecha'}</h2>
          <button className="x" id="modalClose" onClick={onClose}>
            ✕
          </button>
        </div>

        <form id="fFecha" onSubmit={handleSubmit}>
          <div className="field">
            <label>Lugar / Evento</label>
            <input
              id="fLugar"
              placeholder="Ej: Club Mandarine, Cumple 15, Boliche Terrazas"
              required
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Fecha</label>
              <input
                id="fFechaD"
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Horario</label>
              <input
                id="fHorario"
                placeholder="Ej: 01:00 a 05:00"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Contacto / Cliente</label>
            <input
              id="fContacto"
              placeholder="Nombre, teléfono o usuario de IG"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Ticket / Tarifa acordada ({currency})</label>
              <input
                id="fTicket"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Adelanto / Seña ({currency})</label>
              <input
                id="fSena"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={sena}
                onChange={(e) => setSena(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Estado</label>
            <div className="estado-chips" id="chipsEstado">
              {ORDEN.map((est) => (
                <button
                  key={est}
                  type="button"
                  className={`ec ${estado === est ? 'on' : ''}`}
                  onClick={() => setEstado(est)}
                >
                  <span
                    className="pd"
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: ESTADOS[est].dot,
                    }}
                  ></span>
                  {ESTADOS[est].label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Notas / Requerimientos</label>
            <textarea
              id="fNotas"
              placeholder="Equipamiento, traslados, pedidos de música..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          <div className="modal-foot">
            {isEditing && (
              <button
                type="button"
                className="btn danger sm"
                id="fBorrar"
                onClick={handleDelete}
              >
                Borrar
              </button>
            )}
            <button
              type="button"
              className="btn ghost sm"
              onClick={onClose}
              style={{ marginLeft: 'auto' }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn sm">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

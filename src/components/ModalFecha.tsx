import React, { useState, useEffect } from 'react';
import { DJState, EstadoFecha, FechaGig, Pago } from '../types';
import { ESTADOS, ORDEN, todayISO, uid } from '../utils/crmData';
import {
  createOrUpdateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  getCachedGoogleToken,
  requestGoogleCalendarAuth,
} from '../utils/googleCalendar';

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
  const [syncGcal, setSyncGcal] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const l = lugar.trim();
    if (!l) {
      onShowToast('El nombre del cliente o negocio es obligatorio');
      return;
    }

    setIsSaving(true);
    const t = +ticket || 0;
    const s = +sena || 0;

    let targetGig: FechaGig;

    if (isEditing && gig) {
      targetGig = {
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
    } else {
      targetGig = {
        id: uid(),
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
    }

    // Try Google Calendar sync if selected and confirmed/reserved
    if (syncGcal && targetGig.fecha && targetGig.estado !== 'caida') {
      let token = getCachedGoogleToken();
      if (token) {
        try {
          const gcalRes = await createOrUpdateGoogleCalendarEvent(token, targetGig, currency);
          if (gcalRes.success && gcalRes.eventId) {
            targetGig.googleEventId = gcalRes.eventId;
            targetGig.googleCalendarSynced = true;
          }
        } catch (e) {
          console.warn('Silent gcal sync fail on save:', e);
        }
      }
    }

    if (isEditing && gig) {
      onUpdateState((prev) => ({
        ...prev,
        fechas: prev.fechas.map((f) => (f.id === gig.id ? targetGig : f)),
      }));
      onShowToast(
        targetGig.googleCalendarSynced
          ? 'Rodaje actualizado y sincronizado en Google Calendar ✓'
          : 'Cliente / Rodaje actualizado ✓'
      );
    } else {
      let extraPago: Pago | null = null;
      if (s > 0) {
        extraPago = {
          id: uid(),
          fechaId: targetGig.id,
          monto: s,
          fecha: fecha || todayISO(),
          concepto: 'Adelanto 50%',
          metodo: 'Transferencia BCP',
          creado: Date.now(),
        };
      }

      onUpdateState((prev) => ({
        ...prev,
        fechas: [targetGig, ...prev.fechas],
        pagos: extraPago ? [extraPago, ...prev.pagos] : prev.pagos,
      }));
      onShowToast(
        targetGig.googleCalendarSynced
          ? 'Rodaje agendado y sincronizado en Google Calendar ✓'
          : 'Nuevo rodaje / cliente agendado ✓'
      );
    }

    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!gig) return;
    if (window.confirm('¿Borrar este cliente / rodaje?')) {
      const token = getCachedGoogleToken();
      if (token && gig.googleEventId) {
        deleteGoogleCalendarEvent(token, gig.googleEventId).catch(() => {});
      }

      onUpdateState((prev) => ({
        ...prev,
        fechas: prev.fechas.filter((f) => f.id !== gig.id),
      }));
      onShowToast('Registro eliminado');
      onClose();
    }
  };

  const handleAuthorizeGoogleCalendar = async () => {
    const res = await requestGoogleCalendarAuth();
    if (res.success) {
      onShowToast('Google Calendar conectado ✓');
    } else {
      alert(res.error || 'No se pudo conectar');
    }
  };

  const hasGcalToken = Boolean(getCachedGoogleToken());

  return (
    <div className="overlay" id="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 id="modalTitle">{isEditing ? 'Editar Rodaje / Cliente' : 'Nuevo Rodaje / Cliente TikTok'}</h2>
          <button className="x" id="modalClose" onClick={onClose}>
            ✕
          </button>
        </div>

        <form id="fFecha" onSubmit={handleSubmit}>
          <div className="field">
            <label>Cliente / Negocio & Locación</label>
            <input
              id="fLugar"
              placeholder="Ej: Restaurante La Parrilla (Miraflores), Clínica Dental..."
              required
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Fecha de Grabación / Rodaje</label>
              <input
                id="fFechaD"
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Horario de Rodaje</label>
              <input
                id="fHorario"
                placeholder="Ej: 10:00 a 14:00 (4 horas)"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Contacto / WhatsApp del Negocio</label>
            <input
              id="fContacto"
              placeholder="Ej: Martín (Gerente) · 987 654 321"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Tarifa del Paquete ({currency})</label>
              <input
                id="fTicket"
                type="number"
                min="0"
                step="any"
                placeholder="Ej: 2400"
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Adelanto 50% ({currency})</label>
              <input
                id="fSena"
                type="number"
                min="0"
                step="any"
                placeholder="Ej: 1200"
                value={sena}
                onChange={(e) => setSena(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Estado en el Pipeline</label>
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
            <label>Guion, Paquete de Videos & Requerimientos</label>
            <textarea
              id="fNotas"
              placeholder="Ej: Pack 12 TikToks. Grabar tomas de cocina, hook con el chef, testimonios de comensales. Llevar micro corbatero y luces LED..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          <div
            style={{
              padding: '10px 12px',
              background: 'var(--panel-2)',
              borderRadius: '9px',
              border: '1px solid var(--line)',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <label style={{ margin: 0, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={syncGcal}
                onChange={(e) => setSyncGcal(e.target.checked)}
              />
              <span>📅 Sincronizar automáticamente en Google Calendar</span>
            </label>
            {!hasGcalToken && (
              <button
                type="button"
                className="btn ghost sm text-xs"
                onClick={handleAuthorizeGoogleCalendar}
              >
                Conectar Google
              </button>
            )}
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
            <button type="submit" className="btn sm bg-[#ef4444] text-white" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Rodaje'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

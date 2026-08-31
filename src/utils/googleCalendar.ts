import { FechaGig } from '../types';
import { money } from './crmData';

declare global {
  interface Window {
    google?: any;
  }
}

const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

export function getCachedGoogleToken(): string | null {
  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }
  const stored = sessionStorage.getItem('gcal_access_token');
  const storedExp = Number(sessionStorage.getItem('gcal_token_exp') || 0);
  if (stored && Date.now() < storedExp) {
    cachedAccessToken = stored;
    tokenExpiresAt = storedExp;
    return stored;
  }
  return null;
}

export function saveGoogleToken(token: string, expiresInSeconds: number = 3600) {
  cachedAccessToken = token;
  tokenExpiresAt = Date.now() + (expiresInSeconds - 60) * 1000;
  sessionStorage.setItem('gcal_access_token', token);
  sessionStorage.setItem('gcal_token_exp', String(tokenExpiresAt));
}

export function clearGoogleToken() {
  cachedAccessToken = null;
  tokenExpiresAt = 0;
  sessionStorage.removeItem('gcal_access_token');
  sessionStorage.removeItem('gcal_token_exp');
}

export async function requestGoogleCalendarAuth(
  clientId?: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      resolve({
        success: false,
        error: 'El servicio de autenticación de Google aún no está listo. Recarga la página.',
      });
      return;
    }

    const effectiveClientId =
      clientId?.trim() ||
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '';

    if (!effectiveClientId) {
      // If no custom Client ID is explicitly specified, attempt with the platform client or prompt
      // For Google Workspace OAuth apps in AI Studio, user accepted the scope
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: effectiveClientId || '27408740555-client.apps.googleusercontent.com',
        scope: SCOPES,
        callback: (resp: any) => {
          if (resp.error) {
            console.error('Google OAuth token error:', resp);
            resolve({
              success: false,
              error: resp.error_description || resp.error || 'Acceso denegado o cancelado en Google',
            });
            return;
          }
          if (resp.access_token) {
            const expiresIn = Number(resp.expires_in) || 3600;
            saveGoogleToken(resp.access_token, expiresIn);
            resolve({ success: true, token: resp.access_token });
          } else {
            resolve({ success: false, error: 'No se recibió token de acceso.' });
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      console.error('Error initiating Google OAuth client:', err);
      resolve({
        success: false,
        error: err.message || 'Error al abrir ventana de autorización de Google.',
      });
    }
  });
}

// Convert a shoot into a Google Calendar Event format
function buildEventPayload(gig: FechaGig, currency: string = 'S/') {
  const isAllDay = !gig.horario || !gig.horario.includes(':');
  let startObj: any = {};
  let endObj: any = {};

  if (!isAllDay && gig.fecha) {
    // Try to extract hours, e.g. "10:00 a 14:00" or "15:00"
    const times = gig.horario.match(/(\d{1,2}:\d{2})/g);
    if (times && times.length >= 1) {
      const startTime = times[0].padStart(5, '0');
      const endTime = times.length > 1 ? times[1].padStart(5, '0') : undefined;
      
      const startDateTime = `${gig.fecha}T${startTime}:00`;
      startObj = { dateTime: new Date(startDateTime).toISOString() };

      if (endTime) {
        const endDateTime = `${gig.fecha}T${endTime}:00`;
        endObj = { dateTime: new Date(endDateTime).toISOString() };
      } else {
        // Default to 3 hours shoot
        const d = new Date(startDateTime);
        d.setHours(d.getHours() + 3);
        endObj = { dateTime: d.toISOString() };
      }
    } else {
      startObj = { date: gig.fecha };
      endObj = { date: gig.fecha };
    }
  } else {
    startObj = { date: gig.fecha || new Date().toISOString().slice(0, 10) };
    endObj = { date: gig.fecha || new Date().toISOString().slice(0, 10) };
  }

  const saldo = Math.max(0, (+gig.ticket || 0) - (+gig.sena || 0));

  const description = [
    `🎬 RODAJE / CONTENIDO TIKTOK — IVA CREATIVA`,
    `----------------------------------------`,
    `🏢 Cliente / Locación: ${gig.lugar}`,
    `⏰ Horario de Grabación: ${gig.horario || 'Por coordinar'}`,
    `📱 Contacto / WhatsApp: ${gig.contacto || 'No especificado'}`,
    `💰 Tarifa Paquete: ${money(gig.ticket, currency)}`,
    `💳 Adelanto pagado: ${money(gig.sena, currency)} | Saldo pendiente: ${money(saldo, currency)}`,
    `📌 Estado: ${gig.estado.toUpperCase()}`,
    ``,
    `📝 GUIONES & REQUERIMIENTOS DE PRODUCCIÓN:`,
    `${gig.notas || 'Sin notas adicionales.'}`,
  ].join('\n');

  return {
    summary: `🎬 [IVA CREATIVA] Rodaje TikTok: ${gig.lugar}`,
    description,
    location: gig.lugar,
    start: startObj,
    end: endObj,
    colorId: gig.estado === 'confirmada' ? '11' : gig.estado === 'reservada' ? '5' : '8', // 11=Red, 5=Yellow, 8=Grey
  };
}

export async function createOrUpdateGoogleCalendarEvent(
  token: string,
  gig: FechaGig,
  currency: string = 'S/'
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  const payload = buildEventPayload(gig, currency);
  const isUpdate = Boolean(gig.googleEventId);
  const url = isUpdate
    ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${gig.googleEventId}`
    : `https://www.googleapis.com/calendar/v3/calendars/primary/events`;

  try {
    const res = await fetch(url, {
      method: isUpdate ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 404 && isUpdate) {
        // If the event was deleted on Google Calendar, re-create it as new
        const fallbackGig = { ...gig, googleEventId: undefined };
        return createOrUpdateGoogleCalendarEvent(token, fallbackGig, currency);
      }
      throw new Error(errData.error?.message || `HTTP ${res.status} al sincronizar con Google Calendar`);
    }

    const eventData = await res.json();
    return {
      success: true,
      eventId: eventData.id,
    };
  } catch (err: any) {
    console.error('Error syncing Google Calendar event:', err);
    return {
      success: false,
      error: err.message || 'Error de conexión con Google Calendar API',
    };
  }
}

export async function deleteGoogleCalendarEvent(
  token: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  if (!eventId) return { success: true };
  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok && res.status !== 404) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${res.status}`);
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting Google Calendar event:', err);
    return { success: false, error: err.message };
  }
}

export async function syncAllGigsToGoogleCalendar(
  token: string,
  gigs: FechaGig[],
  currency: string = 'S/'
): Promise<{ success: boolean; updatedGigs: FechaGig[]; syncedCount: number; error?: string }> {
  const activeGigs = gigs.filter((g) => g.estado !== 'caida' && Boolean(g.fecha));
  if (activeGigs.length === 0) {
    return {
      success: true,
      updatedGigs: gigs,
      syncedCount: 0,
    };
  }

  let syncedCount = 0;
  const updatedGigs = [...gigs];

  for (let i = 0; i < updatedGigs.length; i++) {
    const gig = updatedGigs[i];
    if (gig.estado === 'caida' || !gig.fecha) continue;

    const result = await createOrUpdateGoogleCalendarEvent(token, gig, currency);
    if (result.success && result.eventId) {
      updatedGigs[i] = {
        ...gig,
        googleEventId: result.eventId,
        googleCalendarSynced: true,
      };
      syncedCount++;
    }
  }

  return {
    success: true,
    updatedGigs,
    syncedCount,
  };
}

import { DJState, EstadoFecha } from '../types';

export const ESTADOS: Record<EstadoFecha, { label: string; color: string; dot: string }> = {
  consulta:   { label: "Consulta",   color: "var(--muted)",    dot: "#94a3b8" },
  reservada:  { label: "Reservada",  color: "var(--mid)",      dot: "#fbbf24" },
  confirmada: { label: "Confirmada", color: "var(--accent)",   dot: "#818cf8" },
  cobrada:    { label: "Cobrada",    color: "var(--high)",     dot: "#34d399" },
  caida:      { label: "No cerró",   color: "var(--low)",      dot: "#f87171" }
};

export const ORDEN: EstadoFecha[] = ["consulta", "reservada", "confirmada", "cobrada", "caida"];
export const GANADAS: EstadoFecha[] = ["reservada", "confirmada", "cobrada"];
export const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const MESES_LARGO = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
export const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const CATS_GASTO_FIJO = ['Alquiler / Cabina', 'Software / Rekordbox / Splice', 'Contador', 'Seguro / Mantenimiento', 'Sueldos / Asistente'];
export const CATS_GASTO_VAR = ['Equipos / Luces', 'Movilidad / Taxis', 'Publicidad / Ads', 'Producción / Edits', 'Insumos', 'Comisiones'];
export const CATS_INGRESO = ['Eventos / Fechas', 'Packs de Edits / Sonidos', 'Clases / Asesoría DJ', 'Sponsoreo / Marcas', 'Otros ingresos'];

export const NOTA_COLORS: ('c1' | 'c2' | 'c3' | 'c4' | 'c5')[] = ['c1', 'c2', 'c3', 'c4', 'c5'];

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function parseISO(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function monthKey(s: string): string {
  return s ? s.slice(0, 7) : '';
}

export function isoWeek(d: Date): string {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - day + 3);
  const first = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((dt.getTime() - first.getTime()) / 86400000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
  return dt.getUTCFullYear() + '-W' + String(week).padStart(2, '0');
}

export function money(n: number, currency: string = "S/"): string {
  const symbol = currency || "S/";
  const val = Math.round(+n || 0).toLocaleString('es-PE');
  return `${symbol} ${val}`;
}

export function getFreshState(config: {
  nombre: string;
  handle: string;
  moneda: string;
  metaContenido: number;
  metaFechas: number;
}): DJState {
  return {
    perfil: {
      nombre: config.nombre || 'DJ',
      handle: config.handle || '@dj',
      moneda: config.moneda || 'S/',
      metaContenido: config.metaContenido || 5,
      metaFechas: config.metaFechas || 8
    },
    fechas: [],
    pagos: [],
    pasos: [],
    objetivos: [],
    notas: [],
    recordatorios: [],
    proyectos: [],
    finanzas: { saldoInicial: 0, movimientos: [] },
    contenido: { semana: isoWeek(new Date()), hechos: 0 }
  };
}

export function getSeedData(): DJState {
  const hoy = new Date();
  const iso = (off: number) => {
    const d = new Date(hoy);
    d.setDate(d.getDate() + off);
    return d.toISOString().slice(0, 10);
  };

  const id1 = uid();
  const id2 = uid();
  const id3 = uid();
  const id4 = uid();

  const fechas = [
    { 
      id: id1, 
      creado: Date.now(), 
      lugar: 'Matrimonio — Cieneguilla', 
      fecha: iso(5), 
      horario: '17:00 a 02:00', 
      contacto: 'Carlos & Valeria · 987 654 321', 
      ticket: 2500, 
      sena: 1250, 
      estado: 'confirmada' as EstadoFecha, 
      notas: 'Incluye sonido y luces. Open format + pachanga.' 
    },
    { 
      id: id2, 
      creado: Date.now(), 
      lugar: 'Evento Corporativo — San Isidro', 
      fecha: iso(12), 
      horario: '20:00 a 01:00', 
      contacto: 'Mariana (Producción) · 912 345 678', 
      ticket: 1800, 
      sena: 900, 
      estado: 'reservada' as EstadoFecha, 
      notas: 'Música lounge en cóctel y fiesta de cierre.' 
    },
    { 
      id: id3, 
      creado: Date.now(), 
      lugar: 'Discoteca — Miraflores', 
      fecha: iso(-4), 
      horario: '00:30 a 04:30', 
      contacto: 'Administrador Club', 
      ticket: 1200, 
      sena: 0, 
      estado: 'cobrada' as EstadoFecha, 
      notas: 'Set principal de house & reggaeton clásico.' 
    },
    { 
      id: id4, 
      creado: Date.now(), 
      lugar: 'Cumpleaños Privado — Barranco', 
      fecha: iso(18), 
      horario: '22:00 a 03:00', 
      contacto: 'Diego R.', 
      ticket: 1000, 
      sena: 0, 
      estado: 'consulta' as EstadoFecha, 
      notas: 'Cotización enviada por WhatsApp.' 
    }
  ];

  const pagos = [
    { id: uid(), fechaId: id1, monto: 1250, fecha: iso(-1), concepto: 'Adelanto 50%', metodo: 'Transferencia BCP', creado: Date.now() },
    { id: uid(), fechaId: id2, monto: 900, fecha: iso(-3), concepto: 'Reserva', metodo: 'Yape / Plin', creado: Date.now() },
    { id: uid(), fechaId: id3, monto: 1200, fecha: iso(-4), concepto: 'Pago completo', metodo: 'Transferencia', creado: Date.now() }
  ];

  const pasos = [
    { id: uid(), texto: 'Confirmar lista de temas para el matrimonio en Cieneguilla', hecho: false },
    { id: uid(), texto: 'Seguimiento por WhatsApp para evento de Barranco', hecho: false },
    { id: uid(), texto: 'Subir reel del fin de semana en Miraflores', hecho: true }
  ];

  const objetivos = [
    { id: uid(), texto: 'Cerrar 8 fechas en el mes', hecho: false },
    { id: uid(), texto: 'Renovar residencia mensual en club', hecho: false },
    { id: uid(), texto: 'Lanzar nuevo pack de edits en Soles', hecho: false }
  ];

  const notas = [
    { 
      id: uid(), 
      texto: 'Estructura recomendada: Iniciar con deep house y latin house, transición a reggaeton old school a la 1:00 AM.', 
      color: 'c1' as const, 
      pin: true, 
      creado: Date.now() - 86400000 
    },
    { 
      id: uid(), 
      texto: 'Revisar cables RCA a XLR y tener pendrive de respaldo listo.', 
      color: 'c3' as const, 
      pin: false, 
      creado: Date.now() - 7200000 
    }
  ];

  const rd = (off: number, h: number = 10) => {
    const d = new Date();
    d.setDate(d.getDate() + off);
    d.setHours(h, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const recordatorios = [
    { id: uid(), texto: 'Cobrar saldo restante del matrimonio de Cieneguilla', cuando: rd(4, 11), hecho: false, creado: Date.now() },
    { id: uid(), texto: 'Confirmar prueba de sonido en San Isidro', cuando: rd(11, 16), hecho: false, creado: Date.now() }
  ];

  const proyectos = [
    { 
      id: uid(), 
      creado: Date.now(), 
      nombre: 'Edición mensual de fiesta propia', 
      desc: 'Organizar fiesta temática bimensual para generar marca propia y mayor rentabilidad.', 
      estado: 'activo' as const, 
      prio: 'alta' as const, 
      paso: 'Definir local y fecha tentativa' 
    },
    { 
      id: uid(), 
      creado: Date.now(), 
      nombre: 'Pack de transiciones y acapellas', 
      desc: 'Venta digital de herramientas para otros DJs de la escena local.', 
      estado: 'idea' as const, 
      prio: 'media' as const, 
      paso: 'Grabar y empaquetar 15 mashups' 
    }
  ];

  const fm = (off: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + off);
    return d.toISOString().slice(0, 10);
  };

  const finanzas = {
    saldoInicial: 1500,
    movimientos: [
      { id: uid(), creado: Date.now(), tipo: 'gasto' as const, clase: 'fijo' as const, categoria: 'Software / Rekordbox / Splice', monto: 120, fecha: fm(0), concepto: 'Suscripciones mensuales' },
      { id: uid(), creado: Date.now(), tipo: 'gasto' as const, clase: 'variable' as const, categoria: 'Movilidad / Taxis', monto: 85, fecha: fm(0), concepto: 'Traslado de equipos' },
      { id: uid(), creado: Date.now(), tipo: 'ingreso' as const, clase: '' as const, categoria: 'Packs de Edits / Sonidos', monto: 300, fecha: fm(0), concepto: 'Venta de remixes' }
    ]
  };

  return {
    perfil: {
      nombre: "DJ PRO",
      handle: "@djpro",
      moneda: "S/",
      metaContenido: 4,
      metaFechas: 6
    },
    fechas,
    pagos,
    pasos,
    objetivos,
    notas,
    recordatorios,
    proyectos,
    finanzas,
    contenido: { semana: isoWeek(new Date()), hechos: 2 }
  };
}

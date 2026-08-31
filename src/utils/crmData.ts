import { DJState, EstadoFecha, FechaGig } from '../types';

export const ESTADOS: Record<EstadoFecha, { label: string; color: string; dot: string }> = {
  consulta:   { label: "Prospecto / Lead",   color: "var(--muted)",    dot: "#94a3b8" },
  reservada:  { label: "Rodaje Agendado",    color: "var(--mid)",      dot: "#fbbf24" },
  confirmada: { label: "Guion Aprobado",     color: "var(--accent)",   dot: "#ef4444" },
  cobrada:    { label: "Entregado / Cobrado",color: "var(--high)",     dot: "#34d399" },
  caida:      { label: "No cerró",           color: "var(--low)",      dot: "#f87171" }
};

export const ORDEN: EstadoFecha[] = ["consulta", "reservada", "confirmada", "cobrada", "caida"];
export const GANADAS: EstadoFecha[] = ["reservada", "confirmada", "cobrada"];
export const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const MESES_LARGO = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
export const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const CATS_GASTO_FIJO = [
  'Software (CapCut Pro / Premiere / Notion / Drive)',
  'Editores / Sueldos Equipo',
  'Alquiler Estudio / Oficina',
  'Contabilidad & Facturación',
  'Membresías Música & SFX (Envato / Epidemic)'
];

export const CATS_GASTO_VAR = [
  'Equipos (Luces LED / Micrófonos DJI-Rode / Lentes)',
  'Movilidad / Taxis a Rodajes',
  'Modelos / Creadores UGC / Actores',
  'Publicidad TikTok Ads / Meta Ads',
  'Utilería & Props de Grabación',
  'Comisiones Comerciales'
];

export const CATS_INGRESO = [
  'Paquete Mensual TikTok (Retainer 12 Videos)',
  'Pack Videos Virales (8 a 16 TikToks)',
  'Producción de Spot / Campaña TikTok Ads',
  'Estrategia de Guiones, Hooks & Escaletas',
  'Edición de Contenido Express'
];

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
  const hoy = new Date();
  const iso = (off: number) => {
    const d = new Date(hoy);
    d.setDate(d.getDate() + off);
    return d.toISOString().slice(0, 10);
  };

  const idTerminal = 'term_' + uid();
  const idPapaPlatano1 = 'papa_' + uid();
  const idPapaPlatano2 = 'papa_' + uid();
  const idPapaPlatano3 = 'papa_' + uid();
  const idPapaPlatano4 = 'papa_' + uid();

  // Next Thursday calculation
  const getNextThursday = (weekOffset: number = 0) => {
    const d = new Date();
    const day = d.getDay(); // 0 is Sunday, 4 is Thursday
    const diff = (4 - day + 7) % 7 || (day === 4 ? 0 : 7);
    d.setDate(d.getDate() + diff + weekOffset * 7);
    return d.toISOString().slice(0, 10);
  };

  const fechas: FechaGig[] = [
    {
      id: idTerminal,
      creado: Date.now() - 86400000 * 2,
      lugar: 'Terminal Marino',
      fecha: iso(0),
      horario: '10:00 a 13:00 (Pack 4 Videos)',
      contacto: 'Cliente Directo · Terminal Marino',
      ticket: 250,
      sena: 250,
      estado: 'cobrada',
      notas: 'Paquete Único de 4 Videos TikTok por S/ 250. Pago completado al 100% (Pago Único cancelado).'
    },
    {
      id: idPapaPlatano1,
      creado: Date.now() - 86400000,
      lugar: 'Papá Plátano',
      fecha: getNextThursday(0),
      horario: '12:00 a 16:00 (Jueves)',
      contacto: 'Cliente Mensual · 1 vez x semana',
      ticket: 400,
      sena: 400,
      estado: 'confirmada',
      notas: 'Cliente Mensual (Retainer):\n- 6 videos para TikTok al mes por S/ 400.\n- Grabación: 1 vez por semana los días JUEVES de 12:00 PM a 4:00 PM (12 a 16 hrs).\n- Sesión 1 del mes.'
    },
    {
      id: idPapaPlatano2,
      creado: Date.now(),
      lugar: 'Papá Plátano (Rodaje Semanal)',
      fecha: getNextThursday(1),
      horario: '12:00 a 16:00 (Jueves)',
      contacto: 'Cliente Mensual · 1 vez x semana',
      ticket: 0,
      sena: 0,
      estado: 'reservada',
      notas: 'Rodaje Semanal Jueves (12:00 a 16:00). Sesión 2 del mes (incluido en paquete mensual de S/ 400).'
    },
    {
      id: idPapaPlatano3,
      creado: Date.now(),
      lugar: 'Papá Plátano (Rodaje Semanal)',
      fecha: getNextThursday(2),
      horario: '12:00 a 16:00 (Jueves)',
      contacto: 'Cliente Mensual · 1 vez x semana',
      ticket: 0,
      sena: 0,
      estado: 'reservada',
      notas: 'Rodaje Semanal Jueves (12:00 a 16:00). Sesión 3 del mes (incluido en paquete mensual de S/ 400).'
    },
    {
      id: idPapaPlatano4,
      creado: Date.now(),
      lugar: 'Papá Plátano (Rodaje Semanal)',
      fecha: getNextThursday(3),
      horario: '12:00 a 16:00 (Jueves)',
      contacto: 'Cliente Mensual · 1 vez x semana',
      ticket: 0,
      sena: 0,
      estado: 'reservada',
      notas: 'Rodaje Semanal Jueves (12:00 a 16:00). Sesión 4 del mes (incluido en paquete mensual de S/ 400).'
    }
  ];

  const pagos = [
    {
      id: uid(),
      fechaId: idTerminal,
      monto: 250,
      fecha: iso(0),
      concepto: 'Pago Único 100% · Pack 4 Videos TikTok (Terminal Marino)',
      metodo: 'Transferencia / Efectivo',
      creado: Date.now() - 86400000
    },
    {
      id: uid(),
      fechaId: idPapaPlatano1,
      monto: 400,
      fecha: iso(0),
      concepto: 'Pago Mensualidad · 6 Videos TikTok (Papá Plátano)',
      metodo: 'Transferencia / Yape',
      creado: Date.now()
    }
  ];

  const pasos = [
    { id: uid(), texto: 'Entregar los 4 videos editados a Terminal Marino', hecho: false },
    { id: uid(), texto: 'Preparar escaleta y guiones para rodaje de los Jueves (12 a 4 PM) en Papá Plátano', hecho: false },
    { id: uid(), texto: 'Cargar equipos (cámara, trípode, micrófonos, luces) para rodaje de Papá Plátano', hecho: false }
  ];

  const objetivos = [
    { id: uid(), texto: 'Completar los 6 videos mensuales de Papá Plátano (Grabaciones Jueves 12 a 4 PM)', hecho: false },
    { id: uid(), texto: 'Entregar pack de 4 videos a Terminal Marino (S/ 250 cobrados)', hecho: true },
    { id: uid(), texto: 'Cerrar 2 nuevos clientes en paquete mensual de TikTok', hecho: false }
  ];

  const notas = [
    {
      id: uid(),
      texto: '📌 CLIENTE: PAPÁ PLÁTANO\n- Formato: Mensual (Retainer recurrente)\n- Paquete: 6 videos de TikTok por S/ 400 al mes.\n- Horario de grabación: TODOS LOS JUEVES de 12:00 a 16:00 (12 PM a 4 PM).\n- Frecuencia: 1 vez por semana.',
      color: 'c1' as const,
      pin: true,
      creado: Date.now()
    },
    {
      id: uid(),
      texto: '📌 CLIENTE: TERMINAL MARINO\n- Formato: Paquete Único\n- Paquete: 4 videos de TikTok por S/ 250.\n- Estado de pago: 100% Pagado (Cobrado S/ 250).',
      color: 'c2' as const,
      pin: true,
      creado: Date.now()
    }
  ];

  const recordatorios = [
    {
      id: uid(),
      texto: '🎬 Rodaje semanal en PAPÁ PLÁTANO (Jueves de 12:00 PM a 4:00 PM)',
      cuando: `${getNextThursday(0)}T12:00`,
      hecho: false,
      creado: Date.now()
    }
  ];

  const proyectos = [
    {
      id: uid(),
      creado: Date.now(),
      nombre: 'Papá Plátano · Retainer Mensual 6 Videos',
      desc: 'Producción continua de 6 videos mensuales. Rodajes fijos todos los jueves de 12:00 a 16:00.',
      estado: 'activo' as const,
      prio: 'alta' as const,
      paso: 'Grabar contenido este Jueves de 12 a 4 PM'
    },
    {
      id: uid(),
      creado: Date.now(),
      nombre: 'Terminal Marino · Pack 4 Videos',
      desc: 'Producción y entrega de 4 videos de alto impacto para TikTok (S/ 250 pagado).',
      estado: 'activo' as const,
      prio: 'media' as const,
      paso: 'Edición final y entrega'
    }
  ];

  const finanzas = {
    saldoInicial: 0,
    movimientos: [
      {
        id: uid(),
        creado: Date.now() - 86400000,
        tipo: 'ingreso' as const,
        clase: '' as const,
        categoria: 'Pack Videos Virales (8 a 16 TikToks)',
        monto: 250,
        fecha: iso(0),
        concepto: 'Cobro Pack 4 Videos · Terminal Marino'
      },
      {
        id: uid(),
        creado: Date.now(),
        tipo: 'ingreso' as const,
        clase: '' as const,
        categoria: 'Paquete Mensual TikTok (Retainer 12 Videos)',
        monto: 400,
        fecha: iso(0),
        concepto: 'Cobro Mensualidad (6 videos) · Papá Plátano'
      }
    ]
  };

  return {
    perfil: {
      nombre: config.nombre || 'IVA CREATIVA',
      handle: config.handle || '@ivacreativa.pe',
      moneda: config.moneda || 'S/',
      metaContenido: config.metaContenido || 10,
      metaFechas: config.metaFechas || 4
    },
    fechas,
    pagos,
    pasos,
    objetivos,
    notas,
    recordatorios,
    proyectos,
    finanzas,
    contenido: { semana: isoWeek(new Date()), hechos: 4 }
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
      lugar: 'Restaurante Fuego & Brasa (Miraflores)', 
      fecha: iso(4), 
      horario: '10:00 a 14:00 (Rodaje)', 
      contacto: 'Martín (Gerente) · 987 654 321', 
      ticket: 2400, 
      sena: 1200, 
      estado: 'confirmada' as EstadoFecha, 
      notas: 'Pack 12 TikToks. Grabar preparación de platos estrellas, tomas macro con humo, hook de "¿Dónde comer la mejor carne en Lima?". Llevar luces LED y micro inalámbrico.' 
    },
    { 
      id: id2, 
      creado: Date.now(), 
      lugar: 'Clínica Dental OdontoPro (San Isidro)', 
      fecha: iso(10), 
      horario: '15:00 a 18:30 (Rodaje)', 
      contacto: 'Dra. Valeria R. · 912 345 678', 
      ticket: 2000, 
      sena: 1000, 
      estado: 'reservada' as EstadoFecha, 
      notas: 'Pack 8 TikToks educativos + testimonios. Guiones con hooks sobre diseño de sonrisa y mitos dentales.' 
    },
    { 
      id: id3, 
      creado: Date.now(), 
      lugar: 'Tienda Urbana Streetwear (Surco)', 
      fecha: iso(-3), 
      horario: '11:00 a 15:00', 
      contacto: 'Renato B. · 998 112 334', 
      ticket: 1800, 
      sena: 0, 
      estado: 'cobrada' as EstadoFecha, 
      notas: '10 TikToks dinámicos con outfits de temporada. Edición con transiciones rápidas y tipografía viral entregada con éxito.' 
    },
    { 
      id: id4, 
      creado: Date.now(), 
      lugar: 'Centro de Estética & Spa Glow (San Borja)', 
      fecha: iso(16), 
      horario: 'Por coordinar', 
      contacto: 'Carla M. (WhatsApp)', 
      ticket: 1600, 
      sena: 0, 
      estado: 'consulta' as EstadoFecha, 
      notas: 'Interesados en paquete mensual de 8 videos para captación de clientes de limpieza facial y masajes.' 
    }
  ];

  const pagos = [
    { id: uid(), fechaId: id1, monto: 1200, fecha: iso(-1), concepto: 'Adelanto 50% Pack 12 TikToks', metodo: 'Transferencia BCP', creado: Date.now() },
    { id: uid(), fechaId: id2, monto: 1000, fecha: iso(-2), concepto: 'Reserva de fecha rodaje', metodo: 'Yape / Plin', creado: Date.now() },
    { id: uid(), fechaId: id3, monto: 1800, fecha: iso(-3), concepto: 'Liquidación completa Pack 10 videos', metodo: 'Transferencia BBVA', creado: Date.now() }
  ];

  const pasos = [
    { id: uid(), texto: 'Escribir 4 hooks de alto impacto para Restaurante Fuego & Brasa', hecho: true },
    { id: uid(), texto: 'Preparar escaleta y lista de tomas B-Roll para OdontoPro', hecho: false },
    { id: uid(), texto: 'Cargar batería de cámaras Sony y transmisores de audio DJI', hecho: false },
    { id: uid(), texto: 'Exportar versión final con subtítulos dinámicos en CapCut Pro', hecho: true }
  ];

  const objetivos = [
    { id: uid(), texto: 'Cerrar 6 clientes en paquete mensual recurrente (Retainer)', hecho: false },
    { id: uid(), texto: 'Entregar 48 videos editados con métrica de retención > 40%', hecho: false },
    { id: uid(), texto: 'Crear plantilla maestra de escaletas y hooks virales para el equipo', hecho: true }
  ];

  const notas = [
    { 
      id: uid(), 
      texto: 'Fórmula de Hook para TikTok de Negocios:\n1. 0 a 3s: Pregunta provocadora o error común que cometen los clientes.\n2. 3 a 15s: Prueba visual o transformación rápida (antes/después).\n3. 15 a 35s: Explicación del beneficio claro del negocio.\n4. Cierre: CTA directo ("Comenta INFO para reservar tu mesa / cita").', 
      color: 'c1' as const, 
      pin: true, 
      creado: Date.now() - 86400000 
    },
    { 
      id: uid(), 
      texto: 'Checklist de equipo para rodaje en cliente:\n- 2 Cámaras / iPhones en 4K 60fps con perfiles de color planos.\n- 2 Micrófonos lavalier inalámbricos con corta-viento.\n- Luz principal LED bi-color + luz difusora.\n- Trípode fluido y estabilizador gimbal.', 
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
    { id: uid(), texto: 'Confirmar hora de llegada y permisos de grabación con Fuego & Brasa', cuando: rd(3, 11), hecho: false, creado: Date.now() },
    { id: uid(), texto: 'Cobrar saldo 50% restante a OdontoPro tras entrega de primeros 4 edits', cuando: rd(12, 10), hecho: false, creado: Date.now() }
  ];

  const proyectos = [
    { 
      id: uid(), 
      creado: Date.now(), 
      nombre: 'Pack Lanzamiento TikTok Ads para Restaurantes', 
      desc: 'Oferta empaquetada de 12 videos orgánicos + 3 videos adaptados para pauta pagada en TikTok con llamados a la acción a WhatsApp.', 
      estado: 'activo' as const, 
      prio: 'alta' as const, 
      paso: 'Crear PDF comercial y video caso de éxito' 
    },
    { 
      id: uid(), 
      creado: Date.now(), 
      nombre: 'Banco de Creadores UGC de IVA Creativa', 
      desc: 'Base de datos de 15 creadores y modelos en Lima clasificados por nicho (gastronomía, moda, salud, tecnología).', 
      estado: 'probando' as const, 
      prio: 'media' as const, 
      paso: 'Hacer casting de 5 nuevos perfiles' 
    }
  ];

  const fm = (off: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + off);
    return d.toISOString().slice(0, 10);
  };

  const finanzas = {
    saldoInicial: 2500,
    movimientos: [
      { id: uid(), creado: Date.now(), tipo: 'gasto' as const, clase: 'fijo' as const, categoria: 'Software (CapCut Pro / Premiere / Notion / Drive)', monto: 180, fecha: fm(0), concepto: 'Suscripción CapCut Pro + Google One 2TB' },
      { id: uid(), creado: Date.now(), tipo: 'gasto' as const, clase: 'variable' as const, categoria: 'Movilidad / Taxis a Rodajes', monto: 120, fecha: fm(0), concepto: 'Taxis ida y vuelta rodajes en Miraflores y Surco' },
      { id: uid(), creado: Date.now(), tipo: 'ingreso' as const, clase: '' as const, categoria: 'Paquete Mensual TikTok (Retainer 12 Videos)', monto: 1800, fecha: fm(0), concepto: 'Cobro Pack Videos Streetwear' }
    ]
  };

  return {
    perfil: {
      nombre: "IVA CREATIVA",
      handle: "@ivacreativa.pe",
      moneda: "S/",
      metaContenido: 12,
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
    contenido: { semana: isoWeek(new Date()), hechos: 5 }
  };
}

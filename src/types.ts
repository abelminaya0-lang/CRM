export type EstadoFecha = 'consulta' | 'reservada' | 'confirmada' | 'cobrada' | 'caida';

export interface FechaGig {
  id: string;
  creado: number;
  lugar: string; // Negocio / Cliente / Marca / Locación
  fecha: string; // YYYY-MM-DD (Fecha de Rodaje / Grabación)
  horario: string; // Horario de Grabación
  contacto: string; // Contacto / WhatsApp del Negocio
  ticket: number; // Tarifa / Paquete de Videos en Soles
  sena: number; // Adelanto / Seña pagada
  estado: EstadoFecha;
  notas: string; // Guiones, hooks, cantidad de TikToks, estilo de edición
  googleEventId?: string;
  googleCalendarSynced?: boolean;
}

export interface Pago {
  id: string;
  fechaId?: string | null;
  monto: number;
  fecha: string; // YYYY-MM-DD
  concepto: string;
  metodo: string;
  creado: number;
}

export interface ChecklistItem {
  id: string;
  texto: string;
  hecho: boolean;
}

export interface Nota {
  id: string;
  texto: string;
  color: 'c1' | 'c2' | 'c3' | 'c4' | 'c5';
  pin: boolean;
  creado: number;
}

export interface Recordatorio {
  id: string;
  texto: string;
  cuando: string; // YYYY-MM-DDTHH:mm
  hecho: boolean;
  creado: number;
}

export interface Proyecto {
  id: string;
  creado: number;
  nombre: string;
  desc: string;
  estado: 'idea' | 'probando' | 'activo' | 'pausado' | 'descartado';
  prio: 'alta' | 'media' | 'baja';
  paso: string;
}

export interface MovimientoFinanzas {
  id: string;
  creado: number;
  tipo: 'gasto' | 'ingreso';
  clase: 'fijo' | 'variable' | '';
  categoria: string;
  monto: number;
  fecha: string; // YYYY-MM-DD
  concepto: string;
}

export interface FinanzasState {
  saldoInicial: number;
  movimientos: MovimientoFinanzas[];
}

export interface PerfilState {
  nombre: string;
  handle: string;
  moneda: string;
  metaContenido: number; // Meta semanal de videos grabados/editados
  metaFechas: number; // Meta mensual de clientes / paquetes TikTok cerrados
}

export interface ContenidoState {
  semana: string;
  hechos: number;
}

export interface CloudSyncConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseTable?: string;
  lastSyncedAt?: number;
  autoSync?: boolean;
}

export interface DJState {
  perfil: PerfilState;
  cloudSync?: CloudSyncConfig;
  fechas: FechaGig[];
  pagos: Pago[];
  pasos: ChecklistItem[];
  objetivos: ChecklistItem[];
  notas: Nota[];
  recordatorios: Recordatorio[];
  proyectos: Proyecto[];
  finanzas: FinanzasState;
  contenido: ContenidoState;
}

export interface AiMessage {
  role: 'user' | 'bot';
  text: string;
}


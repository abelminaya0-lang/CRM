import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CloudSyncConfig, DJState } from '../types';

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseClient(config?: CloudSyncConfig): SupabaseClient | null {
  const url =
    config?.supabaseUrl?.trim() ||
    import.meta.env.VITE_SUPABASE_URL ||
    '';
  const key =
    config?.supabaseAnonKey?.trim() ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    '';

  if (!url || !key) return null;

  if (cachedClient && cachedUrl === url && cachedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false },
    });
    cachedUrl = url;
    cachedKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Error instantiating Supabase client:', err);
    return null;
  }
}

export const SUPABASE_SQL_SCHEMA = `-- 1. Crea la tabla para almacenar la información completa del CRM de IVA CREATIVA
CREATE TABLE IF NOT EXISTS public.iva_creativa_crm (
  id TEXT PRIMARY KEY,
  agency_name TEXT DEFAULT 'IVA CREATIVA',
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilita RLS (Row Level Security) y permite lectura/escritura pública con tu anon key
ALTER TABLE public.iva_creativa_crm ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acceso con anon key"
ON public.iva_creativa_crm
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
`;

export async function testSupabaseConnection(config?: CloudSyncConfig): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient(config);
  if (!supabase) {
    return {
      success: false,
      message: 'Falta la URL del proyecto Supabase o la clave anon (Public Key).',
    };
  }

  try {
    const tableName = config?.supabaseTable?.trim() || 'iva_creativa_crm';
    const { data, error } = await supabase
      .from(tableName)
      .select('id, updated_at')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          success: false,
          message: `Conectó a Supabase pero la tabla "${tableName}" aún no existe. Ejecuta el script SQL en el SQL Editor de Supabase.`,
        };
      }
      return {
        success: false,
        message: `Error de Supabase: ${error.message}`,
      };
    }

    return {
      success: true,
      message: `¡Conexión exitosa a Supabase! (${tableName})`,
    };
  } catch (e: any) {
    return {
      success: false,
      message: `Error al conectar: ${e?.message || 'Error de red o CORS'}`,
    };
  }
}

export async function saveStateToSupabase(
  state: DJState,
  config?: CloudSyncConfig
): Promise<{ success: boolean; message: string; timestamp?: number }> {
  const supabase = getSupabaseClient(config || state.cloudSync);
  if (!supabase) {
    return {
      success: false,
      message: 'Configura tu URL y clave de Supabase en Ajustes.',
    };
  }

  const tableName = config?.supabaseTable?.trim() || state.cloudSync?.supabaseTable?.trim() || 'iva_creativa_crm';
  const recordId = 'crm_primary_state';
  const now = Date.now();

  try {
    const payload = {
      id: recordId,
      agency_name: state.perfil.nombre || 'IVA CREATIVA',
      data: state,
      updated_at: new Date(now).toISOString(),
    };

    const { error } = await supabase
      .from(tableName)
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: `Guardado en Supabase con éxito ✓`,
      timestamp: now,
    };
  } catch (err: any) {
    console.error('Error saving state to Supabase:', err);
    return {
      success: false,
      message: `Error al guardar en Supabase: ${err.message || 'Error de conexión'}`,
    };
  }
}

export async function loadStateFromSupabase(
  config?: CloudSyncConfig
): Promise<{ success: boolean; state?: DJState; message: string }> {
  const supabase = getSupabaseClient(config);
  if (!supabase) {
    return {
      success: false,
      message: 'Configura tu URL y clave de Supabase en Ajustes.',
    };
  }

  const tableName = config?.supabaseTable?.trim() || 'iva_creativa_crm';
  const recordId = 'crm_primary_state';

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('data, updated_at')
      .eq('id', recordId)
      .single();

    if (error) {
      throw error;
    }

    if (!data || !data.data) {
      return {
        success: false,
        message: 'No se encontraron datos guardados en Supabase aún.',
      };
    }

    return {
      success: true,
      state: data.data as DJState,
      message: 'Datos recuperados desde Supabase con éxito ✓',
    };
  } catch (err: any) {
    console.error('Error loading state from Supabase:', err);
    return {
      success: false,
      message: `Error al cargar de Supabase: ${err.message || 'No se pudo leer'}`,
    };
  }
}

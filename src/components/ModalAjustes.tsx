import React, { useState, useEffect } from 'react';
import { CloudSyncConfig, DJState } from '../types';
import { getSeedData, getFreshState } from '../utils/crmData';
import {
  saveStateToFirestore,
  loadStateFromFirestore,
  testFirestoreConnection,
} from '../utils/firebaseClient';
import {
  saveStateToSupabase,
  loadStateFromSupabase,
  testSupabaseConnection,
  SUPABASE_SQL_SCHEMA,
} from '../utils/supabaseClient';
import {
  requestGoogleCalendarAuth,
  syncAllGigsToGoogleCalendar,
  getCachedGoogleToken,
  clearGoogleToken,
} from '../utils/googleCalendar';

interface ModalAjustesProps {
  isOpen: boolean;
  onClose: () => void;
  state: DJState;
  onUpdateState: (updater: (prev: DJState) => DJState) => void;
  onShowToast: (msg: string) => void;
}

export const ModalAjustes: React.FC<ModalAjustesProps> = ({
  isOpen,
  onClose,
  state,
  onUpdateState,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'firebase' | 'perfil' | 'gcal' | 'supabase' | 'backup'>('firebase');

  // Perfil state
  const [nombre, setNombre] = useState(state.perfil.nombre || 'IVA CREATIVA');
  const [handle, setHandle] = useState(state.perfil.handle || '@ivacreativa.pe');
  const [moneda, setMoneda] = useState(state.perfil.moneda || 'S/');
  const [metaContenido, setMetaContenido] = useState(
    String(state.perfil.metaContenido || 12)
  );
  const [metaFechas, setMetaFechas] = useState(
    String(state.perfil.metaFechas || 6)
  );

  // Firebase state
  const [testingFirebase, setTestingFirebase] = useState(false);
  const [savingFirebase, setSavingFirebase] = useState(false);
  const [loadingFirebase, setLoadingFirebase] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<{ text: string; ok: boolean } | null>(null);

  // Supabase state
  const [supabaseUrl, setSupabaseUrl] = useState(
    state.cloudSync?.supabaseUrl ||
      import.meta.env.VITE_SUPABASE_URL ||
      ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    state.cloudSync?.supabaseAnonKey ||
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      ''
  );
  const [supabaseTable, setSupabaseTable] = useState(
    state.cloudSync?.supabaseTable || 'iva_creativa_crm'
  );
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [savingSupabase, setSavingSupabase] = useState(false);
  const [loadingSupabase, setLoadingSupabase] = useState(false);
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [showSql, setShowSql] = useState(false);

  // Google Calendar state
  const [gcalToken, setGcalToken] = useState<string | null>(null);
  const [syncingGcal, setSyncingGcal] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setNombre(state.perfil.nombre || 'IVA CREATIVA');
    setHandle(state.perfil.handle || '@ivacreativa.pe');
    setMoneda(state.perfil.moneda || 'S/');
    setMetaContenido(String(state.perfil.metaContenido || 12));
    setMetaFechas(String(state.perfil.metaFechas || 6));

    setSupabaseUrl(
      state.cloudSync?.supabaseUrl ||
        import.meta.env.VITE_SUPABASE_URL ||
        ''
    );
    setSupabaseKey(
      state.cloudSync?.supabaseAnonKey ||
        import.meta.env.VITE_SUPABASE_ANON_KEY ||
        ''
    );
    setSupabaseTable(state.cloudSync?.supabaseTable || 'iva_creativa_crm');

    setGcalToken(getCachedGoogleToken());
  }, [isOpen, state]);

  if (!isOpen) return null;

  const handleSavePerfil = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateState((prev) => ({
      ...prev,
      perfil: {
        ...prev.perfil,
        nombre: nombre.trim() || 'IVA CREATIVA',
        handle: handle.trim() || '@ivacreativa.pe',
        moneda: moneda.trim() || 'S/',
        metaContenido: +metaContenido || 0,
        metaFechas: +metaFechas || 0,
      },
    }));
    onShowToast('Ajustes de la agencia guardados ✓');
  };

  // Firebase Actions
  const handleTestFirebase = async () => {
    setTestingFirebase(true);
    setFirebaseStatus(null);
    const res = await testFirestoreConnection();
    setTestingFirebase(false);
    setFirebaseStatus({ text: res.message, ok: res.success });
    if (res.success) {
      onShowToast('Conexión con Firebase Cloud OK ✓');
    }
  };

  const handlePushToFirebase = async () => {
    setSavingFirebase(true);
    setFirebaseStatus(null);
    const res = await saveStateToFirestore(state);
    setSavingFirebase(false);
    setFirebaseStatus({ text: res.message, ok: res.success });
    if (res.success) {
      onUpdateState((prev) => ({
        ...prev,
        cloudSync: {
          ...prev.cloudSync,
          lastSyncedAt: res.timestamp || Date.now(),
        },
      }));
      onShowToast('¡Datos guardados en Firebase Cloud! ✓');
    }
  };

  const handlePullFromFirebase = async () => {
    if (!window.confirm('¿Deseas descargar los datos guardados en Firebase Cloud y actualizar la pantalla?')) {
      return;
    }
    setLoadingFirebase(true);
    setFirebaseStatus(null);
    const res = await loadStateFromFirestore();
    setLoadingFirebase(false);
    if (res.success && res.state) {
      onUpdateState(() => res.state!);
      setFirebaseStatus({ text: res.message, ok: true });
      onShowToast('Datos cargados de Firebase Cloud con éxito ✓');
      onClose();
    } else {
      setFirebaseStatus({ text: res.message, ok: false });
    }
  };

  // Supabase Actions
  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const config: CloudSyncConfig = {
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseKey.trim(),
      supabaseTable: supabaseTable.trim() || 'iva_creativa_crm',
      lastSyncedAt: state.cloudSync?.lastSyncedAt,
    };

    onUpdateState((prev) => ({
      ...prev,
      cloudSync: config,
    }));
    onShowToast('Configuración de Supabase guardada ✓');
  };

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setSupabaseStatusMsg(null);
    const config: CloudSyncConfig = {
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseKey.trim(),
      supabaseTable: supabaseTable.trim() || 'iva_creativa_crm',
    };

    const res = await testSupabaseConnection(config);
    setTestingSupabase(false);
    setSupabaseStatusMsg({ text: res.message, ok: res.success });
    if (res.success) {
      onShowToast('Conectado a Supabase ✓');
    }
  };

  const handlePushToSupabase = async () => {
    setSavingSupabase(true);
    const config: CloudSyncConfig = {
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseKey.trim(),
      supabaseTable: supabaseTable.trim() || 'iva_creativa_crm',
    };

    const res = await saveStateToSupabase(state, config);
    setSavingSupabase(false);
    if (res.success) {
      onUpdateState((prev) => ({
        ...prev,
        cloudSync: {
          ...config,
          lastSyncedAt: res.timestamp || Date.now(),
        },
      }));
      onShowToast('Datos de IVA CREATIVA guardados en Supabase ✓');
    } else {
      setSupabaseStatusMsg({ text: res.message, ok: false });
    }
  };

  const handlePullFromSupabase = async () => {
    if (!window.confirm('¿Deseas descargar los datos desde Supabase y reemplazar la vista actual?')) {
      return;
    }
    setLoadingSupabase(true);
    const config: CloudSyncConfig = {
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseKey.trim(),
      supabaseTable: supabaseTable.trim() || 'iva_creativa_crm',
    };

    const res = await loadStateFromSupabase(config);
    setLoadingSupabase(false);
    if (res.success && res.state) {
      onUpdateState(() => ({
        ...res.state!,
        cloudSync: {
          ...config,
          lastSyncedAt: Date.now(),
        },
      }));
      onShowToast('Datos cargados desde Supabase con éxito ✓');
      onClose();
    } else {
      setSupabaseStatusMsg({ text: res.message, ok: false });
    }
  };

  // Google Calendar Auth & Sync
  const handleConnectGoogleCalendar = async () => {
    setSyncingGcal(true);
    const res = await requestGoogleCalendarAuth();
    setSyncingGcal(false);

    if (res.success && res.token) {
      setGcalToken(res.token);
      onShowToast('Google Calendar conectado ✓');

      if (state.fechas.length > 0) {
        setSyncingGcal(true);
        const syncRes = await syncAllGigsToGoogleCalendar(res.token, state.fechas, state.perfil.moneda);
        setSyncingGcal(false);
        if (syncRes.success) {
          onUpdateState((prev) => ({ ...prev, fechas: syncRes.updatedGigs }));
          onShowToast(`${syncRes.syncedCount} rodajes sincronizados con Google Calendar ✓`);
        }
      }
    } else {
      alert(`Error al conectar con Google Calendar: ${res.error || 'Acceso denegado'}`);
    }
  };

  const handleSyncAllGcal = async () => {
    let token = getCachedGoogleToken();
    if (!token) {
      const authRes = await requestGoogleCalendarAuth();
      if (!authRes.success || !authRes.token) {
        alert(`Autorización requerida: ${authRes.error || 'No se pudo obtener token'}`);
        return;
      }
      token = authRes.token;
      setGcalToken(token);
    }

    setSyncingGcal(true);
    const res = await syncAllGigsToGoogleCalendar(token, state.fechas, state.perfil.moneda);
    setSyncingGcal(false);

    if (res.success) {
      onUpdateState((prev) => ({ ...prev, fechas: res.updatedGigs }));
      onShowToast(`¡${res.syncedCount} rodajes sincronizados con tu Google Calendar! ✓`);
    } else {
      alert(`Error al sincronizar: ${res.error}`);
    }
  };

  const handleDisconnectGcal = () => {
    clearGoogleToken();
    setGcalToken(null);
    onShowToast('Sesión de Google Calendar desconectada');
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_ivacreativa_crm_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Copia descargada ✓');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          onUpdateState(() => parsed);
          onShowToast('Datos de la agencia importados ✓');
          onClose();
        }
      } catch (err) {
        alert('El archivo JSON no es válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm('¿Cargar datos de ejemplo de IVA CREATIVA (Agencia de TikTok en Soles)?')) {
      onUpdateState(() => getSeedData());
      onShowToast('Datos de IVA CREATIVA cargados en Soles ✓');
      onClose();
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('¿Vaciar todo y comenzar con el CRM en blanco (0 clientes, 0 cobros, 0 notas) para tus datos reales?')) {
      onUpdateState((prev) =>
        getFreshState({
          nombre: prev.perfil.nombre || 'IVA CREATIVA',
          handle: prev.perfil.handle || '@ivacreativa.pe',
          moneda: prev.perfil.moneda || 'S/',
          metaContenido: prev.perfil.metaContenido || 12,
          metaFechas: prev.perfil.metaFechas || 6,
        })
      );
      onShowToast('CRM limpiado en blanco para tus datos reales ✓');
      onClose();
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    onShowToast('SQL copiado al portapapeles ✓');
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '100%' }}
      >
        <div className="modal-head">
          <h2>Ajustes & Conexiones Cloud</h2>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="ai-tabs" style={{ marginBottom: '16px' }}>
          <button
            type="button"
            className={`ai-tab ${activeSubTab === 'firebase' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('firebase')}
          >
            🔥 Firebase Cloud
          </button>
          <button
            type="button"
            className={`ai-tab ${activeSubTab === 'perfil' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('perfil')}
          >
            🏢 Agencia
          </button>
          <button
            type="button"
            className={`ai-tab ${activeSubTab === 'gcal' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('gcal')}
          >
            📅 Google Calendar
          </button>
          <button
            type="button"
            className={`ai-tab ${activeSubTab === 'supabase' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('supabase')}
          >
            ⚡ Supabase
          </button>
          <button
            type="button"
            className={`ai-tab ${activeSubTab === 'backup' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('backup')}
          >
            💾 Backup & Reset
          </button>
        </div>

        {/* SUBTAB: FIREBASE CLOUD (CONNECTED AUTOMATICALLY) */}
        {activeSubTab === 'firebase' && (
          <div>
            <div
              style={{
                background: 'rgba(52, 211, 153, 0.08)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                padding: '14px 16px',
                borderRadius: '12px',
                marginBottom: '16px',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '18px' }}>🔥</span>
                <div style={{ fontWeight: 700, color: '#34d399', fontSize: '15px' }}>
                  Base de Datos Cloud Aprovisionada y Conectada
                </div>
              </div>
              <p style={{ margin: 0, color: '#d1d5db' }}>
                ¡Listo! Tu CRM ya está conectado a una base de datos en la nube de <strong>Google Firebase Firestore</strong>. Tus clientes, rodajes, notas y finanzas se guardan automáticamente sin necesidad de copiar ninguna clave ni configurar variables a mano.
              </p>
            </div>

            <div className="card pad-sm" style={{ background: 'var(--panel-2)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                    Estado de Sincronización Automática:
                  </div>
                  <div style={{ fontSize: '12px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                    <span>Activo — Guardando cambios en segundo plano</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn ghost sm text-xs"
                  disabled={testingFirebase}
                  onClick={handleTestFirebase}
                >
                  {testingFirebase ? 'Verificando...' : '🔍 Probar Conexión'}
                </button>
              </div>
            </div>

            {firebaseStatus && (
              <div
                style={{
                  padding: '9px 13px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  marginBottom: '14px',
                  background: firebaseStatus.ok ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: firebaseStatus.ok ? '#34d399' : '#f87171',
                  border: `1px solid ${firebaseStatus.ok ? '#34d399' : '#ef4444'}`,
                }}
              >
                {firebaseStatus.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn sm bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                style={{ flex: 1 }}
                disabled={savingFirebase}
                onClick={handlePushToFirebase}
              >
                {savingFirebase ? 'Guardando...' : '☁️ Guardar en la Nube Ahora'}
              </button>
              <button
                type="button"
                className="btn ghost sm"
                style={{ flex: 1 }}
                disabled={loadingFirebase}
                onClick={handlePullFromFirebase}
              >
                {loadingFirebase ? 'Descargando...' : '📥 Cargar Datos de la Nube'}
              </button>
            </div>
          </div>
        )}

        {/* SUBTAB: PERFIL */}
        {activeSubTab === 'perfil' && (
          <form onSubmit={handleSavePerfil}>
            <div className="field">
              <label>Nombre de la Agencia / Marca</label>
              <input
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: IVA CREATIVA"
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label>TikTok / Instagram Handle</label>
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@ivacreativa.pe"
                />
              </div>
              <div className="field">
                <label>Símbolo de Moneda</label>
                <input
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                  placeholder="S/"
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Meta de Videos TikTok editados (semanal)</label>
                <input
                  type="number"
                  min="0"
                  value={metaContenido}
                  onChange={(e) => setMetaContenido(e.target.value)}
                  placeholder="12"
                />
              </div>
              <div className="field">
                <label>Meta de Clientes / Paquetes cerrados (mensual)</label>
                <input
                  type="number"
                  min="0"
                  value={metaFechas}
                  onChange={(e) => setMetaFechas(e.target.value)}
                  placeholder="6"
                />
              </div>
            </div>

            <button className="btn block bg-[#ef4444] text-white" type="submit" style={{ marginTop: '12px' }}>
              Guardar Ajustes de Agencia
            </button>
          </form>
        )}

        {/* SUBTAB: GOOGLE CALENDAR */}
        {activeSubTab === 'gcal' && (
          <div>
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: '12px 14px',
                borderRadius: '10px',
                marginBottom: '16px',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 600, color: '#ef4444', marginBottom: '4px' }}>
                📅 Sincronización con Google Calendar
              </div>
              Tus rodajes, fechas de grabación con clientes y horarios se sincronizan directamente con tu cuenta de Google Calendar para que nunca se te cruce una jornada.
            </div>

            <div className="card pad-sm" style={{ background: 'var(--panel-2)', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>
                    Estado de Google Calendar:
                  </div>
                  <div style={{ fontSize: '12px', color: gcalToken ? '#34d399' : 'var(--muted)' }}>
                    {gcalToken ? '● Conectado y autorizado' : '○ No conectado (requiere autorización)'}
                  </div>
                </div>

                {gcalToken ? (
                  <button
                    type="button"
                    className="btn ghost sm text-xs"
                    onClick={handleDisconnectGcal}
                  >
                    Desconectar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn sm bg-[#ef4444] text-white"
                    disabled={syncingGcal}
                    onClick={handleConnectGoogleCalendar}
                  >
                    {syncingGcal ? 'Conectando...' : '🔑 Conectar Google'}
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn sm bg-gradient-to-r from-[#ef4444] to-[#b91c1c] text-white font-bold"
                disabled={syncingGcal}
                onClick={handleSyncAllGcal}
              >
                {syncingGcal ? 'Sincronizando...' : '🔄 Sincronizar todos los rodajes a Google Calendar'}
              </button>
              <p style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', margin: 0 }}>
                Crea eventos con ubicación del cliente, lista de tomas, contacto y detalles de pago.
              </p>
            </div>
          </div>
        )}

        {/* SUBTAB: SUPABASE (OPTIONAL) */}
        {activeSubTab === 'supabase' && (
          <div>
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '12px 14px',
                borderRadius: '10px',
                marginBottom: '14px',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
                ⚡ Supabase (Opcional)
              </div>
              Si prefieres usar una base de datos propia en Supabase además de Firebase Cloud, puedes ingresar tus credenciales aquí.
            </div>

            <form onSubmit={handleSaveSupabaseConfig}>
              <div className="field">
                <label>Project URL de Supabase</label>
                <input
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                />
              </div>

              <div className="field">
                <label>Anon Public Key</label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                />
              </div>

              <div className="field-row" style={{ alignItems: 'center' }}>
                <div className="field" style={{ margin: 0, flex: 2 }}>
                  <label>Nombre de Tabla</label>
                  <input
                    value={supabaseTable}
                    onChange={(e) => setSupabaseTable(e.target.value)}
                    placeholder="iva_creativa_crm"
                  />
                </div>
                <div style={{ flex: 1, paddingTop: '18px' }}>
                  <button
                    type="button"
                    className="btn ghost sm block"
                    disabled={testingSupabase || !supabaseUrl || !supabaseKey}
                    onClick={handleTestSupabase}
                  >
                    {testingSupabase ? 'Probando...' : '🔍 Probar'}
                  </button>
                </div>
              </div>

              {supabaseStatusMsg && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    marginTop: '10px',
                    background: supabaseStatusMsg.ok ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: supabaseStatusMsg.ok ? '#34d399' : '#f87171',
                    border: `1px solid ${supabaseStatusMsg.ok ? '#34d399' : '#ef4444'}`,
                  }}
                >
                  {supabaseStatusMsg.text}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn sm bg-sky-600 hover:bg-sky-500 text-white"
                  style={{ flex: 1 }}
                  disabled={savingSupabase || !supabaseUrl || !supabaseKey}
                  onClick={handlePushToSupabase}
                >
                  {savingSupabase ? 'Guardando...' : '☁️ Guardar en Supabase'}
                </button>
                <button
                  type="button"
                  className="btn ghost sm"
                  style={{ flex: 1 }}
                  disabled={loadingSupabase || !supabaseUrl || !supabaseKey}
                  onClick={handlePullFromSupabase}
                >
                  {loadingSupabase ? 'Cargando...' : '📥 Cargar de Supabase'}
                </button>
              </div>

              <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn ghost sm"
                  style={{ fontSize: '11px' }}
                  onClick={() => setShowSql(!showSql)}
                >
                  {showSql ? 'Ocultar SQL' : '📋 Ver Script SQL para Supabase'}
                </button>
              </div>

              {showSql && (
                <div style={{ marginTop: '10px' }}>
                  <div
                    style={{
                      background: '#09090d',
                      border: '1px solid var(--line)',
                      padding: '10px',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: '#38bdf8',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '130px',
                      overflowY: 'auto',
                    }}
                  >
                    {SUPABASE_SQL_SCHEMA}
                  </div>
                  <button
                    type="button"
                    className="btn ghost sm block"
                    style={{ marginTop: '6px' }}
                    onClick={copySql}
                  >
                    Copiar Script SQL
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* SUBTAB: BACKUP & RESET */}
        {activeSubTab === 'backup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <span className="eyebrow" style={{ marginBottom: '8px' }}>
                Archivos JSON Locales
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn ghost sm"
                  style={{ flex: 1 }}
                  onClick={handleExportJSON}
                >
                  📥 Exportar Copia JSON
                </button>
                <label
                  className="btn ghost sm"
                  style={{ flex: 1, cursor: 'pointer', textAlign: 'center' }}
                >
                  📤 Importar Copia JSON
                  <input
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleImportJSON}
                  />
                </label>
              </div>
            </div>

            <div style={{ paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
              <span className="eyebrow" style={{ marginBottom: '8px' }}>
                Limpieza de Datos para Uso Real
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  className="btn danger sm"
                  onClick={handleClearAllData}
                >
                  ✨ Limpiar todo y comenzar en blanco (0 clientes / datos reales)
                </button>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={handleResetData}
                >
                  ↺ Cargar datos de ejemplo de IVA CREATIVA
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

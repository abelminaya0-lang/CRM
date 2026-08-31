import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DJState, EstadoFecha, FechaGig } from './types';
import { getFreshState, getSeedData, isoWeek, setGlobalHidePrices } from './utils/crmData';
import {
  saveStateToFirestore,
  loadStateFromFirestore,
  subscribeToFirestoreState,
} from './utils/firebaseClient';
import { saveStateToSupabase } from './utils/supabaseClient';
import { getCachedGoogleToken } from './utils/googleCalendar';
import { Header } from './components/Header';
import { NavTabs, TabId } from './components/NavTabs';
import { PanelTab } from './components/PanelTab';
import { FechasTab } from './components/FechasTab';
import { CalendarioTab } from './components/CalendarioTab';
import { StatsTab } from './components/StatsTab';
import { ObjetivosTab } from './components/ObjetivosTab';
import { PagosTab } from './components/PagosTab';
import { FinanzasTab } from './components/FinanzasTab';
import { NotasTab } from './components/NotasTab';
import { ModalFecha } from './components/ModalFecha';
import { ModalProyecto } from './components/ModalProyecto';
import { ModalAsistente } from './components/ModalAsistente';
import { ModalAjustes } from './components/ModalAjustes';
import { Toast } from './components/Toast';

const STORAGE_KEY = 'ivacreativa_tiktok_crm_v4';

export function App() {
  const [hidePrices, setHidePrices] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ivacreativa_hide_prices') === 'true';
    } catch {
      return false;
    }
  });

  const [state, setState] = useState<DJState>(() => {
    try {
      localStorage.removeItem('ivacreativa_tiktok_crm_v1');
      localStorage.removeItem('ivacreativa_tiktok_crm_v2');
      localStorage.removeItem('ivacreativa_tiktok_crm_v3');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasOldDemo = parsed.fechas?.some((f: any) => f.lugar?.includes('Fuego & Brasa') || f.lugar?.includes('OdontoPro'));
        if (!hasOldDemo) {
          const currentWeek = isoWeek(new Date());
          if (parsed.contenido && parsed.contenido.semana !== currentWeek) {
            parsed.contenido = { semana: currentWeek, hechos: parsed.contenido.hechos || 0 };
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading CRM state from localStorage', e);
    }
    // Clean initial state with real clients: Terminal Marino (25 Agosto) & Papá Plátano (Agosto pagado, prox 15 Septiembre)
    return getFreshState({
      nombre: 'IVA CREATIVA',
      handle: '@ivacreativa.pe',
      moneda: 'S/',
      metaContenido: 10,
      metaFechas: 4,
    });
  });

  const [activeTab, setActiveTab] = useState<TabId>('panel');

  // Modals state
  const [modalFechaOpen, setModalFechaOpen] = useState(false);
  const [selectedFechaId, setSelectedFechaId] = useState<string | null>(null);
  const [prefillFechaDate, setPrefillFechaDate] = useState<string | undefined>();

  const [modalProyectoOpen, setModalProyectoOpen] = useState(false);
  const [selectedProyectoId, setSelectedProyectoId] = useState<string | null>(null);

  const [modalAsistenteOpen, setModalAsistenteOpen] = useState(false);
  const [modalAjustesOpen, setModalAjustesOpen] = useState(false);

  const [prefilledPagoFechaId, setPrefilledPagoFechaId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isFirstRender = useRef(true);

  // Initial cloud fetch from Firebase Firestore on startup
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const cloudResult = await loadStateFromFirestore();
        if (isMounted && cloudResult.success && cloudResult.state) {
          const cloudState = cloudResult.state;
          const hasOldDemo = cloudState.fechas?.some((f: any) => f.lugar?.includes('Fuego & Brasa') || f.lugar?.includes('OdontoPro'));
          const isEmpty = !cloudState.fechas || cloudState.fechas.length === 0;

          if (!hasOldDemo && !isEmpty) {
            setState(cloudState);
          } else {
            // Overwrite with clean state containing Terminal Marino & Papá Plátano
            const fresh = getFreshState({
              nombre: cloudState.perfil?.nombre || 'IVA CREATIVA',
              handle: cloudState.perfil?.handle || '@ivacreativa.pe',
              moneda: cloudState.perfil?.moneda || 'S/',
              metaContenido: cloudState.perfil?.metaContenido || 10,
              metaFechas: cloudState.perfil?.metaFechas || 4,
            });
            setState(fresh);
            await saveStateToFirestore(fresh);
          }
        } else if (isMounted && (!cloudResult.success || !cloudResult.state)) {
          // If no cloud document exists yet, initialize and push
          const fresh = getFreshState({
            nombre: 'IVA CREATIVA',
            handle: '@ivacreativa.pe',
            moneda: 'S/',
            metaContenido: 10,
            metaFechas: 4,
          });
          await saveStateToFirestore(fresh);
        }
      } catch (err) {
        console.warn('Initial Firebase fetch notice:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving CRM state to localStorage', e);
    }
  }, [state]);

  // Debounced auto-save to Firebase Cloud Firestore
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      try {
        await saveStateToFirestore(state);
      } catch (err) {
        console.warn('Firebase Cloud auto-save notice:', err);
      }

      // Also auto-save to Supabase if configured
      const hasSupabase =
        Boolean(state.cloudSync?.supabaseUrl && state.cloudSync?.supabaseAnonKey) ||
        Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
      if (hasSupabase && state.cloudSync?.autoSync !== false) {
        try {
          await saveStateToSupabase(state);
        } catch (err) {
          console.warn('Supabase auto-save notice:', err);
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [state]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  }, []);

  // Sync privacy mode with localStorage and global formatter
  useEffect(() => {
    setGlobalHidePrices(hidePrices);
    try {
      localStorage.setItem('ivacreativa_hide_prices', String(hidePrices));
    } catch (e) {
      console.error('Error saving privacy state to localStorage', e);
    }
  }, [hidePrices]);

  const handleToggleHidePrices = useCallback(() => {
    setHidePrices((prev) => {
      const next = !prev;
      showToast(next ? 'Modo Privacidad activado: Montos ocultos' : 'Modo Privacidad desactivado: Montos visibles');
      return next;
    });
  }, [showToast]);

  // Handlers for Dates / Shoots
  const handleOpenNuevaFecha = (datePrefill?: string) => {
    setSelectedFechaId(null);
    setPrefillFechaDate(datePrefill);
    setModalFechaOpen(true);
  };

  const handleOpenEditFecha = (id: string) => {
    setSelectedFechaId(id);
    setPrefillFechaDate(undefined);
    setModalFechaOpen(true);
  };

  const handleMoverFecha = (id: string, nuevoEstado: EstadoFecha) => {
    setState((prev) => ({
      ...prev,
      fechas: prev.fechas.map((f) => (f.id === id ? { ...f, estado: nuevoEstado } : f)),
    }));
    showToast(`Estado cambiado a ${nuevoEstado} ✓`);
  };

  const handlePrefillPago = (gig: FechaGig) => {
    setPrefilledPagoFechaId(gig.id);
    setActiveTab('pagos');
  };

  // Handlers for Projects
  const handleOpenNuevoProyecto = () => {
    setSelectedProyectoId(null);
    setModalProyectoOpen(true);
  };

  const handleOpenEditProyecto = (id: string) => {
    setSelectedProyectoId(id);
    setModalProyectoOpen(true);
  };

  // Count pending/overdue reminders
  const now = new Date();
  const pendingReminders = (state.recordatorios || []).filter((r) => {
    if (r.hecho) return false;
    if (!r.cuando) return false;
    return new Date(r.cuando) <= now;
  }).length;

  const isSupabaseConfigured =
    Boolean(state.cloudSync?.supabaseUrl && state.cloudSync?.supabaseAnonKey) ||
    Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  const isGcalConnected = Boolean(getCachedGoogleToken());

  return (
    <div className="wrap">
      {/* Header with IVA CREATIVA Red & Black logo, cloud status and action controls */}
      <Header
        djName={state.perfil.nombre || 'IVA CREATIVA'}
        brandLine="IVA CREATIVA · TIKTOK AGENCY CRM"
        isFirebaseActive={true}
        isSupabaseConfigured={isSupabaseConfigured}
        isGcalConnected={isGcalConnected}
        hidePrices={hidePrices}
        onToggleHidePrices={handleToggleHidePrices}
        onOpenAjustes={() => setModalAjustesOpen(true)}
        onOpenAsistente={() => setModalAsistenteOpen(true)}
        onOpenNuevaFecha={() => handleOpenNuevaFecha()}
      />

      {/* Navigation Tabs */}
      <NavTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingRemindersCount={pendingReminders}
      />

      {/* Active Tab Screen */}
      <main>
        {activeTab === 'panel' && (
          <PanelTab
            state={state}
            hidePrices={hidePrices}
            onToggleHidePrices={handleToggleHidePrices}
            onGotoTab={(tab) => setActiveTab(tab)}
            onOpenNuevaFecha={() => handleOpenNuevaFecha()}
          />
        )}

        {activeTab === 'fechas' && (
          <FechasTab
            state={state}
            onOpenNuevaFecha={() => handleOpenNuevaFecha()}
            onOpenEditFecha={handleOpenEditFecha}
            onMoverFecha={handleMoverFecha}
            onPrefillPago={handlePrefillPago}
          />
        )}

        {activeTab === 'calendario' && (
          <CalendarioTab
            state={state}
            onOpenFecha={(id, prefillDate) => {
              if (id) {
                handleOpenEditFecha(id);
              } else {
                handleOpenNuevaFecha(prefillDate);
              }
            }}
            onUpdateState={setState}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'stats' && <StatsTab state={state} />}

        {activeTab === 'objetivos' && (
          <ObjetivosTab state={state} onUpdateState={setState} />
        )}

        {activeTab === 'pagos' && (
          <PagosTab
            state={state}
            prefilledFechaId={prefilledPagoFechaId}
            onUpdateState={setState}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'finanzas' && (
          <FinanzasTab
            state={state}
            onUpdateState={setState}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'notas' && (
          <NotasTab
            state={state}
            onUpdateState={setState}
            onOpenNuevoProyecto={handleOpenNuevoProyecto}
            onOpenEditProyecto={handleOpenEditProyecto}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Floating Action Button */}
      <button
        className="fab"
        id="fabNueva"
        title="Agendar nuevo rodaje / cliente"
        onClick={() => handleOpenNuevaFecha()}
      >
        🎬 <span>+ Nuevo Rodaje</span>
      </button>

      {/* Modals */}
      <ModalFecha
        isOpen={modalFechaOpen}
        onClose={() => setModalFechaOpen(false)}
        fechaId={selectedFechaId}
        initialDate={prefillFechaDate}
        state={state}
        onUpdateState={setState}
        onShowToast={showToast}
      />

      <ModalProyecto
        isOpen={modalProyectoOpen}
        onClose={() => setModalProyectoOpen(false)}
        proyectoId={selectedProyectoId}
        state={state}
        onUpdateState={setState}
        onShowToast={showToast}
      />

      <ModalAsistente
        isOpen={modalAsistenteOpen}
        onClose={() => setModalAsistenteOpen(false)}
        state={state}
        onUpdateState={setState}
        onShowToast={showToast}
      />

      <ModalAjustes
        isOpen={modalAjustesOpen}
        onClose={() => setModalAjustesOpen(false)}
        state={state}
        onUpdateState={setState}
        onShowToast={showToast}
      />

      {/* Toast popup */}
      <Toast message={toastMessage} />
    </div>
  );
}

export default App;

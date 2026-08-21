import React, { useState, useEffect, useCallback } from 'react';
import { DJState, EstadoFecha, FechaGig } from './types';
import { getFreshState, getSeedData, isoWeek } from './utils/crmData';
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

const STORAGE_KEY = 'djcrm_v4_el_coyote_show';

export function App() {
  const [state, setState] = useState<DJState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure week reset if week changed
        const currentWeek = isoWeek(new Date());
        if (parsed.contenido && parsed.contenido.semana !== currentWeek) {
          parsed.contenido = { semana: currentWeek, hechos: 0 };
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error loading CRM state from localStorage', e);
    }
    return getFreshState({
      nombre: 'EL COYOTE SHOW',
      handle: '@elcoyoteshow',
      moneda: 'S/',
      metaContenido: 4,
      metaFechas: 6
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

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving CRM state to localStorage', e);
    }
  }, [state]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2400);
  }, []);

  // Handlers for Dates
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

  return (
    <div className="wrap">
      {/* Header */}
      <Header
        djName={state.perfil.nombre || 'EL COYOTE SHOW'}
        brandLine="EL COYOTE SHOW · CRM"
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
        title="Nueva fecha"
        onClick={() => handleOpenNuevaFecha()}
      >
        ⚡ <span>+ Fecha rápida</span>
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

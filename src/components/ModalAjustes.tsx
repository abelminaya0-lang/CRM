import React, { useState, useEffect } from 'react';
import { DJState } from '../types';
import { getSeedData, getFreshState } from '../utils/crmData';

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
  const [nombre, setNombre] = useState(state.perfil.nombre || '');
  const [handle, setHandle] = useState(state.perfil.handle || '');
  const [moneda, setMoneda] = useState(state.perfil.moneda || 'S/');
  const [metaContenido, setMetaContenido] = useState(
    String(state.perfil.metaContenido || 5)
  );
  const [metaFechas, setMetaFechas] = useState(
    String(state.perfil.metaFechas || 8)
  );

  useEffect(() => {
    if (!isOpen) return;
    setNombre(state.perfil.nombre || '');
    setHandle(state.perfil.handle || '');
    setMoneda(state.perfil.moneda || 'S/');
    setMetaContenido(String(state.perfil.metaContenido || 5));
    setMetaFechas(String(state.perfil.metaFechas || 8));
  }, [isOpen, state.perfil]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateState((prev) => ({
      ...prev,
      perfil: {
        ...prev.perfil,
        nombre: nombre.trim() || 'EL COYOTE SHOW',
        handle: handle.trim() || '@elcoyoteshow',
        moneda: moneda.trim() || 'S/',
        metaContenido: +metaContenido || 0,
        metaFechas: +metaFechas || 0,
      },
    }));
    onShowToast('Ajustes guardados ✓');
    onClose();
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_crm_dj_${new Date().toISOString().slice(0, 10)}.json`;
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
          onShowToast('Datos importados correctamente ✓');
          onClose();
        }
      } catch (err) {
        alert('El archivo JSON no es válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm('¿Cargar datos de ejemplo limpios en Soles (S/)? Se actualizará la información.')) {
      onUpdateState(() => getSeedData());
      onShowToast('Datos limpios en Soles cargados ✓');
      onClose();
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('¿Vaciar todo y comenzar completamente en blanco (0 fechas, 0 pagos, 0 notas)?')) {
      onUpdateState((prev) =>
        getFreshState({
          nombre: prev.perfil.nombre || 'EL COYOTE SHOW',
          handle: prev.perfil.handle || '@elcoyoteshow',
          moneda: 'S/',
          metaContenido: prev.perfil.metaContenido || 4,
          metaFechas: prev.perfil.metaFechas || 6,
        })
      );
      onShowToast('CRM limpiado en blanco ✓');
      onClose();
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Ajustes y Perfil</h2>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="field">
            <label>Nombre del DJ / Proyecto / Show</label>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: EL COYOTE SHOW"
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Instagram / Handle</label>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@elcoyoteshow"
              />
            </div>
            <div className="field">
              <label>Símbolo de moneda</label>
              <input
                value={moneda}
                onChange={(e) => setMoneda(e.target.value)}
                placeholder="S/"
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Meta de contenido semanal</label>
              <input
                type="number"
                min="0"
                value={metaContenido}
                onChange={(e) => setMetaContenido(e.target.value)}
                placeholder="4"
              />
            </div>
            <div className="field">
              <label>Meta de fechas por mes</label>
              <input
                type="number"
                min="0"
                value={metaFechas}
                onChange={(e) => setMetaFechas(e.target.value)}
                placeholder="6"
              />
            </div>
          </div>

          <button className="btn block" type="submit" style={{ marginTop: '8px' }}>
            Guardar cambios
          </button>
        </form>

        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <span className="eyebrow" style={{ margin: 0 }}>
            Gestión de datos y copias
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn ghost sm"
              style={{ flex: 1 }}
              onClick={handleExportJSON}
            >
              📥 Exportar JSON
            </button>
            <label
              className="btn ghost sm"
              style={{ flex: 1, cursor: 'pointer', textAlign: 'center' }}
            >
              📤 Importar JSON
              <input
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportJSON}
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn ghost sm"
              style={{ flex: 1 }}
              onClick={handleResetData}
            >
              ↺ Cargar ejemplos (Soles)
            </button>
            <button
              type="button"
              className="btn danger sm"
              style={{ flex: 1 }}
              onClick={handleClearAllData}
            >
              🗑️ Limpiar todo (0 datos)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

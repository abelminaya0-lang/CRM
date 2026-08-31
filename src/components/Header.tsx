import React from 'react';
import { LogoIvaCreativa } from './LogoIvaCreativa';

interface HeaderProps {
  djName: string;
  brandLine: string;
  isFirebaseActive?: boolean;
  isGcalConnected?: boolean;
  isSupabaseConfigured?: boolean;
  onOpenAjustes: () => void;
  onOpenAsistente: () => void;
  onOpenNuevaFecha: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  djName,
  brandLine,
  isFirebaseActive = true,
  isGcalConnected,
  isSupabaseConfigured,
  onOpenAjustes,
  onOpenAsistente,
  onOpenNuevaFecha,
}) => {
  return (
    <header className="top flex items-center justify-between gap-4 flex-wrap mb-6 pb-4 border-b border-[#1f1f2e]">
      <div className="ident flex items-center gap-4">
        {/* Brand Logo */}
        <LogoIvaCreativa size="md" showSubtitle={true} />
      </div>

      <div className="top-actions flex gap-2.5 items-center flex-wrap">
        {/* Cloud Sync & Google Calendar Indicators */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono">
          <button
            type="button"
            onClick={onOpenAjustes}
            className="px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60"
            title="Base de datos en la nube conectada automáticamente (Firebase Firestore)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cloud Sync: Activo ✓</span>
          </button>

          <button
            type="button"
            onClick={onOpenAjustes}
            className={`px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
              isGcalConnected
                ? 'bg-red-950/40 border-red-500/40 text-red-300'
                : 'bg-[#121218] border-[#272738] text-zinc-500 hover:text-zinc-300'
            }`}
            title="Sincronización Google Calendar"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isGcalConnected ? 'bg-red-400 animate-pulse' : 'bg-zinc-600'
              }`}
            />
            <span>{isGcalConnected ? 'Google Calendar ✓' : 'Google Cal'}</span>
          </button>
        </div>

        <button
          className="iconbtn hover:border-[#ef4444] hover:text-white transition-colors"
          onClick={onOpenAjustes}
          title="Ajustes & Conexiones Cloud"
          id="btnAjustes"
        >
          ⚙︎
        </button>

        <button
          className="btn ghost sm border-[#2a2a3c] hover:border-[#ef4444]"
          onClick={onOpenAsistente}
          title="Asistente IA para Guiones & Propuestas"
          id="btnAsistente"
        >
          ✨ <span>IA Guiones & Cierre</span>
        </button>

        <button
          className="btn sm bg-gradient-to-r from-[#ef4444] to-[#b91c1c] text-white font-bold shadow-[0_3px_14px_rgba(239,68,68,0.4)]"
          onClick={onOpenNuevaFecha}
          id="btnNueva"
        >
          ＋ <span>Nuevo Cliente / Rodaje</span>
        </button>
      </div>
    </header>
  );
};

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { LogoIvaCreativa } from './LogoIvaCreativa';

interface HeaderProps {
  djName: string;
  brandLine: string;
  isFirebaseActive?: boolean;
  isGcalConnected?: boolean;
  isSupabaseConfigured?: boolean;
  hidePrices?: boolean;
  onToggleHidePrices?: () => void;
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
  hidePrices = false,
  onToggleHidePrices,
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
        {/* Privacy Eye Toggle Button */}
        {onToggleHidePrices && (
          <button
            type="button"
            onClick={onToggleHidePrices}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
              hidePrices
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-900/50 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                : 'bg-[#14141e] border-[#2a2a3c] text-zinc-300 hover:text-white hover:border-[#ef4444]'
            }`}
            title={hidePrices ? 'Precios Ocultos (Haz clic para mostrar montos)' : 'Ocultar Precios / Modo Privacidad'}
            id="btnPrivacyEye"
          >
            {hidePrices ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono text-[11px]">Oculto ••••</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[11px] hidden sm:inline">Privacidad</span>
              </>
            )}
          </button>
        )}

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

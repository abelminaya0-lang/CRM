import React from 'react';

interface HeaderProps {
  djName: string;
  brandLine: string;
  onOpenAjustes: () => void;
  onOpenAsistente: () => void;
  onOpenNuevaFecha: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  djName,
  brandLine,
  onOpenAjustes,
  onOpenAsistente,
  onOpenNuevaFecha,
}) => {
  const parts = (djName || 'DJ').trim().split(' ');
  let titleNode: React.ReactNode;
  if (parts.length > 1) {
    const last = parts.pop();
    titleNode = (
      <>
        {parts.join(' ')} <span className="hl text-[var(--accent)]">{last}</span>
      </>
    );
  } else {
    titleNode = <span className="hl text-[var(--accent)]">{djName || 'DJ'}</span>;
  }

  return (
    <div className="top flex items-center justify-between gap-[14px] flex-wrap mb-[22px]">
      <div className="ident flex flex-col gap-1">
        <div className="brand flex items-center gap-[9px] text-[var(--muted)] font-mono text-[11px] tracking-[.18em] uppercase">
          <span className="dot w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]"></span>
          <span>{brandLine || 'CRM · Cuenca Content'}</span>
          <span className="sync-chip inline-flex items-center gap-1.5 ml-1.5 px-[9px] py-[3px] border border-[var(--line)] rounded-[20px] bg-[var(--panel)] text-[10px] tracking-[.06em]">
            <span className="sc-dot w-[7px] h-[7px] rounded-full bg-[var(--high)]"></span>
            <span className="sc-txt text-[var(--ink)]">Guardado local</span>
          </span>
        </div>
        <h1 className="font-anton font-normal leading-[.9] tracking-[.01em] text-[clamp(30px,7vw,50px)] uppercase">
          {titleNode}
        </h1>
      </div>
      <div className="top-actions flex gap-2.5 items-center">
        <button
          className="iconbtn"
          onClick={onOpenAjustes}
          title="Ajustes"
          id="btnAjustes"
        >
          ⚙︎
        </button>
        <button
          className="btn ghost sm"
          onClick={onOpenAsistente}
          title="Asistente IA"
          id="btnAsistente"
        >
          ✨ <span>Asistente</span>
        </button>
        <button
          className="btn ghost sm"
          onClick={onOpenNuevaFecha}
          id="btnNueva"
        >
          ＋ <span>Nueva fecha</span>
        </button>
      </div>
    </div>
  );
};

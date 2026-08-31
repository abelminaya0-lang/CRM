import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const LogoIvaCreativa: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const heights = {
    sm: { h: 32, scale: 0.8 },
    md: { h: 44, scale: 1 },
    lg: { h: 64, scale: 1.4 },
  };

  const { h } = heights[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* SVG Icon & Badge matching user's 3D Red & Black IVA CREATIVA Logo */}
      <svg
        viewBox="0 0 240 160"
        height={h}
        className="w-auto filter drop-shadow-[0_2px_10px_rgba(225,29,72,0.35)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="glossBlack" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2c2c34" />
            <stop offset="35%" stopColor="#121218" />
            <stop offset="70%" stopColor="#08080c" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>

          <linearGradient id="glossBlackHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="25%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="redBrand" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff2a4b" />
            <stop offset="50%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>

          <linearGradient id="redGleam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff758c" />
            <stop offset="50%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#881337" />
          </linearGradient>

          <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Letter 'I' (3D Black with Red Bevel) */}
        <g>
          {/* 3D Extrusion Side (Red) */}
          <path d="M42 38 L48 42 L48 122 L42 120 Z" fill="url(#redBrand)" />
          {/* Main Block Face */}
          <rect x="20" y="38" width="22" height="82" rx="2" fill="url(#glossBlack)" stroke="#000000" strokeWidth="1.5" />
          {/* Gloss overlay */}
          <path d="M20 38 L35 38 L25 120 L20 120 Z" fill="url(#glossBlackHighlight)" opacity="0.35" />
          <rect x="20" y="38" width="22" height="82" rx="2" stroke="url(#redBrand)" strokeWidth="1" opacity="0.6" />
        </g>

        {/* Letter 'V' with Camera Operator Silhouette */}
        <g>
          {/* 3D Red bevel inner edge */}
          <path d="M86 46 L104 106 L122 46 L113 46 L104 90 L95 46 Z" fill="url(#redBrand)" />
          {/* Main V */}
          <path d="M72 44 L98 122 L110 122 L136 44 L114 44 L104 88 L94 44 Z" fill="url(#glossBlack)" stroke="#000000" strokeWidth="2" />
          {/* Red Edge on V */}
          <path d="M98 122 L104 122 L100 114 Z" fill="url(#redBrand)" />

          {/* Camera Operator / Head on top of V */}
          <circle cx="118" cy="34" r="14" fill="url(#glossBlack)" stroke="#000000" strokeWidth="1.5" />
          <circle cx="116" cy="30" r="5" fill="#ffffff" opacity="0.3" />

          {/* Camera Operator Body reaching to camera */}
          <path d="M106 48 C106 40 124 38 134 46 L154 38 L146 54 Z" fill="url(#glossBlack)" stroke="url(#redBrand)" strokeWidth="1" />

          {/* Cinema / TikTok Video Camera in Red 3D */}
          <g transform="translate(138, 2) rotate(14)">
            {/* Film reels / Reels symbol */}
            <circle cx="12" cy="10" r="8" fill="url(#glossBlack)" stroke="#ffffff" strokeWidth="1" />
            <circle cx="12" cy="10" r="3" fill="#ffffff" />
            <circle cx="28" cy="6" r="10" fill="url(#glossBlack)" stroke="#ffffff" strokeWidth="1" />
            <circle cx="28" cy="6" r="4" fill="#ffffff" />

            {/* Camera Body (Crimson Red) */}
            <rect x="14" y="16" width="34" height="22" rx="3" fill="url(#redBrand)" stroke="#ff4d6d" strokeWidth="1.5" filter="url(#redGlow)" />
            {/* Lens Hood */}
            <path d="M48 20 L62 14 L62 40 L48 34 Z" fill="url(#glossBlack)" stroke="#ffffff" strokeWidth="1" />
            {/* Lens flare */}
            <circle cx="58" cy="27" r="3" fill="#ff4d6d" />
          </g>
        </g>

        {/* Letter 'A' (3D Black with Red Bevel) */}
        <g>
          {/* 3D Red Extrusions */}
          <path d="M178 78 L204 122 L192 122 L180 98 Z" fill="url(#redBrand)" />
          {/* Main A */}
          <path d="M172 44 L142 122 L164 122 L172 98 L198 98 L206 122 L228 122 L198 44 Z" fill="url(#glossBlack)" stroke="#000000" strokeWidth="2" />
          {/* Inner cutout */}
          <path d="M185 62 L176 86 L194 86 Z" fill="#09090b" stroke="url(#redBrand)" strokeWidth="1.5" />
          {/* Red bevel stroke */}
          <path d="M172 98 L198 98 L206 122" stroke="url(#redBrand)" strokeWidth="2.5" />
          {/* Gloss */}
          <path d="M172 44 L198 44 L190 70 L176 70 Z" fill="url(#glossBlackHighlight)" opacity="0.4" />
        </g>

        {/* Red Text: "C R E A T I V A" */}
        <text
          x="120"
          y="142"
          textAnchor="middle"
          fill="url(#redGleam)"
          fontFamily="'Anton', 'Inter', sans-serif"
          fontSize="18"
          letterSpacing="0.48em"
          fontWeight="900"
          filter="url(#redGlow)"
        >
          CREATIVA
        </text>

        {/* Red Line + Dots underneath */}
        <line x1="26" y1="152" x2="105" y2="152" stroke="url(#redBrand)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="114" cy="152" r="3.5" fill="#000000" stroke="url(#redBrand)" strokeWidth="1.5" />
        <circle cx="120" cy="152" r="5" fill="url(#redBrand)" />
        <circle cx="126" cy="152" r="3.5" fill="#000000" stroke="url(#redBrand)" strokeWidth="1.5" />
        <line x1="135" y1="152" x2="214" y2="152" stroke="url(#redBrand)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      {/* Brand Text for Large / Header views */}
      {showSubtitle && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className="font-anton uppercase tracking-wider text-lg sm:text-xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              IVA <span className="text-[#ef4444] font-bold">CREATIVA</span>
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest text-[#fca5a5] bg-[#991b1b]/30 border border-[#dc2626]/50 rounded-full">
              TikTok Agency
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 tracking-wider uppercase">
            Agencia de Videos & Reels para Negocios
          </span>
        </div>
      )}
    </div>
  );
};

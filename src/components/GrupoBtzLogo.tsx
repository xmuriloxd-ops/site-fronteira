import React from 'react';

interface GrupoBtzLogoProps {
  className?: string;
  showText?: boolean;
}

export function GrupoBtzLogo({ className = "h-16", showText = true }: GrupoBtzLogoProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <svg
        viewBox="0 0 450 300"
        className="h-full w-auto select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left Half of the outer rounded rectangle */}
        <path
          d="M 215 18 L 65 18 A 45 45 0 0 0 20 63 L 20 237 A 45 45 0 0 0 65 282 L 215 282"
          stroke="#002075"
          strokeWidth="24"
          strokeLinecap="round"
        />
        {/* Right Half of the outer rounded rectangle */}
        <path
          d="M 235 18 L 385 18 A 45 45 0 0 1 430 63 L 430 237 A 45 45 0 0 1 385 282 L 235 282"
          stroke="#002075"
          strokeWidth="24"
          strokeLinecap="round"
        />

        {/* "G R U P O" spanning the top */}
        <text
          x="225"
          y="105"
          fill="#002075"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
          fontWeight="400"
          fontSize="36"
          textAnchor="middle"
          letterSpacing="24"
        >
          GRUPO
        </text>

        {/* Big "Btz" letters */}
        <g transform="translate(225, 222)">
          {/* 'B' letter */}
          <text
            x="-92"
            y="0"
            fill="#002075"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontWeight="900"
            fontSize="145"
            textAnchor="middle"
          >
            B
          </text>
          {/* 't' letter - red */}
          <text
            x="5"
            y="-5"
            fill="#D60005"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontWeight="900"
            fontSize="145"
            textAnchor="middle"
          >
            t
          </text>
          {/* 'z' letter */}
          <text
            x="95"
            y="0"
            fill="#002075"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontWeight="900"
            fontSize="145"
            textAnchor="middle"
          >
            z
          </text>
        </g>
      </svg>
      {showText && (
        <div className="flex flex-col select-none">
          <span className="text-[#002075] font-black text-2xl tracking-tight leading-none">
            Btz <span className="text-[#D60005] font-light text-xl">Silo</span>
          </span>
          <span className="text-xs text-slate-500 font-mono tracking-widest mt-1 uppercase">
            Controle de Ração
          </span>
        </div>
      )}
    </div>
  );
}

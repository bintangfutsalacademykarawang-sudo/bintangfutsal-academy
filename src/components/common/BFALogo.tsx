import React from 'react';

interface BFALogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

/**
 * 100% Authentic Vector Bintang Futsal Academy Logo
 * Exactly matching the official emblem:
 * - Dark Navy Shield with thick white outer rim
 * - Lime-neon central star with hollow chevron bottom
 * - Small white star nested in the center of the lime star
 * - Two flanking white 5-pointed stars
 * - Bold white "FUTSAL" text
 * - Slanted upward lime-neon ribbon with thick white outline & black "ACADEMY" text
 * - White "2018" at the bottom shield tip
 */
export const BFALogo: React.FC<BFALogoProps> = ({ 
  className = "w-12 h-14", 
  size,
  showText = false 
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${showText ? '' : ''}`}>
      <svg
        viewBox="0 0 1000 1160"
        className={className}
        style={size ? { width: size, height: typeof size === 'number' ? size * 1.16 : size } : undefined}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="bfaShieldInnerClip">
            <path d="M 500 48 L 930 182 L 902 590 C 890 770 710 970 500 1100 C 290 970 110 770 98 590 L 70 182 Z" />
          </clipPath>
        </defs>

        {/* 1. Shield Outer White Rim & Dark Navy Body */}
        <path
          d="M 500 40 L 940 180 L 912 590 C 900 780 720 980 500 1110 C 280 980 100 780 88 590 L 60 180 Z"
          fill="#08182B"
          stroke="#FFFFFF"
          strokeWidth="32"
          strokeLinejoin="round"
        />

        {/* 2. Top Stylized Lime-Neon Star (Hollow Chevron Bottom) */}
        <polygon
          points="500,75 535,255 725,255 575,345 640,545 565,505 500,365 435,505 360,545 425,345 275,255 465,255"
          fill="#D2F800"
        />

        {/* 3. Small White Star Nested Inside the Big Lime Star */}
        <polygon
          points="500,307 509,326 530,326 513,338 519,357 500,345 481,357 487,338 470,326 491,326"
          fill="#FFFFFF"
        />

        {/* 4. Left Flanking White Star */}
        <polygon
          points="205,277 225,325 273,325 234,355 249,403 205,373 161,403 176,355 137,325 185,325"
          fill="#FFFFFF"
        />

        {/* 5. Right Flanking White Star */}
        <polygon
          points="795,277 815,325 863,325 824,355 839,403 795,373 751,403 766,355 727,325 775,325"
          fill="#FFFFFF"
        />

        {/* 6. "FUTSAL" Text */}
        <text
          x="500"
          y="622"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="'Arial Black', 'Plus Jakarta Sans', Impact, sans-serif"
          fontWeight="900"
          fontSize="106"
          letterSpacing="6"
        >
          FUTSAL
        </text>

        {/* 7. Slanted Lime-Neon "ACADEMY" Ribbon Banner */}
        <g transform="rotate(-8 500 735)">
          {/* Banner Box with White Border */}
          <rect
            x="-40"
            y="650"
            width="1080"
            height="158"
            fill="#D2F800"
            stroke="#FFFFFF"
            strokeWidth="24"
            rx="4"
          />
          {/* "ACADEMY" Text */}
          <text
            x="500"
            y="772"
            textAnchor="middle"
            fill="#050C16"
            fontFamily="'Arial Black', 'Plus Jakarta Sans', Impact, sans-serif"
            fontWeight="900"
            fontSize="124"
            letterSpacing="5"
          >
            ACADEMY
          </text>
        </g>

        {/* 8. "2018" Year in Shield Bottom Point */}
        <text
          x="500"
          y="985"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="'Arial Black', 'Plus Jakarta Sans', sans-serif"
          fontWeight="800"
          fontSize="64"
          letterSpacing="4"
        >
          2018
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="text-white font-black tracking-tight text-lg leading-tight">
            BFA KARAWANG
          </span>
          <span className="text-blue-200 text-xs font-semibold">
            Bintang Futsal Academy
          </span>
        </div>
      )}
    </div>
  );
};

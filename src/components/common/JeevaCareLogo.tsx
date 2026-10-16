import React from 'react';
import { BRANDING } from '../../config/branding';

interface JeevaCareLogoProps {
  variant?: 'full' | 'symbol' | 'horizontal';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  inverted?: boolean;
}

export const JeevaCareLogo: React.FC<JeevaCareLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  showTagline = false,
  className = '',
  inverted = false,
}) => {
  // Dimensions map
  const symbolSizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl sm:text-4xl',
  };

  const taglineSizes = {
    xs: 'text-[9px]',
    sm: 'text-[10px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  // Vector Mother & Newborn Symbol SVG
  const LogoSymbol = ({ sizeClass }: { sizeClass: string }) => (
    <div className={`relative shrink-0 flex items-center justify-center ${sizeClass}`} aria-hidden="true">
      <svg
        viewBox="0 0 320 320"
        className="w-full h-full drop-shadow-xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#12304A" />
            <stop offset="50%" stopColor="#0F766E" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
          <linearGradient id="logoLightTeal" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0F766E" />
            <stop offset="100%" stopColor="#2DD4BF" />
          </linearGradient>
        </defs>

        {/* Medical Cross on Upper Right */}
        <g transform="translate(230, 32)">
          <rect x="15" y="0" width="14" height="42" rx="4" fill="#14B8A6" />
          <rect x="1" y="14" width="42" height="14" rx="4" fill="#14B8A6" />
        </g>

        {/* Outer Cradling Leaf / Heart Curve (Left & Bottom) */}
        <path
          d="M 160 55 C 110 60, 70 100, 65 155 C 60 215, 95 260, 160 310 C 165 305, 170 300, 175 292 C 120 250, 93 210, 95 165 C 97 120, 130 85, 165 75 C 163 68, 161 61, 160 55 Z"
          fill="url(#logoTealGrad)"
        />

        {/* Mother Head & Serene Profile */}
        <circle cx="173" cy="100" r="22" fill={inverted ? '#E8F5F3' : '#12304A'} />
        <path
          d="M 173 95 C 180 100, 185 108, 182 118 C 180 125, 174 130, 167 132 C 175 136, 178 142, 175 148 C 168 160, 150 165, 140 168 C 148 155, 155 140, 158 125 C 160 115, 155 108, 148 102 Z"
          fill="url(#logoTealGrad)"
        />

        {/* Cradled Newborn Baby (Facing Mother) */}
        <circle cx="190" cy="182" r="20" fill="#0F766E" />
        <path
          d="M 182 180 C 185 176, 190 174, 195 176 C 198 178, 200 181, 199 185 C 198 189, 194 191, 190 191 C 185 191, 181 186, 182 180 Z"
          fill="#FFFFFF"
          opacity="0.4"
        />

        {/* Protective Cradling Hand & Lower Swaddling Arc */}
        <path
          d="M 160 310 C 200 278, 245 235, 247 175 C 249 145, 235 118, 217 100 C 220 115, 217 132, 208 148 C 199 165, 185 178, 175 190 C 163 203, 150 215, 137 224 C 150 226, 167 221, 180 212 C 193 203, 203 191, 212 177 C 220 205, 197 250, 160 310 Z"
          fill="url(#logoLightTeal)"
        />

        {/* Inner Tender Swaddle Sweep */}
        <path
          d="M 137 224 C 155 245, 181 258, 207 250 C 225 244, 238 228, 243 208 C 238 236, 207 270, 160 308 C 143 278, 137 250, 137 224 Z"
          fill="#0F766E"
          opacity="0.85"
        />
      </svg>
    </div>
  );

  if (variant === 'symbol') {
    return (
      <div className={`inline-flex items-center ${className}`} title={BRANDING.fullName}>
        <LogoSymbol sizeClass={symbolSizes[size]} />
        <span className="sr-only">{BRANDING.name} logo</span>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`} title={BRANDING.fullName}>
        <LogoSymbol sizeClass={symbolSizes[size]} />
        <div className="mt-2">
          <span className={`font-black tracking-tight leading-none ${textSizes[size]}`}>
            <span className={inverted ? 'text-white' : 'text-[#12304A] dark:text-[#F1F5F9]'}>Jeeva</span>
            <span className="text-[#0F766E] dark:text-[#2DD4BF]">Care</span>
          </span>
          {showTagline && (
            <p className={`font-semibold text-[#64748B] dark:text-[#94A3B8] tracking-wide mt-1 ${taglineSizes[size]}`}>
              {BRANDING.tagline}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`} title={BRANDING.fullName}>
      <LogoSymbol sizeClass={symbolSizes[size]} />
      <div className="flex flex-col">
        <span className={`font-black tracking-tight leading-none ${textSizes[size]}`}>
          <span className={inverted ? 'text-white' : 'text-[#12304A] dark:text-[#F1F5F9]'}>Jeeva</span>
          <span className="text-[#0F766E] dark:text-[#2DD4BF]">Care</span>
        </span>
        {showTagline ? (
          <span className={`font-semibold text-[#64748B] dark:text-[#94A3B8] tracking-tight -mt-0.5 ${taglineSizes[size]}`}>
            {BRANDING.tagline}
          </span>
        ) : (
          <span className={`font-medium text-[#64748B] dark:text-[#94A3B8] -mt-0.5 ${taglineSizes[size]}`}>
            Maternal Emergency Network
          </span>
        )}
      </div>
    </div>
  );
};

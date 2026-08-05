import React from 'react';

interface EditoraLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  showText?: boolean;
  variant?: 'dark' | 'light' | 'monochrome';
}

export const EditoraLogo: React.FC<EditoraLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  variant = 'dark',
}) => {
  const sizeMap = {
    sm: { icon: 'h-6', text: 'text-sm font-semibold tracking-[0.2em]', star: 12 },
    md: { icon: 'h-8', text: 'text-lg font-bold tracking-[0.25em]', star: 16 },
    lg: { icon: 'h-12', text: 'text-2xl font-extrabold tracking-[0.3em]', star: 20 },
    xl: { icon: 'h-16', text: 'text-4xl font-extrabold tracking-[0.35em]', star: 28 },
    custom: { icon: '', text: '', star: 16 },
  };

  const isLight = variant === 'light';
  const primaryColor = isLight ? '#FFFFFF' : '#09090B';
  const accentSparkle = '#38BDF8'; // Vibrant cyan/sky accent for sparkles or sleek dark

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Icon Symbol */}
      <div className={`relative ${sizeMap[size].icon} aspect-square flex items-center justify-center`}>
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Main Curved Play-Ribbon Frame */}
          <path
            d="M70 30 C 130 20, 165 45, 165 85 C 165 115, 145 130, 115 145 L 85 160 C 75 165, 65 160, 65 145 L 65 50 C 65 38, 70 30, 70 30 Z"
            fill={primaryColor}
          />
          {/* Inner Play Triangle Cutout */}
          <path
            d="M90 65 L 135 95 L 90 125 Z"
            fill={isLight ? '#09090B' : '#FFFFFF'}
          />
          {/* Back Loop Accent Curve for 3D Ribbon Feel */}
          <path
            d="M 120 135 C 150 120, 165 95, 160 70 C 155 90, 135 110, 110 122 Z"
            fill={isLight ? 'rgba(255,255,255,0.4)' : 'rgba(9,9,11,0.5)'}
          />

          {/* Top Right Sparkle Star 1 */}
          <path
            d="M 170 15 Q 170 30 185 30 Q 170 30 170 45 Q 170 30 155 30 Q 170 30 170 15 Z"
            fill={isLight ? '#38BDF8' : primaryColor}
          />
          {/* Top Right Sparkle Star 2 (Smaller) */}
          <path
            d="M 188 42 Q 188 50 196 50 Q 188 50 188 58 Q 188 50 180 50 Q 188 50 188 42 Z"
            fill={isLight ? '#38BDF8' : primaryColor}
          />
        </svg>
      </div>

      {/* Brand Typography: EDITORA */}
      {showText && (
        <div className={`font-['Space_Grotesk'] uppercase flex items-center ${sizeMap[size].text} ${isLight ? 'text-white' : 'text-neutral-900 dark:text-white'}`}>
          <span>EDITOR</span>
          {/* Custom geometric 'A' without crossbar as in uploaded logo */}
          <span className="inline-block relative ml-[1px]">
            <svg className="h-[0.85em] w-[0.85em] inline-block -mt-1" viewBox="0 0 100 100" fill="currentColor">
              <path d="M 50 10 L 90 90 L 72 90 L 50 40 L 28 90 L 10 90 Z" />
            </svg>
          </span>
        </div>
      )}
    </div>
  );
};

// Content too long for one message. Let me break this into multiple updates starting with the core file structure.

import React from 'react';

export type BadgeType = 'analytics' | 'community' | 'skill' | 'weekly' | 'monthly' | 'achievement' | 'audio' | 'visual' | 'code' | 'writing';

interface BadgeGraphicProps {
  type: BadgeType;
  progress?: number;
  isLocked?: boolean;
  className?: string;
}

export function BadgeGraphic({ type, progress = 0, isLocked = false, className = '' }: BadgeGraphicProps) {
  const baseClasses = `
    ${className}
    relative w-full h-full
  `.trim();

  const commonFilters = `
    <filter id="badgeGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="glow1" />
      <feGaussianBlur stdDeviation="4" result="glow2" />
      <feMerge>
        <feMergeNode in="glow2" />
        <feMergeNode in="glow1" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  `;


  const renderAnalyticsBadge = () => (
    <svg viewBox="0 0 100 100" className={baseClasses}>
      <defs dangerouslySetInnerHTML={{ __html: commonFilters }} />
      <defs>
        <linearGradient id="analyticsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#8B9D83', stopOpacity: 0.9 }} />
          <stop offset="50%" style={{ stopColor: '#4A5D43', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#4A5D43', stopOpacity: 0.9 }} />
        </linearGradient>
        
        <pattern id="dataPattern" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="1" fill="#E5E1D8" fillOpacity="0.1" />
        </pattern>
      </defs>

      <g filter="url(#badgeGlow)">
        <path
          d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z"
          fill="url(#analyticsGradient)"
        />
        <path
          d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z"
          fill="url(#dataPattern)"
          className="animate-pulse"
        />
      </g>

      <g transform="translate(35, 40) scale(0.4)">
        <rect x="0" y="0" width="10" height="40" fill="#F5F2EA" opacity="0.6" />
        <rect x="15" y="10" width="10" height="30" fill="#F5F2EA" opacity="0.6" />
        <rect x="30" y="20" width="10" height="20" fill="#F5F2EA" opacity="0.6" />
        <polyline
          points="0,20 15,35 30,15 45,25"
          fill="none"
          stroke="#F5F2EA"
          strokeWidth="2"
          opacity="0.8"
        />
      </g>

      {[...Array(12)].map((_, i) => (
        <circle
          key={i}
          cx={35 + Math.random() * 30}
          cy={35 + Math.random() * 30}
          r={Math.random() * 1.5 + 0.5}
          fill="#F5F2EA"
          opacity={Math.random() * 0.5 + 0.3}
          className="animate-pulse"
        />
      ))}

      {progress > 0 && (
        <g>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#4A5D43"
            strokeWidth="4"
            strokeOpacity="0.2"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#F5F2EA"
            strokeWidth="3"
            strokeDasharray={`${(progress / 100) * 283} 283`}
            transform="rotate(-90 50 50)"
            className="animate-dash"
          />
        </g>
      )}
    </svg>
  );

  const renderCommunityBadge = () => (
    <svg viewBox="0 0 100 100" className={baseClasses}>
      <defs dangerouslySetInnerHTML={{ __html: commonFilters }} />
      <defs>
        <radialGradient id="communityGradient">
          <stop offset="0%" style={{ stopColor: '#C67D63', stopOpacity: 0.9 }} />
          <stop offset="50%" style={{ stopColor: '#A65D57', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#A65D57', stopOpacity: 0.7 }} />
        </radialGradient>
        
      </defs>

      <g filter="url(#badgeGlow)" className="animate-pulse">
        <circle cx="50" cy="50" r="15" fill="url(#communityGradient)" />
        <g transform="translate(43, 42)">
          <circle cx="7" cy="3" r="3" fill="#F5F2EA" />
          <path d="M7 7 C7 7 3 12 3 13 C3 14 11 14 11 13 C11 12 7 7 7 7" 
                fill="#F5F2EA" />
        </g>
      </g>

      {[0, 72, 144, 216, 288].map((angle, i) => {
        const x = 50 + 30 * Math.cos((angle * Math.PI) / 180);
        const y = 50 + 30 * Math.sin((angle * Math.PI) / 180);
        return (
          <g key={i} className="animate-bounce-slow">
            <circle cx={x} cy={y} r="10" fill="#C67D63" opacity="0.3" />
            <circle cx={x} cy={y} r="8" fill="#A65D57" />
            <g transform={`translate(${x - 4}, ${y - 4})`}>
              <circle cx="4" cy="2" r="2" fill="#F5F2EA" />
              <path d="M4 4 L2 8 L6 8 Z" fill="#F5F2EA" />
            </g>
            <g>
              <line
                x1="50"
                y1="50"
                x2={x}
                y2={y}
                stroke="#D69F4C"
                strokeWidth="3"
                strokeOpacity="0.3"
              />
              <line
                x1="50"
                y1="50"
                x2={x}
                y2={y}
                stroke="#C67D63"
                strokeWidth="2"
                strokeDasharray="4"
                className="animate-dash"
              />
            </g>
          </g>
        );
      })}
      
      {progress > 0 && (
        <g>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#A65D57"
            strokeWidth="4"
            strokeOpacity="0.2"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#F5F2EA"
            strokeWidth="3"
            strokeDasharray={`${(progress / 100) * 283} 283`}
            transform="rotate(-90 50 50)"
            className="animate-dash"
          />
        </g>
      )}
    </svg>
  );

  const renderWeeklyBadge = () => (
    <svg viewBox="0 0 100 100" className={baseClasses}>
      <defs dangerouslySetInnerHTML={{ __html: commonFilters }} />
      <defs>
        <linearGradient id="weeklyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#8B9D83', stopOpacity: 0.9 }} />
          <stop offset="50%" style={{ stopColor: '#8B9D83', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#D69F4C', stopOpacity: 0.9 }} />
        </linearGradient>
        
        <pattern id="weeklyPattern" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="1" fill="#F5F2EA" fillOpacity="0.1" />
        </pattern>
      </defs>

      <g filter="url(#badgeGlow)">
        <circle cx="50" cy="50" r="35" fill="url(#weeklyGradient)" />
        <circle cx="50" cy="50" r="35" fill="url(#weeklyPattern)" />
      </g>

      {/* Calendar icon */}
      <g transform="translate(35, 35)">
        <rect x="0" y="0" width="30" height="30" rx="3" fill="#F5F2EA" opacity="0.9" />
        <rect x="0" y="0" width="30" height="8" rx="3" fill="#D69F4C" />
        {[...Array(5)].map((_, row) => (
          [...Array(7)].map((_, col) => (
            <rect
              key={`${row}-${col}`}
              x={2 + col * 4}
              y={10 + row * 4}
              width="3"
              height="3"
              rx="0.5"
              fill="#C67D63"
              opacity={Math.random() > 0.5 ? "0.3" : "0.1"}
            />
          ))
        ))}
        <rect x="2" y="18" width="26" height="3" fill="#D69F4C" opacity="0.3" />
      </g>

      {/* Sparkle effects */}
      {[...Array(4)].map((_, i) => (
        <g key={i} transform={`rotate(${i * 90} 50 50)`}>
          <circle
            cx="50"
            cy="20"
            r="2"
            fill="#F5F2EA"
            className="animate-ping"
          />
        </g>
      ))}

      {progress > 0 && (
        <g>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#4A5D43"
            strokeWidth="4"
            strokeOpacity="0.2"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#F5F2EA"
            strokeWidth="3"
            strokeDasharray={`${(progress / 100) * 283} 283`}
            transform="rotate(-90 50 50)"
            className="animate-dash"
          />
        </g>
      )}
    </svg>
  );

  const renderMonthlyBadge = () => (
    <svg viewBox="0 0 100 100" className={baseClasses}>
      <defs dangerouslySetInnerHTML={{ __html: commonFilters }} />
      <defs>
        <linearGradient id="medalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#C67D63', stopOpacity: 0.9 }} />
          <stop offset="50%" style={{ stopColor: '#C67D63', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#D69F4C', stopOpacity: 0.9 }} />
        </linearGradient>
        
        <pattern id="medalPattern" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="1" fill="#F5F2EA" fillOpacity="0.1" />
        </pattern>
      </defs>

      <g filter="url(#badgeGlow)">
        <circle cx="50" cy="50" r="40" fill="url(#medalGradient)" />
        <circle cx="50" cy="50" r="40" fill="url(#medalPattern)" />
        <circle cx="48" cy="48" r="38" fill="#F5F2EA" fillOpacity="0.1" />
      </g>

      {/* Crown element */}
      <g transform="translate(35, 30) scale(0.6)" className="animate-float">
        <path
          d="M0,20 L15,0 L30,20 L45,0 L60,20 L45,30 L15,30 Z"
          fill="#D69F4C"
          stroke="#F5F2EA"
          strokeWidth="2"
        />
        {[...Array(3)].map((_, i) => (
          <circle
            key={i}
            cx={15 + (i * 15)}
            cy="10"
            r="3"
            fill="#A65D57"
            className="animate-pulse"
          />
        ))}
      </g>

      {/* Medal ribbons */}
      <g transform="translate(50, 70)">
        <path
          d="M-10,0 Q-5,10 0,0 Q5,10 10,0"
          stroke="#C67D63"
          strokeWidth="3"
          fill="none"
          className="animate-wave"
        />
      </g>

      {progress > 0 && (
        <g>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#A65D57"
            strokeWidth="4"
            strokeOpacity="0.2"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#F5F2EA"
            strokeWidth="3"
            strokeDasharray={`${(progress / 100) * 283} 283`}
            transform="rotate(-90 50 50)"
            className="animate-dash"
          />
        </g>
      )}
    </svg>
  );

  const renderSkillBadge = () => (
    <svg viewBox="0 0 100 100" className={baseClasses}>
      <defs dangerouslySetInnerHTML={{ __html: commonFilters }} />
      <defs>
        <linearGradient id="skillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#8B9D83', stopOpacity: 0.9 }} />
          <stop offset="50%" style={{ stopColor: '#4A5D43', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#4A5D43', stopOpacity: 0.9 }} />
        </linearGradient>
        
        <pattern id="skillPattern" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M0,5 L10,5 M5,0 L5,10" stroke="#F5F2EA" strokeWidth="0.5" opacity="0.2" />
        </pattern>
      </defs>

      <g filter="url(#badgeGlow)">
        <path
          d="M50,10 L90,50 L50,90 L10,50 Z"
          fill="url(#skillGradient)"
        />
        <path
          d="M50,10 L90,50 L50,90 L10,50 Z"
          fill="url(#skillPattern)"
          className="animate-pulse"
        />
        <path
          d="M48,12 L85,50 L48,88 L12,50 Z"
          fill="#F5F2EA"
          fillOpacity="0.1"
        />
      </g>

      {/* Skill elements */}
      <g className="animate-spin-slow">
        {[0, 72, 144, 216, 288].map((angle, i) => {
          const x = 50 + 25 * Math.cos((angle * Math.PI) / 180);
          const y = 50 + 25 * Math.sin((angle * Math.PI) / 180);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="7"
                fill="#8B9D83"
                opacity="0.3"
              />
              <circle
                cx={x}
                cy={y}
                r="5"
                fill="#4A5D43"
              />
              <path
                d={
                  i % 3 === 0
                    ? `M${x-3},${y-3} L${x+3},${y+3} M${x-3},${y+3} L${x+3},${y-3}`
                    : i % 3 === 1
                    ? `M${x-3},${y} L${x+3},${y} M${x},${y-3} L${x},${y+3}`
                    : `M${x},${y} m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0`
                }
                stroke="#F5F2EA"
                strokeWidth="1"
                fill="none"
              />
            </g>
          );
        })}
      </g>

      {progress > 0 && (
        <g>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#4A5D43"
            strokeWidth="4"
            strokeOpacity="0.2"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#F5F2EA"
            strokeWidth="3"
            strokeDasharray={`${(progress / 100) * 283} 283`}
            transform="rotate(-90 50 50)"
            className="animate-dash"
          />
        </g>
      )}
    </svg>
  );

  const renderAudioBadge = () => (
    <svg viewBox="0 0 100 100" className={baseClasses}>
      <defs dangerouslySetInnerHTML={{ __html: commonFilters }} />
      <defs>
        <linearGradient id="audioGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#D69F4C', stopOpacity: 0.9 }} />
          <stop offset="50%" style={{ stopColor: '#C67D63', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#A65D57', stopOpacity: 0.9 }} />
        </linearGradient>
      </defs>

      <g filter="url(#badgeGlow)">
        <circle cx="50" cy="50" r="40" fill="url(#audioGradient)" />
      </g>

      {/* Minimalist Headphone design */}
      <g transform="translate(30, 30)" className="animate-float">
        {/* Thinner headband */}
        <path
          d="M0,20 C0,8 10,0 20,0 C30,0 40,8 40,20"
          fill="none"
          stroke="#F5F2EA"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Left cup */}
        <g transform="translate(2, 18)">
          <circle cx="0" cy="0" r="10" fill="#F5F2EA" opacity="0.9"/>
          <circle cx="0" cy="0" r="6" fill="#A65D57" opacity="0.6"/>
        </g>
        {/* Right cup */}
        <g transform="translate(38, 18)">
          <circle cx="0" cy="0" r="10" fill="#F5F2EA" opacity="0.9"/>
          <circle cx="0" cy="0" r="6" fill="#A65D57" opacity="0.6"/>
        </g>
      </g>

      {/* Audio waveform */}
      {[...Array(8)].map((_, i) => (
        <rect
          key={i}
          x={30 + i * 6}
          y={50 - Math.abs(Math.sin(i * 0.5) * 15)}
          width="3"
          height={Math.abs(Math.sin(i * 0.5) * 30)}
          fill="#F5F2EA"
          opacity={0.8 - i * 0.1}
          className="animate-pulse"
        />
      ))}

      {/* Music notes */}
      {[...Array(3)].map((_, i) => (
        <g key={i} className="animate-float" style={{ animationDelay: `${i * 0.3}s` }}>
          <text
            x={35 + i * 15}
            y={30 + i * 5}
            fontSize="12"
            fill="#F5F2EA"
            opacity="0.6"
          >
            ♪
          </text>
        </g>
      ))}

      {progress > 0 && (
        <g>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#A65D57"
            strokeWidth="4"
            strokeOpacity="0.2"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#F5F2EA"
            strokeWidth="3"
            strokeDasharray={`${(progress / 100) * 283} 283`}
            transform="rotate(-90 50 50)"
            className="animate-dash"
          />
        </g>
      )}
    </svg>
  );

  const renderVisualBadge = () => (
    <svg viewBox="0 0 100 100" className={baseClasses}>
      <defs dangerouslySetInnerHTML={{ __html: commonFilters }} />
      <defs>
        <linearGradient id="visualGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#C67D63', stopOpacity: 0.9 }} />
          <stop offset="50%" style={{ stopColor: '#C67D63', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#D69F4C', stopOpacity: 0.9 }} />
        </linearGradient>
      </defs>

      <g filter="url(#badgeGlow)">
        <path
          d="M50,10 L90,40 L75,85 L25,85 L10,40 Z"
          fill="url(#visualGradient)"
        />
      </g>

      {/* Camera lens */}
      <g transform="translate(50,50)">
        {[20, 15, 10, 5].map((r, i) => (
          <circle
            key={i}
            r={r}
            fill={i === 3 ? '#F5F2EA' : 'none'}
            stroke="#F5F2EA"
            strokeWidth={3 - i * 0.5}
            opacity={0.8 - i * 0.1}
          />
        ))}
      </g>

      {/* Aperture blades */}
      <g className="animate-spin-slow">
        {[...Array(6)].map((_, i) => {
          const angle = (i * 60 * Math.PI) / 180;
          return (
            <path
              key={i}
              d={`M50,50 L${50 + 25 * Math.cos(angle)},${
                50 + 25 * Math.sin(angle)
              }`}
              stroke="#F5F2EA"
              strokeWidth="2"
              strokeOpacity="0.5"
            />
          );
        })}
      </g>

      {progress > 0 && (
        <g>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#A65D57"
            strokeWidth="4"
            strokeOpacity="0.2"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#F5F2EA"
            strokeWidth="3"
            strokeDasharray={`${(progress / 100) * 283} 283`}
            transform="rotate(-90 50 50)"
            className="animate-dash"
          />
        </g>
      )}
    </svg>
  );

  const renderCodeBadge = () => (
    <svg viewBox="0 0 100 100" className={baseClasses}>
      <defs dangerouslySetInnerHTML={{ __html: commonFilters }} />
      <defs>
        <linearGradient id="codeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#8B9D83', stopOpacity: 0.9 }} />
          <stop offset="50%" style={{ stopColor: '#4A5D43', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#4A5D43', stopOpacity: 0.9 }} />
        </linearGradient>
      </defs>

      <g filter="url(#badgeGlow)">
        <rect
          x="15"
          y="20"
          width="70"
          height="60"
          rx="5"
          fill="url(#codeGradient)"
        />

        {/* Window controls */}
        <circle cx="25" cy="30" r="3" fill="#E5E1D8" opacity="0.8" />
        <circle cx="35" cy="30" r="3" fill="#D69F4C" opacity="0.8" />
        <circle cx="45" cy="30" r="3" fill="#8B9D83" opacity="0.8" />
      </g>

      {/* Code lines */}
      <g className="animate-pulse">
        {[...Array(4)].map((_, i) => (
          <g key={i}>
            <rect
              x="25"
              y={45 + i * 8}
              width={35 - i * 8}
              height="3"
              rx="1"
              fill="#F5F2EA"
              opacity={0.8 - i * 0.1}
            />
            {i < 2 && (
              <rect
                x={65 - i * 5}
                y={45 + i * 8}
                width="10"
                height="3"
                rx="1"
                fill="#D69F4C"
                opacity={0.6}
              />
            )}
          </g>
        ))}
      </g>

      {/* Brackets */}
      <g className="animate-pulse">
        <text x="20" y="70" fontSize="24" fill="#F5F2EA" opacity="0.6">
          {'<'}
        </text>
        <text x="70" y="70" fontSize="24" fill="#F5F2EA" opacity="0.6">
          {'>'}
        </text>
      </g>

      {progress > 0 && (
        <g>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#4A5D43"
            strokeWidth="4"
            strokeOpacity="0.2"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#F5F2EA"
            strokeWidth="3"
            strokeDasharray={`${(progress / 100) * 283} 283`}
            transform="rotate(-90 50 50)"
            className="animate-dash"
          />
        </g>
      )}
    </svg>
  );

  const renderWritingBadge = () => (
    <svg viewBox="0 0 100 100" className={baseClasses}>
      <defs dangerouslySetInnerHTML={{ __html: commonFilters }} />
      <defs>
        <linearGradient id="writingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#F5F2EA', stopOpacity: 0.9 }} />
          <stop offset="50%" style={{ stopColor: '#E5E1D8', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#A65D57', stopOpacity: 0.9 }} />
        </linearGradient>
      </defs>

      <g filter="url(#badgeGlow)">
        <path
          d="M25,20 C25,15 30,10 40,10 L75,10 L75,80 C75,85 70,90 65,90 L25,90 L25,20"
          fill="url(#writingGradient)"
        />
        <path
          d="M25,90 L25,85 C25,80 30,75 35,75 L65,75 C70,75 75,70 75,65"
          fill="none"
          stroke="#F5F2EA"
          strokeWidth="1"
          opacity="0.3"
        />
      </g>

      {/* Text lines */}
      {[...Array(5)].map((_, i) => (
        <rect
          key={i}
          x="35"
          y={25 + i * 10}
          width={30 - (i % 2) * 10}
          height="2"
          rx="1"
          fill="#4A5D43"
          opacity={0.8 - i * 0.1}
          className="animate-pulse"
        />
      ))}

      {/* Quill */}
      <g transform="translate(40,40) rotate(-45)" className="animate-float">
        <path
          d="M0,0 C5,-5 10,-5 15,0 L5,20 L0,20 Z"
          fill="#D69F4C"
          stroke="#A65D57"
          strokeWidth="1"
        />
        <path
          d="M5,20 L5,25 L0,30"
          stroke="#D69F4C"
          strokeWidth="1"
          fill="none"
        />
      </g>

      {progress > 0 && (
        <g>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#A65D57"
            strokeWidth="4"
            strokeOpacity="0.2"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#F5F2EA"
            strokeWidth="3"
            strokeDasharray={`${(progress / 100) * 283} 283`}
            transform="rotate(-90 50 50)"
            className="animate-dash"
          />
        </g>
      )}
    </svg>
  );

  const renderAchievementBadge = () => (
    <svg viewBox="0 0 100 100" className={baseClasses}>
      <defs dangerouslySetInnerHTML={{ __html: commonFilters }} />
      <defs>
        <linearGradient id="achievementGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#D69F4C', stopOpacity: 0.9 }} />
          <stop offset="50%" style={{ stopColor: '#C67D63', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#A65D57', stopOpacity: 0.9 }} />
        </linearGradient>
      </defs>

      <g filter="url(#badgeGlow)">
        <path
          d="M50,10 L80,25 L80,60 C80,75 65,85 50,90 C35,85 20,75 20,60 L20,25 Z"
          fill="url(#achievementGradient)"
        />
      </g>

      {/* Central star */}
      <g transform="translate(50,50)" className="animate-pulse">
        <path
          d="M0,-20 L6,-6 L20,-6 L9,2 L14,16 L0,8 L-14,16 L-9,2 L-20,-6 L-6,-6 Z"
          fill="#F5F2EA"
          stroke="#A65D57"
          strokeWidth="1"
        />
      </g>

      {/* Rays */}
      <g className="animate-spin-slow">
        {[...Array(8)].map((_, i) => {
          const angle = (i * 45 * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={50 + 25 * Math.cos(angle)}
              y1={50 + 25 * Math.sin(angle)}
              x2={50 + 30 * Math.cos(angle)}
              y2={50 + 30 * Math.sin(angle)}
              stroke="#F5F2EA"
              strokeWidth="2"
              opacity="0.6"
            />
          );
        })}
      </g>

      {/* Sparkles */}
      {[...Array(4)].map((_, i) => {
        const angle = (i * 90 * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={50 + 20 * Math.cos(angle)}
            cy={50 + 20 * Math.sin(angle)}
            r="2"
            fill="#D69F4C"
            className="animate-ping"
          />
        );
      })}

      {progress > 0 && (
        <g>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#A65D57"
            strokeWidth="4"
            strokeOpacity="0.2"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#F5F2EA"
            strokeWidth="3"
            strokeDasharray={`${(progress / 100) * 283} 283`}
            transform="rotate(-90 50 50)"
            className="animate-dash"
          />
        </g>
      )}
    </svg>
  );

  const badgeMap = {
    analytics: renderAnalyticsBadge,
    community: renderCommunityBadge,
    skill: renderSkillBadge,
    weekly: renderWeeklyBadge,
    monthly: renderMonthlyBadge,
    achievement: renderAchievementBadge,
    audio: renderAudioBadge,
    visual: renderVisualBadge,
    code: renderCodeBadge,
    writing: renderWritingBadge
  };

  return badgeMap[type]();
}

import type { UserPet, PetTemplate, PetAccessory } from '../types';

interface PetAvatarProps {
  pet: UserPet | null;
  template?: PetTemplate | null;
  size?: 'small' | 'medium' | 'large';
  activeAccessories?: PetAccessory[];
  style?: React.CSSProperties;
  className?: string;
}

export function PetAvatar({
  pet,
  template,
  size = 'medium',
  activeAccessories = [],
  style,
  className = '',
}: PetAvatarProps) {
  // Determine template code name and stage
  const codeName = pet?.codeName || template?.codeName || 'cyber_cat';
  const level = pet?.level ?? 1;
  const fullness = pet?.fullness ?? 50;

  // Determine stage: baby (1), teen (2-4), adult (5-9), master (10+)
  const getStage = (): 'baby' | 'teen' | 'adult' | 'master' => {
    if (level <= 1) return 'baby';
    if (level >= 2 && level <= 4) return 'teen';
    if (level >= 5 && level <= 9) return 'adult';
    return 'master';
  };

  const stage = getStage();
  const isSleeping = fullness === 0;
  const isSad = fullness < 30 && fullness > 0;
  const isFull = fullness >= 80;

  // Render SVG based on pet code name and growth stage
  const renderPetSvg = () => {
    // Shared styling variables
    const strokeColor = '#1e293b';
    const strokeWidth = 2.5;

    // 1. CYBER CAT
    if (codeName === 'cyber_cat') {
      const primaryColor = '#0ea5e9'; // Cyber Cyan
      const secondaryColor = '#818cf8'; // Neon Indigo
      const visorColor = isSleeping ? '#475569' : isSad ? '#f43f5e' : '#10b981';

      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" className="pet-svg cyber-cat-svg">
          <defs>
            <linearGradient id="cyberGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="100%" stopColor={secondaryColor} />
            </linearGradient>
            <filter id="cyberGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Micro Animations Style Injection */}
          <style>{`
            .cyber-cat-svg .eye { animation: cyber-blink 4s infinite ease-in-out; transform-origin: 50% 50%; }
            .cyber-cat-svg .ears { animation: cyber-ear-wiggle 3s infinite ease-in-out; transform-origin: 50% 30%; }
            .cyber-cat-svg .body { animation: cyber-breath 2s infinite ease-in-out; transform-origin: 50% 80%; }
            .cyber-cat-svg .zzz { animation: zzz-float 3s infinite linear; opacity: 0; }
            @keyframes cyber-blink {
              0%, 90%, 100% { transform: scaleY(1); }
              95% { transform: scaleY(0.1); }
            }
            @keyframes cyber-ear-wiggle {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(3deg); }
            }
            @keyframes cyber-breath {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(${isSad ? 1.015 : isFull ? 1.05 : 1.03}); }
            }
            @keyframes zzz-float {
              0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
              50% { opacity: 0.8; }
              100% { transform: translate(10px, -20px) scale(1.1); opacity: 0; }
            }
          `}</style>

          {/* Render Stage Specific Elements */}
          {stage === 'baby' && (
            <g className="body">
              {/* Cute spherical kitty head */}
              <circle cx="50" cy="50" r="30" fill="url(#cyberGrad)" stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Triangular robotic ears */}
              <polygon points="25,25 38,36 21,38" fill={secondaryColor} stroke={strokeColor} strokeWidth={strokeWidth} className="ears" />
              <polygon points="75,25 62,36 79,38" fill={secondaryColor} stroke={strokeColor} strokeWidth={strokeWidth} className="ears" />
              {/* Visor / Face panel */}
              <rect x="30" y="40" width="40" height="20" rx="8" fill="#1e1e2f" stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Eyes */}
              {!isSleeping ? (
                isFull ? (
                  <>
                    <path d="M37,52 Q40,48 43,52" fill="none" stroke={visorColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                    <path d="M57,52 Q60,48 63,52" fill="none" stroke={visorColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                  </>
                ) : (
                  <>
                    <circle cx="40" cy="50" r="3.5" fill={visorColor} className="eye" />
                    <circle cx="60" cy="50" r="3.5" fill={visorColor} className="eye" />
                  </>
                )
              ) : (
                <>
                  <path d="M37,50 Q40,53 43,50" fill="none" stroke={visorColor} strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M57,50 Q60,53 63,50" fill="none" stroke={visorColor} strokeWidth="2.5" strokeLinecap="round" />
                  <text x="73" y="32" className="zzz" fill="#818cf8" fontSize="12" fontWeight="bold">Z</text>
                  <text x="79" y="24" className="zzz" fill="#818cf8" fontSize="9" fontWeight="bold" style={{ animationDelay: '1s' }}>z</text>
                </>
              )}
              {/* Small mouth */}
              <path d="M48,56 Q50,58 52,56" fill="none" stroke={visorColor} strokeWidth="1.5" strokeLinecap="round" />
            </g>
          )}

          {stage === 'teen' && (
            <g className="body">
              {/* Body */}
              <rect x="35" y="60" width="30" height="25" rx="10" fill="url(#cyberGrad)" stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Paws */}
              <circle cx="40" cy="85" r="6" fill={secondaryColor} stroke={strokeColor} strokeWidth={strokeWidth} />
              <circle cx="60" cy="85" r="6" fill={secondaryColor} stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Head */}
              <circle cx="50" cy="45" r="24" fill="url(#cyberGrad)" stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Ears */}
              <polygon points="30,25 40,34 26,36" fill={secondaryColor} stroke={strokeColor} strokeWidth={strokeWidth} className="ears" />
              <polygon points="70,25 60,34 74,36" fill={secondaryColor} stroke={strokeColor} strokeWidth={strokeWidth} className="ears" />
              {/* Visor */}
              <rect x="34" y="37" width="32" height="16" rx="6" fill="#1e1e2f" stroke={strokeColor} strokeWidth={strokeWidth} />
              {!isSleeping ? (
                isFull ? (
                  <>
                    <path d="M39,47 Q42,43 45,47" fill="none" stroke={visorColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                    <path d="M55,47 Q58,43 61,47" fill="none" stroke={visorColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                  </>
                ) : (
                  <>
                    <circle cx="42" cy="45" r="3" fill={visorColor} className="eye" />
                    <circle cx="58" cy="45" r="3" fill={visorColor} className="eye" />
                  </>
                )
              ) : (
                <>
                  <path d="M39,45 Q42,47 45,45" fill="none" stroke={visorColor} strokeWidth="2" strokeLinecap="round" />
                  <path d="M55,45 Q58,47 61,45" fill="none" stroke={visorColor} strokeWidth="2" strokeLinecap="round" />
                  <text x="70" y="30" className="zzz" fill="#818cf8" fontSize="12" fontWeight="bold">Z</text>
                </>
              )}
              {/* Small glowing power button/heart on body */}
              <circle cx="50" cy="70" r="4" fill={isFull ? '#f43f5e' : '#fbbf24'} style={{ animation: `cyber-breath ${isFull ? '0.7s' : '1.5s'} infinite alternate` }} />
            </g>
          )}

          {stage === 'adult' && (
            <g className="body">
              {/* Back wires/tails */}
              <path d="M30,75 C20,70 15,85 10,80" fill="none" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" />
              {/* Paws/Feet */}
              <rect x="32" y="80" width="12" height="10" rx="4" fill={secondaryColor} stroke={strokeColor} strokeWidth={strokeWidth} />
              <rect x="56" y="80" width="12" height="10" rx="4" fill={secondaryColor} stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Main Body */}
              <rect x="30" y="50" width="40" height="32" rx="12" fill="url(#cyberGrad)" stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Chest core */}
              <polygon points="50,58 56,64 50,70 44,64" fill={isFull ? '#fbbf24' : '#f43f5e'} style={{ animation: `cyber-breath ${isFull ? '0.6s' : '1s'} infinite alternate` }} />
              {/* Head */}
              <circle cx="50" cy="35" r="22" fill="url(#cyberGrad)" stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Ears */}
              <polygon points="32,15 42,24 28,26" fill={secondaryColor} stroke={strokeColor} strokeWidth={strokeWidth} className="ears" />
              <polygon points="68,15 58,24 72,26" fill={secondaryColor} stroke={strokeColor} strokeWidth={strokeWidth} className="ears" />
              {/* Neon Headband Visor */}
              <rect x="32" y="27" width="36" height="15" rx="5" fill="#1e1e2f" stroke={strokeColor} strokeWidth={strokeWidth} />
              {!isSleeping ? (
                isFull ? (
                  <>
                    <path d="M37,36 Q42,32 47,36" fill="none" stroke={visorColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                    <path d="M53,36 Q58,32 63,36" fill="none" stroke={visorColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                  </>
                ) : (
                  <>
                    <rect x="38" y="32" width="8" height="5" rx="2" fill={visorColor} className="eye" />
                    <rect x="54" y="32" width="8" height="5" rx="2" fill={visorColor} className="eye" />
                  </>
                )
              ) : (
                <>
                  <path d="M37,34 Q42,37 47,34" fill="none" stroke={visorColor} strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M53,34 Q58,37 63,34" fill="none" stroke={visorColor} strokeWidth="2.5" strokeLinecap="round" />
                  <text x="72" y="22" className="zzz" fill="#818cf8" fontSize="12" fontWeight="bold">Z</text>
                </>
              )}
            </g>
          )}

          {stage === 'master' && (
            <g className="body">
              {/* Energy wings */}
              <path d="M25,50 C10,40 -2,65 10,75 C20,70 25,60 25,50 Z" fill="rgba(56, 189, 248, 0.4)" stroke={primaryColor} strokeWidth="2" />
              <path d="M75,50 C90,40 102,65 90,75 C80,70 75,60 75,50 Z" fill="rgba(56, 189, 248, 0.4)" stroke={primaryColor} strokeWidth="2" />
              {/* Body */}
              <rect x="26" y="45" width="48" height="40" rx="15" fill="url(#cyberGrad)" stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Glowing matrix patterns */}
              <line x1="38" y1="55" x2="38" y2="75" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" strokeDasharray="2,2" />
              <line x1="62" y1="55" x2="62" y2="75" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" strokeDasharray="2,2" />
              {/* Head */}
              <circle cx="50" cy="30" r="22" fill="url(#cyberGrad)" stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Mane triangles representing a mecha lion */}
              <polygon points="26,22 34,14 30,30" fill={secondaryColor} stroke={strokeColor} strokeWidth="1.5" />
              <polygon points="74,22 66,14 70,30" fill={secondaryColor} stroke={strokeColor} strokeWidth="1.5" />
              <polygon points="50,6 56,16 44,16" fill={secondaryColor} stroke={strokeColor} strokeWidth="1.5" />
              {/* Head visor */}
              <rect x="32" y="22" width="36" height="15" rx="5" fill="#1e293b" stroke={strokeColor} strokeWidth={strokeWidth} />
              {!isSleeping ? (
                isFull ? (
                  <>
                    <path d="M37,31 Q42,27 47,31" fill="none" stroke={visorColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                    <path d="M53,31 Q58,27 63,31" fill="none" stroke={visorColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                  </>
                ) : (
                  <>
                    <polygon points="38,27 46,27 42,32" fill={visorColor} className="eye" />
                    <polygon points="54,27 62,27 58,32" fill={visorColor} className="eye" />
                  </>
                )
              ) : (
                <>
                  <path d="M37,29 Q42,32 47,29" fill="none" stroke={visorColor} strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M53,29 Q58,32 63,29" fill="none" stroke={visorColor} strokeWidth="2.5" strokeLinecap="round" />
                  <text x="75" y="16" className="zzz" fill="#818cf8" fontSize="12" fontWeight="bold">Z</text>
                </>
              )}
            </g>
          )}
        </svg>
      );
    }

    // 2. PY DRAGON
    if (codeName === 'py_dragon') {
      const primaryColor = '#10b981'; // Green scale
      const secondaryColor = '#f59e0b'; // Gold belly/flame

      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" className="pet-svg py-dragon-svg">
          <defs>
            <linearGradient id="dragonGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="fireGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>

          <style>{`
            .py-dragon-svg .eye { animation: dragon-blink 3.5s infinite ease-in-out; transform-origin: 50% 50%; }
            .py-dragon-svg .wing { animation: dragon-wing-flap 0.6s infinite ease-in-out alternate; }
            .py-dragon-svg .body { animation: dragon-breath 2.5s infinite ease-in-out; transform-origin: 50% 85%; }
            .py-dragon-svg .egg { animation: ${isFull ? 'egg-wiggle-happy 1.5s infinite ease-in-out' : 'egg-wiggle 3s infinite ease-in-out'}; transform-origin: 50% 80%; }
            .py-dragon-svg .flame { animation: fire-flicker 0.4s infinite alternate ease-in-out; transform-origin: 50% 50%; }
            .py-dragon-svg .zzz { animation: zzz-float 3s infinite linear; opacity: 0; }
            @keyframes dragon-blink {
              0%, 90%, 100% { transform: scaleY(1); }
              93% { transform: scaleY(0.1); }
            }
            @keyframes dragon-wing-flap {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(-8deg); }
            }
            @keyframes dragon-breath {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(${isSad ? 1.01 : isFull ? 1.045 : 1.025}) translateY(${isSad ? '0px' : '-1px'}); }
            }
            @keyframes egg-wiggle {
              0%, 100% { transform: rotate(0deg); }
              45% { transform: rotate(-4deg); }
              50% { transform: rotate(4deg); }
              55% { transform: rotate(-2deg); }
              60% { transform: rotate(0deg); }
            }
            @keyframes egg-wiggle-happy {
              0%, 100% { transform: rotate(0deg) scale(1); }
              25% { transform: rotate(-10deg) scale(1.05); }
              75% { transform: rotate(10deg) scale(1.05); }
            }
            @keyframes fire-flicker {
              0% { transform: scale(${isFull ? 1.25 : isSad ? 0.65 : 0.9}) rotate(-2deg); opacity: 0.9; }
              100% { transform: scale(${isFull ? 1.55 : isSad ? 0.85 : 1.1}) rotate(2deg); opacity: 1; }
            }
          `}</style>

          {stage === 'baby' && (
            <g className="egg">
              {/* Cracked dragon egg */}
              <ellipse cx="50" cy="55" rx="25" ry="32" fill="#e2e8f0" stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Egg patterns */}
              <circle cx="38" cy="42" r="4" fill="rgba(16, 185, 129, 0.2)" />
              <circle cx="62" cy="70" r="5" fill="rgba(16, 185, 129, 0.2)" />
              {/* Crack path */}
              <path d="M32,45 L42,50 L48,42 L56,52 L62,40 L68,48" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
              {/* Little cute eyes peeking from the crack */}
              {!isSleeping ? (
                isFull ? (
                  <>
                    <path d="M41,48 Q44,44 47,48" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                    <path d="M53,48 Q56,44 59,48" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                  </>
                ) : isSad ? (
                  <>
                    <circle cx="45" cy="46" r="2" fill="#1e293b" className="eye" />
                    <circle cx="55" cy="46" r="2" fill="#1e293b" className="eye" />
                    <path d="M39,49 C39,52 37,52 37,49 C37,47 39,46 39,49" fill="#38bdf8" />
                  </>
                ) : (
                  <>
                    <circle cx="45" cy="46" r="3" fill="#1e293b" className="eye" />
                    <circle cx="55" cy="46" r="3" fill="#1e293b" className="eye" />
                    <circle cx="44" cy="45" r="1" fill="#fff" />
                    <circle cx="54" cy="45" r="1" fill="#fff" />
                  </>
                )
              ) : (
                <>
                  <path d="M42,46 Q45,48 48,46" fill="none" stroke={strokeColor} strokeWidth="1.5" />
                  <path d="M52,46 Q55,48 58,46" fill="none" stroke={strokeColor} strokeWidth="1.5" />
                  <text x="73" y="32" className="zzz" fill="#10b981" fontSize="12" fontWeight="bold">Z</text>
                </>
              )}
            </g>
          )}

          {stage === 'teen' && (
            <g className="body">
              {/* Tail */}
              <path d="M62,75 Q75,82 72,70" fill="none" stroke={primaryColor} strokeWidth="7" strokeLinecap="round" />
              {/* Little wing */}
              <path d="M34,62 C26,58 20,66 28,70 Z" fill="#047857" stroke={strokeColor} strokeWidth={strokeWidth} className="wing" style={{ transformOrigin: '34px 62px' }} />
              {/* Body */}
              <ellipse cx="50" cy="70" rx="18" ry="15" fill="url(#dragonGrad)" stroke={strokeColor} strokeWidth={strokeWidth} />
              <ellipse cx="48" cy="70" rx="10" ry="11" fill={secondaryColor} />
              {/* Head */}
              <circle cx="46" cy="46" r="15" fill="url(#dragonGrad)" stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Horn */}
              <path d="M52,33 Q58,26 55,24" fill="none" stroke={secondaryColor} strokeWidth="3.5" strokeLinecap="round" />
              {!isSleeping ? (
                isFull ? (
                  <>
                    <path d="M39,46 Q42,42 45,46" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                    <path d="M49,46 Q52,42 55,46" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                  </>
                ) : isSad ? (
                  <>
                    <path d="M39,43 L44,46" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                    <path d="M55,43 L50,46" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                  </>
                ) : (
                  <>
                    <circle cx="42" cy="44" r="2.5" fill="#1e293b" className="eye" />
                    <circle cx="52" cy="44" r="2.5" fill="#1e293b" className="eye" />
                    <circle cx="41.5" cy="43" r="0.8" fill="#fff" />
                  </>
                )
              ) : (
                <>
                  <path d="M39,44 Q42,46 45,44" fill="none" stroke={strokeColor} strokeWidth="1.5" />
                  <path d="M49,44 Q52,46 55,44" fill="none" stroke={strokeColor} strokeWidth="1.5" />
                  <text x="66" y="30" className="zzz" fill="#10b981" fontSize="12" fontWeight="bold">Z</text>
                </>
              )}
              {/* Cheeks */}
              <circle cx="37" cy="48" r="2" fill="#f43f5e" opacity="0.6" />
              {/* Tiny fire spark */}
              {!isSleeping && (
                <path d="M46,55 Q50,48 54,55 Z" fill="url(#fireGrad)" className="flame" style={{ transformOrigin: '50px 52px' }} />
              )}
              {/* Glowing heart/power button on body */}
              <circle cx="50" cy="70" r="4" fill={isFull ? '#f43f5e' : '#fbbf24'} style={{ animation: `cyber-breath ${isFull ? '0.8s' : '1.5s'} infinite alternate` }} />
            </g>
          )}

          {stage === 'adult' && (
            <g className="body">
              {/* Tail with flame tail tip */}
              <path d="M65,70 Q80,82 78,64" fill="none" stroke={primaryColor} strokeWidth="10" strokeLinecap="round" />
              <path d="M78,64 C82,60 84,54 80,50 C76,54 74,60 78,64 Z" fill="url(#fireGrad)" className="flame" />
              {/* Left Wing */}
              <path d="M28,52 C15,42 8,58 20,64 Z" fill="#047857" stroke={strokeColor} strokeWidth={strokeWidth} className="wing" style={{ transformOrigin: '28px 52px' }} />
              {/* Right Wing */}
              <path d="M68,52 C81,42 88,58 76,64 Z" fill="#047857" stroke={strokeColor} strokeWidth={strokeWidth} className="wing" style={{ transformOrigin: '68px 52px' }} />
              {/* Feet */}
              <ellipse cx="38" cy="84" rx="6" ry="4" fill="#047857" stroke={strokeColor} strokeWidth={strokeWidth} />
              <ellipse cx="58" cy="84" rx="6" ry="4" fill="#047857" stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Main Body */}
              <rect x="32" y="52" width="32" height="30" rx="12" fill="url(#dragonGrad)" stroke={strokeColor} strokeWidth={strokeWidth} />
              <rect x="38" y="58" width="20" height="20" rx="6" fill={secondaryColor} />
              {/* Head */}
              <ellipse cx="48" cy="35" rx="18" ry="16" fill="url(#dragonGrad)" stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Horns */}
              <path d="M54,20 Q64,10 58,8" fill="none" stroke={secondaryColor} strokeWidth="4.5" strokeLinecap="round" />
              <path d="M42,20 Q32,10 38,8" fill="none" stroke={secondaryColor} strokeWidth="4.5" strokeLinecap="round" />
              {!isSleeping ? (
                isFull ? (
                  <>
                    <path d="M37,34 Q40,30 43,34" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                    <path d="M53,34 Q56,30 59,34" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                  </>
                ) : isSad ? (
                  <>
                    <path d="M37,30 L42,33" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                    <path d="M59,30 L54,33" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                  </>
                ) : (
                  <>
                    <circle cx="40" cy="32" r="3" fill="#1e293b" className="eye" />
                    <circle cx="56" cy="32" r="3" fill="#1e293b" className="eye" />
                    <circle cx="39" cy="31" r="1" fill="#fff" />
                    <circle cx="55" cy="31" r="1" fill="#fff" />
                  </>
                )
              ) : (
                <>
                  <path d="M37,33 Q40,35 43,33" fill="none" stroke={strokeColor} strokeWidth="2" />
                  <path d="M53,33 Q56,35 59,33" fill="none" stroke={strokeColor} strokeWidth="2" />
                  <text x="70" y="20" className="zzz" fill="#10b981" fontSize="12" fontWeight="bold">Z</text>
                </>
              )}
              {/* Snout with small fire puff */}
              <ellipse cx="48" cy="40" rx="7" ry="5" fill="#047857" stroke={strokeColor} strokeWidth="1" />
              <circle cx="45" cy="39" r="1" fill="#1e293b" />
              <circle cx="51" cy="39" r="1" fill="#1e293b" />
              {/* Extra fire puff for full dragon */}
              {isFull && !isSleeping && (
                <path d="M44,43 Q48,50 52,43 Z" fill="url(#fireGrad)" className="flame" style={{ transformOrigin: '48px 43px' }} />
              )}
            </g>
          )}

          {stage === 'master' && (
            <g className="body">
              {/* Coiled Serpent body background */}
              <path d="M20,70 Q10,80 30,85 T70,80 T80,60" fill="none" stroke={primaryColor} strokeWidth="15" strokeLinecap="round" />
              <path d="M80,60 C84,54 86,46 80,42 C74,46 72,54 80,60 Z" fill="url(#fireGrad)" className="flame" />
              {/* Huge dragon wings */}
              <path d="M22,42 C-2,20 -10,50 12,60 Z" fill="#047857" stroke={strokeColor} strokeWidth={strokeWidth} className="wing" style={{ transformOrigin: '22px 42px' }} />
              <path d="M74,42 C98,20 106,50 84,60 Z" fill="#047857" stroke={strokeColor} strokeWidth={strokeWidth} className="wing" style={{ transformOrigin: '74px 42px' }} />
              {/* Main Body */}
              <rect x="24" y="42" width="48" height="38" rx="16" fill="url(#dragonGrad)" stroke={strokeColor} strokeWidth={strokeWidth} />
              <rect x="32" y="48" width="32" height="24" rx="8" fill={secondaryColor} />
              {/* Floating coding symbols representing master dragon */}
              <text x="16" y="32" fill="#34d399" fontSize="8" fontFamily="monospace" opacity="0.8">0</text>
              <text x="76" y="32" fill="#34d399" fontSize="8" fontFamily="monospace" opacity="0.8">1</text>
              <text x="82" y="52" fill="#34d399" fontSize="8" fontFamily="monospace" opacity="0.8">x</text>
              {/* Head */}
              <ellipse cx="48" cy="28" rx="20" ry="18" fill="url(#dragonGrad)" stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Majestic crown-like horns */}
              <path d="M56,12 Q72,0 64,-2" fill="none" stroke={secondaryColor} strokeWidth="5" strokeLinecap="round" />
              <path d="M40,12 Q24,0 32,-2" fill="none" stroke={secondaryColor} strokeWidth="5" strokeLinecap="round" />
              <path d="M48,12 L48,2" fill="none" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" />
              {!isSleeping ? (
                isFull ? (
                  <>
                    <path d="M34,28 Q38,24 42,28" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                    <path d="M62,28 Q58,24 54,28" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                  </>
                ) : isSad ? (
                  <>
                    <path d="M34,24 L41,28" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                    <path d="M62,24 L55,28" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                  </>
                ) : (
                  <>
                    <polygon points="34,26 42,22 42,28" fill="#1e293b" className="eye" />
                    <polygon points="62,26 54,22 54,28" fill="#1e293b" className="eye" />
                    <circle cx="40" cy="24" r="1" fill="#fff" />
                    <circle cx="56" cy="24" r="1" fill="#fff" />
                  </>
                )
              ) : (
                <>
                  <path d="M36,26 Q40,29 44,26" fill="none" stroke={strokeColor} strokeWidth="2.5" />
                  <path d="M52,26 Q56,29 60,26" fill="none" stroke={strokeColor} strokeWidth="2.5" />
                  <text x="72" y="14" className="zzz" fill="#10b981" fontSize="12" fontWeight="bold">Z</text>
                </>
              )}
              {/* Extra fire puff for full master dragon */}
              {isFull && !isSleeping && (
                <path d="M46,34 Q50,41 54,34 Z" fill="url(#fireGrad)" className="flame" style={{ transformOrigin: '50px 34px' }} />
              )}
            </g>
          )}
        </svg>
      );
    }

    // 3. ALGORITHM OWL
    if (codeName === 'algorithm_owl') {
      const primaryColor = '#818cf8'; // Lavender/Indigo Owl
      const secondaryColor = '#fcd34d'; // Gold eyes/beak
      const glassesColor = isSleeping ? '#475569' : '#0ea5e9';

      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" className="pet-svg algorithm-owl-svg">
          <defs>
            <linearGradient id="owlGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>

          <style>{`
            .algorithm-owl-svg .eye { animation: owl-blink 5s infinite ease-in-out; transform-origin: 50% 50%; }
            .algorithm-owl-svg .wing-left { animation: owl-flap-left 1.2s infinite ease-in-out alternate; transform-origin: 25% 60%; }
            .algorithm-owl-svg .wing-right { animation: owl-flap-right 1.2s infinite ease-in-out alternate; transform-origin: 75% 60%; }
            .algorithm-owl-svg .body {
              animation: ${isFull ? 'owl-happy-bob 1.5s infinite ease-in-out' : 'owl-breath 3s infinite ease-in-out'};
              transform-origin: 50% 85%;
            }
            .algorithm-owl-svg .zzz { animation: zzz-float 3s infinite linear; opacity: 0; }
            .algorithm-owl-svg .binary-float { animation: binary-float-anim 2.5s infinite ease-in-out; }
            @keyframes owl-blink {
              0%, 90%, 95%, 100% { transform: scaleY(1); }
              92% { transform: scaleY(0.1); }
            }
            @keyframes owl-flap-left {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(10deg); }
            }
            @keyframes owl-flap-right {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(-10deg); }
            }
            @keyframes owl-breath {
              0%, 100% { transform: scale(1) translateY(0); }
              50% { transform: scale(${isSad ? 1.01 : 1.02}) translateY(${isSad ? '0px' : '-1px'}); }
            }
            @keyframes owl-happy-bob {
              0%, 100% { transform: scale(1) rotate(0deg); }
              25% { transform: scale(1.03) rotate(-3deg); }
              75% { transform: scale(1.03) rotate(3deg); }
            }
            @keyframes binary-float-anim {
              0%, 100% { transform: translateY(0); opacity: 0.3; }
              50% { transform: translateY(-5px); opacity: 0.8; }
            }
          `}</style>

          {stage === 'baby' && (
            <g className="body">
              {/* Cracked purple egg shell */}
              <ellipse cx="50" cy="58" rx="24" ry="28" fill="#e2e8f0" stroke={strokeColor} strokeWidth={strokeWidth} />
              <path d="M28,48 L38,53 L45,46 L54,54 L63,44 L72,50" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
              {/* Baby owl head sticking out */}
              <rect x="36" y="24" width="28" height="22" rx="10" fill="url(#owlGrad)" stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Glasses */}
              <circle cx="43" cy="34" r="6" fill="none" stroke={glassesColor} strokeWidth="2" />
              <circle cx="57" cy="34" r="6" fill="none" stroke={glassesColor} strokeWidth="2" />
              <line x1="49" y1="34" x2="51" y2="34" stroke={glassesColor} strokeWidth="2" />
              {!isSleeping ? (
                isFull ? (
                  <>
                    <path d="M40,34 Q43,31 46,34" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" className="eye" />
                    <path d="M54,34 Q57,31 60,34" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" className="eye" />
                    <polygon points="50,37 52,41 48,41" fill={secondaryColor} />
                  </>
                ) : isSad ? (
                  <>
                    <path d="M41,33 L45,35" fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" className="eye" />
                    <path d="M59,33 L55,35" fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" className="eye" />
                    <polygon points="50,37 52,41 48,41" fill={secondaryColor} />
                  </>
                ) : (
                  <>
                    <circle cx="43" cy="34" r="2.5" fill="#1e293b" className="eye" />
                    <circle cx="57" cy="34" r="2.5" fill="#1e293b" className="eye" />
                    <polygon points="50,37 52,41 48,41" fill={secondaryColor} />
                  </>
                )
              ) : (
                <>
                  <path d="M41,34 Q43,36 45,34" fill="none" stroke={strokeColor} strokeWidth="1.5" />
                  <path d="M55,34 Q57,36 59,34" fill="none" stroke={strokeColor} strokeWidth="1.5" />
                  <polygon points="50,37 52,41 48,41" fill={secondaryColor} />
                  <text x="68" y="22" className="zzz" fill="#818cf8" fontSize="12" fontWeight="bold">Z</text>
                </>
              )}
            </g>
          )}

          {stage === 'teen' && (
            <g className="body">
              {/* Stack of books she sits on */}
              <rect x="25" y="76" width="50" height="12" rx="4" fill="#d97706" stroke={strokeColor} strokeWidth={strokeWidth} />
              <rect x="28" y="70" width="44" height="8" rx="2" fill="#cbd5e1" stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Left wing */}
              <path d="M26,50 C18,52 14,64 22,68 Z" fill="#4f46e5" stroke={strokeColor} strokeWidth={strokeWidth} className="wing-left" />
              {/* Right wing */}
              <path d="M74,50 C82,52 86,64 78,68 Z" fill="#4f46e5" stroke={strokeColor} strokeWidth={strokeWidth} className="wing-right" />
              {/* Body */}
              <rect x="28" y="44" width="44" height="28" rx="14" fill="url(#owlGrad)" stroke={strokeColor} strokeWidth={strokeWidth} />
              <circle cx="50" cy="58" r="8" fill="#fff" opacity="0.25" />
              {/* Glasses */}
              <circle cx="42" cy="38" r="8" fill="none" stroke={glassesColor} strokeWidth="2.5" />
              <circle cx="58" cy="38" r="8" fill="none" stroke={glassesColor} strokeWidth="2.5" />
              <line x1="50" y1="38" x2="50" y2="38" stroke={glassesColor} strokeWidth="2.5" />
              {/* Eyes */}
              {!isSleeping ? (
                isFull ? (
                  <>
                    <path d="M39,38 Q42,35 45,38" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" className="eye" />
                    <path d="M55,38 Q58,35 61,38" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" className="eye" />
                  </>
                ) : isSad ? (
                  <>
                    <path d="M39,36 L44,39" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" className="eye" />
                    <path d="M61,36 L56,39" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" className="eye" />
                  </>
                ) : (
                  <>
                    <circle cx="42" cy="38" r="3.5" fill="#1e293b" className="eye" />
                    <circle cx="58" cy="38" r="3.5" fill="#1e293b" className="eye" />
                    <circle cx="40.5" cy="36.5" r="1" fill="#fff" />
                    <circle cx="56.5" cy="36.5" r="1" fill="#fff" />
                  </>
                )
              ) : (
                <>
                  <path d="M39,38 Q42,40 45,38" fill="none" stroke={strokeColor} strokeWidth="2" />
                  <path d="M55,38 Q58,40 61,38" fill="none" stroke={strokeColor} strokeWidth="2" />
                  <text x="70" y="24" className="zzz" fill="#818cf8" fontSize="12" fontWeight="bold">Z</text>
                </>
              )}
              {/* Beak */}
              <polygon points="50,42 53,47 47,47" fill={secondaryColor} />
            </g>
          )}

          {stage === 'adult' && (
            <g className="body">
              {/* Wise Scroll underneath */}
              <rect x="20" y="78" width="60" height="8" rx="3" fill="#fef08a" stroke={strokeColor} strokeWidth={strokeWidth} />
              <circle cx="20" cy="82" r="4" fill="#eab308" />
              <circle cx="80" cy="82" r="4" fill="#eab308" />
              {/* Left Wing */}
              <path d="M24,46 C12,48 8,66 22,70 Z" fill="#4f46e5" stroke={strokeColor} strokeWidth={strokeWidth} className="wing-left" />
              {/* Right Wing */}
              <path d="M76,46 C88,48 92,66 78,70 Z" fill="#4f46e5" stroke={strokeColor} strokeWidth={strokeWidth} className="wing-right" />
              {/* Main Body */}
              <rect x="25" y="40" width="50" height="40" rx="18" fill="url(#owlGrad)" stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Feather details on belly */}
              <path d="M42,56 Q50,60 58,56 M44,64 Q50,68 56,64" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="2" strokeLinecap="round" />
              {/* Head / Eyes overlay (Adult owl has huge distinct glasses) */}
              <ellipse cx="40" cy="30" rx="11" ry="11" fill="none" stroke={glassesColor} strokeWidth="3" />
              <ellipse cx="60" cy="30" rx="11" ry="11" fill="none" stroke={glassesColor} strokeWidth="3" />
              <line x1="51" y1="30" x2="49" y2="30" stroke={glassesColor} strokeWidth="3" />
              {!isSleeping ? (
                isFull ? (
                  <>
                    <path d="M36,30 Q40,26 44,30" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                    <path d="M56,30 Q60,26 64,30" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                  </>
                ) : isSad ? (
                  <>
                    <path d="M36,28 L42,31" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                    <path d="M64,28 L58,31" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                  </>
                ) : (
                  <>
                    <circle cx="40" cy="30" r="5" fill="#1e293b" className="eye" />
                    <circle cx="60" cy="30" r="5" fill="#1e293b" className="eye" />
                    <circle cx="38" cy="28" r="1.5" fill="#fff" />
                    <circle cx="58" cy="28" r="1.5" fill="#fff" />
                  </>
                )
              ) : (
                <>
                  <path d="M36,30 Q40,33 44,30" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M56,30 Q60,33 64,30" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
                  <text x="74" y="16" className="zzz" fill="#818cf8" fontSize="12" fontWeight="bold">Z</text>
                </>
              )}
              {/* Beak */}
              <polygon points="50,34 54,41 46,41" fill={secondaryColor} />
              {/* Floating binary code when full */}
              {isFull && !isSleeping && (
                <>
                  <text x="14" y="28" fill="#a5b4fc" fontSize="8" fontFamily="monospace" className="binary-float">0</text>
                  <text x="78" y="28" fill="#a5b4fc" fontSize="8" fontFamily="monospace" className="binary-float" style={{ animationDelay: '0.8s' }}>1</text>
                </>
              )}
            </g>
          )}

          {stage === 'master' && (
            <g className="body">
              {/* Magic logic circle backdrop */}
              <circle cx="50" cy="45" r="35" fill="none" stroke="rgba(129, 140, 248, 0.15)" strokeWidth="1.5" strokeDasharray="6,4" />
              {/* Master Graduation mortarboard cap */}
              <polygon points="50,4 68,10 50,16 32,10" fill="#1e293b" stroke={strokeColor} strokeWidth="1.5" />
              <rect x="42" y="12" width="16" height="5" fill="#1e293b" />
              <path d="M62,10 L65,20 L68,22" fill="none" stroke={secondaryColor} strokeWidth="1.5" />
              {/* Left Wing */}
              <path d="M22,46 C6,48 0,68 18,72 Z" fill="#4f46e5" stroke={strokeColor} strokeWidth={strokeWidth} className="wing-left" />
              {/* Right Wing */}
              <path d="M78,46 C94,48 100,68 82,72 Z" fill="#4f46e5" stroke={strokeColor} strokeWidth={strokeWidth} className="wing-right" />
              {/* Main Body */}
              <rect x="24" y="36" width="52" height="42" rx="20" fill="url(#owlGrad)" stroke={strokeColor} strokeWidth={strokeWidth} />
              {/* Logic symbols decoration */}
              <path d="M40,54 Q50,58 60,54 M42,62 Q50,66 58,62" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" />
              {/* Master round glasses */}
              <circle cx="38" cy="28" r="10" fill="none" stroke={glassesColor} strokeWidth="3" />
              <circle cx="62" cy="28" r="10" fill="none" stroke={glassesColor} strokeWidth="3" />
              <line x1="48" y1="28" x2="52" y2="28" stroke={glassesColor} strokeWidth="3" />
              {!isSleeping ? (
                isFull ? (
                  <>
                    <path d="M34,28 Q38,21 42,28" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                    <path d="M58,28 Q62,21 66,28" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                  </>
                ) : isSad ? (
                  <>
                    <path d="M34,28 L42,31" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                    <path d="M58,28 L66,31" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" className="eye" />
                  </>
                ) : (
                  <>
                    <circle cx="38" cy="28" r="5" fill="#1e293b" className="eye" />
                    <circle cx="62" cy="28" r="5" fill="#1e293b" className="eye" />
                    <circle cx="36" cy="26" r="1.5" fill="#fff" />
                    <circle cx="60" cy="26" r="1.5" fill="#fff" />
                  </>
                )
              ) : (
                <>
                  <path d="M34,28 Q38,31 42,28" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M58,28 Q62,31 66,28" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
                  <text x="76" y="14" className="zzz" fill="#818cf8" fontSize="12" fontWeight="bold">Z</text>
                </>
              )}
              {/* Beak */}
              <polygon points="50,31 54,37 46,37" fill={secondaryColor} />
              {/* Floating binary code when full */}
              {isFull && !isSleeping && (
                <>
                  <text x="12" y="24" fill="#a5b4fc" fontSize="8" fontFamily="monospace" className="binary-float">0</text>
                  <text x="80" y="24" fill="#a5b4fc" fontSize="8" fontFamily="monospace" className="binary-float" style={{ animationDelay: '0.8s' }}>1</text>
                </>
              )}
            </g>
          )}
        </svg>
      );
    }

    // FALLBACK Emoji rendering if not matching core templates
    const fallbackEmoji = () => {
      if (isSleeping) return '💤';
      if (isFull) return '🥰'; // Full happy fallback emoji
      if (isSad) return '🥺'; // Sad/hungry fallback emoji
      if (stage === 'baby') return pet?.imageBaby || template?.imageBaby || '🥚';
      if (stage === 'teen') return pet?.imageTeen || template?.imageTeen || '🐣';
      if (stage === 'adult') return pet?.imageAdult || template?.imageAdult || '🦉';
      return pet?.imageMaster || template?.imageMaster || '🦉🎓';
    };

    return (
      <div
        className="pet-fallback-emoji"
        style={{
          fontSize: size === 'large' ? '5.5rem' : size === 'medium' ? '3.5rem' : '2.2rem',
          lineHeight: 1,
        }}
      >
        {fallbackEmoji()}
      </div>
    );
  };

  const getAccessoryClass = (acc: PetAccessory) => {
    return acc.accessoryClass || 'accessory-fallback';
  };

  return (
    <div
      className={`pet-avatar-wrapper size-${size} ${className}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size === 'large' ? '130px' : size === 'medium' ? '80px' : '48px',
        height: size === 'large' ? '130px' : size === 'medium' ? '80px' : '48px',
        margin: '0 auto',
        ...style,
      }}
    >
      {/* Dynamic SVG / Emoji */}
      {renderPetSvg()}

      {/* Accessories overlay inside relative wrapper */}
      {activeAccessories.map((acc) => (
        <span
          key={acc.id}
          className={`accessory-overlay ${getAccessoryClass(acc)}`}
          title={acc.name}
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            userSelect: 'none',
            lineHeight: 1,
            // Dynamic sizing adjustments based on wrapper size
            fontSize: size === 'large' ? undefined : size === 'medium' ? '1.5rem' : '0.9rem',
            top: size === 'large' ? undefined : acc.accessoryClass === 'accessory-hat' ? '-0.8rem' : acc.accessoryClass === 'accessory-glasses' ? '1rem' : undefined,
            bottom: size === 'large' ? undefined : (acc.accessoryClass === 'accessory-keyboard' || acc.accessoryClass === 'accessory-wand' || acc.accessoryClass === 'accessory-fallback') ? '-0.1rem' : undefined,
            left: size === 'large' ? undefined : acc.accessoryClass === 'accessory-hat' || acc.accessoryClass === 'accessory-glasses' ? '50%' : acc.accessoryClass === 'accessory-keyboard' ? '-0.2rem' : undefined,
            right: size === 'large' ? undefined : acc.accessoryClass === 'accessory-wand' ? '-0.2rem' : acc.accessoryClass === 'accessory-fallback' ? '-0.1rem' : undefined,
            transform: size === 'large' ? undefined : acc.accessoryClass === 'accessory-hat' ? 'translateX(-50%) rotate(-5deg)' : acc.accessoryClass === 'accessory-glasses' ? 'translateX(-50%)' : acc.accessoryClass === 'accessory-wand' ? 'rotate(15deg)' : undefined,
          }}
        >
          {acc.imageData}
        </span>
      ))}
    </div>
  );
}

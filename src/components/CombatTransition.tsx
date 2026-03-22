import { useEffect, useMemo, useRef } from 'react';

interface CombatTransitionProps {
  onSwitchTab: () => void;
  onComplete: () => void;
}

export function CombatTransition({ onSwitchTab, onComplete }: CombatTransitionProps) {
  const refs = useRef({ onSwitchTab, onComplete });
  refs.current = { onSwitchTab, onComplete };

  const sparks = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        const angle = (i / 30) * 360 + (Math.random() - 0.5) * 20;
        const rad = (angle * Math.PI) / 180;
        const dist = 60 + Math.random() * 220;
        return {
          id: i,
          x: Math.cos(rad) * dist,
          y: Math.sin(rad) * dist,
          size: 2 + Math.random() * 5,
          delay: Math.random() * 200,
          duration: 400 + Math.random() * 600,
          color: ['#ff4444', '#ff6600', '#ffaa00', '#ffdd44', '#fff'][
            Math.floor(Math.random() * 5)
          ],
        };
      }),
    [],
  );

  useEffect(() => {
    const t1 = setTimeout(() => refs.current.onSwitchTab(), 1800);
    const t2 = setTimeout(() => refs.current.onComplete(), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="combat-trans-overlay">
      {/* Dark background with red vignette */}
      <div className="combat-trans-bg" />

      {/* Diagonal slash marks */}
      <div className="combat-trans-slash combat-trans-slash-1" />
      <div className="combat-trans-slash combat-trans-slash-2" />

      {/* Left sword */}
      <div className="combat-trans-sword combat-trans-sword-left">
        <SwordSVG id="L" />
      </div>

      {/* Right sword (mirrored) */}
      <div className="combat-trans-sword combat-trans-sword-right">
        <SwordSVG id="R" mirror />
      </div>

      {/* Bright flash on clash */}
      <div className="combat-trans-flash" />

      {/* Shockwave rings */}
      <div className="combat-trans-shockwave" />
      <div className="combat-trans-shockwave combat-trans-shockwave-2" />

      {/* Sparks */}
      {sparks.map((s) => (
        <div
          key={s.id}
          className="combat-trans-spark"
          style={
            {
              width: s.size,
              height: s.size,
              backgroundColor: s.color,
              boxShadow: `0 0 ${s.size * 3}px ${s.color}`,
              animation: `combatTransSpark ${s.duration}ms ${600 + s.delay}ms ease-out forwards`,
              '--spark-x': `${s.x}px`,
              '--spark-y': `${s.y}px`,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Text */}
      <div className="combat-trans-text">COMBAT</div>
    </div>
  );
}

function SwordSVG({ id, mirror }: { id: string; mirror?: boolean }) {
  return (
    <svg
      viewBox="0 0 40 180"
      width="70"
      height="200"
      style={{
        filter: 'drop-shadow(0 0 15px rgba(255,80,30,0.8))',
        ...(mirror ? { transform: 'scaleX(-1)' } : {}),
      }}
    >
      <defs>
        <linearGradient id={`blade${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8a8a8a" />
          <stop offset="35%" stopColor="#e0e0e0" />
          <stop offset="50%" stopColor="#f5f5f5" />
          <stop offset="65%" stopColor="#e0e0e0" />
          <stop offset="100%" stopColor="#8a8a8a" />
        </linearGradient>
        <linearGradient id={`guard${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a08c6a" />
          <stop offset="100%" stopColor="#6b5a3e" />
        </linearGradient>
      </defs>
      {/* Blade */}
      <polygon
        points="20,0 31,118 20,135 9,118"
        fill={`url(#blade${id})`}
        stroke="#555"
        strokeWidth="0.5"
      />
      {/* Fuller (blood groove) */}
      <line x1="20" y1="10" x2="20" y2="108" stroke="rgba(120,120,120,0.4)" strokeWidth="2" />
      {/* Edge highlight */}
      <line x1="14" y1="5" x2="11" y2="115" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      {/* Guard */}
      <rect x="2" y="123" width="36" height="7" rx="3" fill={`url(#guard${id})`} />
      <rect x="0" y="126" width="40" height="2" rx="1" fill="#c9a84c" />
      {/* Grip */}
      <rect x="15" y="130" width="10" height="32" rx="2" fill="#3d2b1a" />
      {/* Grip wrapping */}
      {[0, 1, 2, 3].map((n) => (
        <line
          key={n}
          x1="15"
          y1={136 + n * 7}
          x2="25"
          y2={138 + n * 7}
          stroke="#5a4535"
          strokeWidth="1.5"
        />
      ))}
      {/* Pommel */}
      <ellipse cx="20" cy="166" rx="6" ry="5" fill="#8B7355" />
      <ellipse cx="20" cy="166" rx="3" ry="2.5" fill="#c9a84c" />
    </svg>
  );
}

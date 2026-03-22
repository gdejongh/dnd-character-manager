import { useState, useRef } from 'react';
import { Dices } from 'lucide-react';

type RollMode = 'normal' | 'advantage' | 'disadvantage';

export function DiceRoller() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [mode, setMode] = useState<RollMode>('normal');
  const [rolls, setRolls] = useState<number[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function rollD20() {
    if (rolling) return;
    setRolling(true);
    setResult(null);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const r1 = Math.floor(Math.random() * 20) + 1;
      const r2 = Math.floor(Math.random() * 20) + 1;

      let final: number;
      let allRolls: number[];
      if (mode === 'advantage') {
        final = Math.max(r1, r2);
        allRolls = [r1, r2];
      } else if (mode === 'disadvantage') {
        final = Math.min(r1, r2);
        allRolls = [r1, r2];
      } else {
        final = r1;
        allRolls = [r1];
      }

      setResult(final);
      setRolls(allRolls);
      setRolling(false);
    }, 800);
  }

  function getResultColor(val: number) {
    if (val === 20) return 'var(--accent-bright)';
    if (val === 1) return 'var(--hp-crimson)';
    return 'var(--text-h)';
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer z-30"
        style={{
          background: 'linear-gradient(135deg, #1c1b25, #2a2836)',
          border: '2px solid var(--accent-border)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 12px rgba(201,168,76,0.15)',
          color: 'var(--accent)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        aria-label="Roll dice"
      >
        <Dices size={24} />
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-80 rounded-2xl p-6 flex flex-col items-center gap-5 animate-fade-in"
        style={{
          background: 'linear-gradient(180deg, #1c1b25 0%, #16151d 100%)',
          border: '1px solid var(--accent-border)',
          boxShadow: 'var(--shadow-lg), 0 0 30px rgba(201,168,76,0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-lg m-0"
          style={{ fontFamily: 'var(--heading)', color: 'var(--accent)', fontSize: '1.1rem' }}
        >
          D20 Roller
        </h2>

        {/* Mode selector */}
        <div
          className="flex rounded-lg overflow-hidden w-full"
          style={{ border: '1px solid var(--border)' }}
        >
          {(['normal', 'advantage', 'disadvantage'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-2 text-xs font-medium cursor-pointer capitalize"
              style={{
                background: mode === m
                  ? m === 'advantage' ? 'rgba(74,222,128,0.2)' : m === 'disadvantage' ? 'rgba(185,28,28,0.2)' : 'var(--accent-bg)'
                  : 'transparent',
                color: mode === m
                  ? m === 'advantage' ? 'var(--hp-green)' : m === 'disadvantage' ? 'var(--hp-crimson)' : 'var(--accent)'
                  : 'var(--text)',
                border: 'none',
                borderRight: m !== 'disadvantage' ? '1px solid var(--border)' : 'none',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Result area */}
        <div className="flex flex-col items-center gap-2" style={{ minHeight: '100px', justifyContent: 'center' }}>
          {rolling ? (
            <div style={{ animation: 'diceRoll 0.8s ease-in-out', color: 'var(--accent)' }}>
              <Dices size={56} />
            </div>
          ) : result !== null ? (
            <>
              <span
                className="font-bold"
                style={{
                  fontSize: result === 20 || result === 1 ? '72px' : '60px',
                  color: getResultColor(result),
                  fontFamily: 'var(--heading)',
                  animation: 'diceReveal 0.5s ease-out',
                  textShadow: result === 20
                    ? '0 0 20px rgba(240,192,64,0.6)'
                    : result === 1
                      ? '0 0 20px rgba(185,28,28,0.6)'
                      : 'none',
                }}
              >
                {result}
              </span>
              {result === 20 && (
                <span className="text-xs font-bold tracking-widest" style={{ color: 'var(--accent-bright)', fontFamily: 'var(--heading)' }}>
                  NATURAL 20!
                </span>
              )}
              {result === 1 && (
                <span className="text-xs font-bold tracking-widest" style={{ color: 'var(--hp-crimson)', fontFamily: 'var(--heading)' }}>
                  CRITICAL FAIL
                </span>
              )}
              {rolls.length === 2 && (
                <span className="text-xs" style={{ color: 'var(--text)' }}>
                  Rolled {rolls[0]} and {rolls[1]}
                  {mode === 'advantage' ? ' (took higher)' : ' (took lower)'}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm" style={{ color: 'var(--text)' }}>
              Tap to roll
            </span>
          )}
        </div>

        {/* Roll button */}
        <button
          onClick={rollD20}
          disabled={rolling}
          className="w-full py-4 rounded-xl text-base font-bold cursor-pointer disabled:opacity-50 active:scale-95 transition-transform"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
            color: '#0f0e13',
            border: 'none',
            fontFamily: 'var(--heading)',
            letterSpacing: '1px',
          }}
        >
          {rolling ? 'Rolling…' : 'Roll D20'}
        </button>

        <button
          onClick={() => setOpen(false)}
          className="text-xs cursor-pointer bg-transparent border-none"
          style={{ color: 'var(--text)' }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

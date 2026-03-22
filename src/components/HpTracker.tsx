import { useState, useEffect, useRef } from 'react';
import type { Character } from '../types/database';
import { NumericInput } from './NumericInput';
import { Heart, Shield } from 'lucide-react';

interface HpTrackerProps {
  character: Character;
  onUpdate: (
    updates: Partial<Pick<Character, 'current_hp' | 'max_hp' | 'temp_hp'>>,
  ) => void;
}

function useAnimatedNumber(target: number, duration = 300) {
  const [display, setDisplay] = useState(target);
  const [pulsing, setPulsing] = useState(false);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = display;
    const diff = target - start;
    if (diff === 0) return;

    setPulsing(true);
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setPulsing(false);
      }
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return { display, pulsing };
}

export function HpTracker({ character, onUpdate }: HpTrackerProps) {
  const [customAmount, setCustomAmount] = useState('');
  const [editingMax, setEditingMax] = useState(false);
  const [editingTemp, setEditingTemp] = useState(false);
  const { display: animatedHp, pulsing } = useAnimatedNumber(character.current_hp);

  function adjustHp(amount: number) {
    if (amount < 0) {
      let remaining = Math.abs(amount);
      let newTemp = character.temp_hp;
      let newCurrent = character.current_hp;
      if (newTemp > 0) {
        if (remaining <= newTemp) { newTemp -= remaining; remaining = 0; }
        else { remaining -= newTemp; newTemp = 0; }
      }
      newCurrent = Math.max(0, newCurrent - remaining);
      onUpdate({ current_hp: newCurrent, temp_hp: newTemp });
    } else {
      const newHp = Math.min(character.max_hp, character.current_hp + amount);
      onUpdate({ current_hp: newHp });
    }
  }

  function handleCustomAction(heal: boolean) {
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    adjustHp(heal ? amount : -amount);
    setCustomAmount('');
  }

  const hpPercent = character.max_hp > 0 ? (character.current_hp / character.max_hp) * 100 : 0;
  const hpColor = hpPercent > 50 ? 'var(--hp-green)' : hpPercent > 25 ? 'var(--hp-yellow)' : 'var(--hp-crimson)';
  const barGradient = hpPercent > 50
    ? 'linear-gradient(90deg, #22c55e, #4ade80)'
    : hpPercent > 25
      ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
      : 'linear-gradient(90deg, #991b1b, #dc2626)';

  return (
    <div className="flex flex-col items-center gap-5 p-4 pb-24 animate-fade-in">
      {/* HP Display */}
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="flex items-center gap-2">
          <Heart size={16} style={{ color: 'var(--hp-crimson)' }} fill="var(--hp-crimson)" />
          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: 'var(--hp-crimson)', fontFamily: 'var(--heading)', letterSpacing: '2px' }}
          >
            Hit Points
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className="font-bold"
            style={{
              color: hpColor,
              fontFamily: 'var(--mono)',
              fontSize: '72px',
              lineHeight: 1,
              transition: 'color 0.3s',
              animation: pulsing ? 'hpPulse 0.3s ease-out' : 'none',
              textShadow: `0 0 20px ${hpColor}40`,
            }}
          >
            {animatedHp}
          </span>
          <span className="text-2xl" style={{ color: 'var(--border-light)' }}>/</span>
          <span
            className="text-2xl font-bold"
            style={{ color: 'var(--text-h)', fontFamily: 'var(--mono)' }}
          >
            {character.max_hp}
          </span>
        </div>

        {/* HP Bar */}
        <div
          className="w-full h-3 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, hpPercent)}%`, background: barGradient }}
          />
        </div>
      </div>

      {/* Quick ± Buttons */}
      <div className="grid grid-cols-4 gap-3 w-full">
        {[
          { amt: -5, bg: 'linear-gradient(135deg, #7f1d1d, #991b1b)', label: '−5' },
          { amt: -1, bg: 'linear-gradient(135deg, #991b1b, #b91c1c)', label: '−1' },
          { amt: 1, bg: 'linear-gradient(135deg, #166534, #15803d)', label: '+1' },
          { amt: 5, bg: 'linear-gradient(135deg, #15803d, #22c55e)', label: '+5' },
        ].map(({ amt, bg, label }) => (
          <button
            key={amt}
            className="flex items-center justify-center rounded-xl font-bold text-lg cursor-pointer active:scale-95 transition-transform text-white"
            style={{ background: bg, border: 'none', minHeight: '56px' }}
            onClick={() => adjustHp(amt)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom Amount */}
      <div className="flex gap-3 w-full">
        <input
          type="number"
          placeholder="Amount"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          min={1}
          className="flex-1 px-4 py-3 rounded-xl text-center text-lg outline-none"
          style={{
            background: 'var(--code-bg)',
            color: 'var(--text-h)',
            border: '1px solid var(--border)',
          }}
        />
        <button
          className="px-5 py-3 rounded-xl font-semibold text-white cursor-pointer active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg, #991b1b, #b91c1c)', border: 'none' }}
          onClick={() => handleCustomAction(false)}
        >
          Damage
        </button>
        <button
          className="px-5 py-3 rounded-xl font-semibold text-white cursor-pointer active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)', border: 'none' }}
          onClick={() => handleCustomAction(true)}
        >
          Heal
        </button>
      </div>

      {/* Temp HP */}
      <div
        className="w-full p-4 rounded-xl"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={14} style={{ color: 'var(--spell-indigo)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
              Temporary HP
            </span>
          </div>
          {editingTemp ? (
            <div className="flex items-center gap-2">
              <NumericInput
                min={0}
                value={character.temp_hp}
                onChange={(val) => onUpdate({ temp_hp: val })}
                className="w-20 px-2 py-1 rounded-lg text-center outline-none"
                style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)' }}
                autoFocus
              />
              <button
                className="px-3 py-1 rounded-lg text-sm cursor-pointer"
                style={{ background: 'var(--accent)', color: '#0f0e13', border: 'none' }}
                onClick={() => setEditingTemp(false)}
              >
                Done
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingTemp(true)}
              className="text-lg font-bold cursor-pointer bg-transparent"
              style={{ color: 'var(--spell-indigo)', border: 'none', fontFamily: 'var(--mono)' }}
            >
              {character.temp_hp}
            </button>
          )}
        </div>
      </div>

      {/* Max HP */}
      <div
        className="w-full p-4 rounded-xl"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
            Max HP
          </span>
          {editingMax ? (
            <div className="flex items-center gap-2">
              <NumericInput
                min={1}
                value={character.max_hp}
                onChange={(val) => onUpdate({ max_hp: val, current_hp: Math.min(character.current_hp, val) })}
                className="w-20 px-2 py-1 rounded-lg text-center outline-none"
                style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)' }}
                autoFocus
              />
              <button
                className="px-3 py-1 rounded-lg text-sm cursor-pointer"
                style={{ background: 'var(--accent)', color: '#0f0e13', border: 'none' }}
                onClick={() => setEditingMax(false)}
              >
                Done
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingMax(true)}
              className="text-lg font-bold cursor-pointer bg-transparent"
              style={{ color: 'var(--accent)', border: 'none', fontFamily: 'var(--mono)' }}
            >
              {character.max_hp}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

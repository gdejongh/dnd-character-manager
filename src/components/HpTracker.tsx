import { useState, useEffect, useRef } from 'react';
import type { Character } from '../types/database';
import { NumericInput } from './NumericInput';
import { Heart, Shield } from 'lucide-react';
import { CONDITIONS, isDruid, WILD_SHAPE_RULES } from '../constants/dnd';

interface HpTrackerProps {
  character: Character;
  onUpdate: (
    updates: Partial<Pick<Character, 'current_hp' | 'max_hp' | 'temp_hp' | 'armor_class' | 'death_save_successes' | 'death_save_failures' | 'conditions' | 'wild_shape_active' | 'wild_shape_beast_name' | 'wild_shape_current_hp' | 'wild_shape_max_hp' | 'wild_shape_beast_ac' | 'wild_shape_beast_str' | 'wild_shape_beast_dex' | 'wild_shape_beast_con' | 'wild_shape_beast_speed' | 'wild_shape_beast_swim_speed' | 'wild_shape_beast_fly_speed' | 'wild_shape_beast_climb_speed' | 'wild_shape_beast_burrow_speed'>>,
  ) => void;
  onOpenWildShapeModal?: () => void;
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

export function HpTracker({ character, onUpdate, onOpenWildShapeModal }: HpTrackerProps) {
  const [customAmount, setCustomAmount] = useState('');
  const [editingMax, setEditingMax] = useState(false);
  const [editingTemp, setEditingTemp] = useState(false);
  const [editingAc, setEditingAc] = useState(false);
  const [expandedCondition, setExpandedCondition] = useState<string | null>(null);

  const inBeastForm = character.wild_shape_active;
  const effectiveHp = inBeastForm ? (character.wild_shape_current_hp ?? 0) : character.current_hp;
  const effectiveMaxHp = inBeastForm ? (character.wild_shape_max_hp ?? 0) : character.max_hp;

  const { display: animatedHp, pulsing } = useAnimatedNumber(effectiveHp);

  const wasDown = useRef(character.current_hp <= 0);
  useEffect(() => {
    wasDown.current = character.current_hp <= 0;
  }, [character.current_hp]);

  function adjustHp(amount: number) {
    if (inBeastForm) {
      const beastHp = character.wild_shape_current_hp ?? 0;
      const beastMaxHp = character.wild_shape_max_hp ?? 0;
      if (amount < 0) {
        const newBeastHp = beastHp + amount;
        if (newBeastHp <= 0) {
          // Auto-revert: overflow damage carries to druid HP
          const overflow = Math.abs(newBeastHp);
          const newDruidHp = Math.max(0, character.current_hp - overflow);
          onUpdate({
            wild_shape_active: false,
            wild_shape_current_hp: 0,
            current_hp: newDruidHp,
          });
        } else {
          onUpdate({ wild_shape_current_hp: newBeastHp });
        }
      } else {
        const newHp = Math.min(beastMaxHp, beastHp + amount);
        onUpdate({ wild_shape_current_hp: newHp });
      }
      return;
    }

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
      if (character.current_hp <= 0 && newHp > 0) {
        onUpdate({ current_hp: newHp, death_save_successes: 0, death_save_failures: 0 });
      } else {
        onUpdate({ current_hp: newHp });
      }
    }
  }

  function handleCustomAction(heal: boolean) {
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    adjustHp(heal ? amount : -amount);
    setCustomAmount('');
  }

  function toggleDeathSave(type: 'successes' | 'failures', index: number) {
    const key = type === 'successes' ? 'death_save_successes' : 'death_save_failures';
    const current = type === 'successes' ? character.death_save_successes : character.death_save_failures;
    const newVal = current === index + 1 ? index : index + 1;
    onUpdate({ [key]: Math.min(3, Math.max(0, newVal)) });
  }

  function toggleCondition(conditionName: string) {
    const active = character.conditions ?? [];
    const isActive = active.includes(conditionName);
    if (isActive) {
      onUpdate({ conditions: active.filter(c => c !== conditionName) });
      if (expandedCondition === conditionName) setExpandedCondition(null);
    } else {
      onUpdate({ conditions: [...active, conditionName] });
      setExpandedCondition(conditionName);
    }
  }

  const hpPercent = effectiveMaxHp > 0 ? (effectiveHp / effectiveMaxHp) * 100 : 0;
  const hpColor = hpPercent > 50 ? 'var(--hp-green)' : hpPercent > 25 ? 'var(--hp-yellow)' : 'var(--hp-crimson)';
  const barGradient = hpPercent > 50
    ? 'linear-gradient(90deg, #22c55e, #4ade80)'
    : hpPercent > 25
      ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
      : 'linear-gradient(90deg, #991b1b, #dc2626)';

  const activeConditions = character.conditions ?? [];

  return (
    <div className="flex flex-col items-center gap-5 p-4 md:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-2xl mx-auto w-full flex flex-col items-center gap-5">
      {/* HP + AC Header */}
      <div className="flex items-start gap-4 w-full">
        {/* HP Display */}
        <div className="flex flex-col items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            {inBeastForm ? (
              <span style={{ fontSize: '16px' }}>🐺</span>
            ) : (
              <Heart size={16} style={{ color: 'var(--hp-crimson)' }} fill="var(--hp-crimson)" />
            )}
            <span
              className="text-xs uppercase tracking-widest"
              style={{ color: inBeastForm ? 'var(--spell-violet)' : 'var(--hp-crimson)', fontFamily: 'var(--heading)', letterSpacing: '2px' }}
            >
              {inBeastForm ? 'Beast HP' : 'Hit Points'}
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
            {editingMax && !inBeastForm ? (
              <div className="flex items-center gap-1.5">
                <NumericInput
                  min={1}
                  value={character.max_hp}
                  onChange={(val) => onUpdate({ max_hp: val, current_hp: Math.min(character.current_hp, val) })}
                  className="w-16 px-1 py-0.5 rounded-lg text-center text-2xl font-bold outline-none"
                  style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--accent)', fontFamily: 'var(--mono)' }}
                  autoFocus
                />
                <button
                  className="px-2 py-1 rounded-lg text-xs cursor-pointer font-semibold"
                  style={{ background: 'var(--accent)', color: '#0f0e13', border: 'none' }}
                  onClick={() => {
                    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                    setTimeout(() => setEditingMax(false), 0);
                  }}
                >
                  OK
                </button>
              </div>
            ) : (
              <button
                onClick={() => !inBeastForm && setEditingMax(true)}
                className="text-2xl font-bold bg-transparent rounded-lg px-2 py-0.5"
                style={{
                  color: 'var(--text-h)',
                  fontFamily: 'var(--mono)',
                  border: inBeastForm ? 'none' : '1px dashed var(--border-light)',
                  cursor: inBeastForm ? 'default' : 'pointer',
                }}
                title={inBeastForm ? 'Beast max HP' : 'Edit max HP'}
              >
                {effectiveMaxHp}
              </button>
            )}
          </div>
        </div>

        {/* AC Shield Display */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <div
            className="relative"
            onClick={() => !inBeastForm && !editingAc && setEditingAc(true)}
            style={{
              width: '72px',
              height: '84px',
              cursor: inBeastForm ? 'default' : 'pointer',
            }}
          >
            <Shield
              size={72}
              strokeWidth={1.5}
              style={{
                color: inBeastForm ? 'var(--spell-violet)' : 'var(--accent)',
                position: 'absolute',
                top: 0,
                left: 0,
                filter: inBeastForm ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))' : 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.3))',
              }}
              fill="var(--bg-surface)"
            />

            <span
              className="absolute top-2 left-1/2 -translate-x-1/2 z-10 text-[10px] uppercase tracking-wider font-semibold"
              style={{ color: inBeastForm ? 'var(--spell-violet)' : 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '1px', opacity: 0.8 }}
            >
              AC
            </span>

            {editingAc && !inBeastForm ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 pt-2">
                <NumericInput
                  min={0}
                  max={30}
                  value={character.armor_class}
                  onChange={(val) => onUpdate({ armor_class: val })}
                  className="w-12 px-1 py-0.5 rounded text-center outline-none text-lg font-bold"
                  style={{ background: 'var(--code-bg)', color: 'var(--accent)', border: '1px solid var(--accent)', fontFamily: 'var(--mono)' }}
                  autoFocus
                />
                <button
                  className="text-[9px] px-2 py-0.5 rounded cursor-pointer font-semibold"
                  style={{ background: 'var(--accent)', color: '#0f0e13', border: 'none' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                    setTimeout(() => setEditingAc(false), 0);
                  }}
                >
                  OK
                </button>
              </div>
            ) : (
              <span
                className="absolute inset-0 z-10 flex items-center justify-center text-2xl font-bold leading-none"
                style={{ color: inBeastForm ? 'var(--spell-violet)' : 'var(--accent)', fontFamily: 'var(--mono)', textShadow: inBeastForm ? '0 0 10px rgba(139, 92, 246, 0.25)' : '0 0 10px rgba(212, 175, 55, 0.25)' }}
              >
                {inBeastForm ? (character.wild_shape_beast_ac ?? character.armor_class) : character.armor_class}
              </span>
            )}
          </div>
        </div>
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

      {/* Death Saves — only when at 0 HP */}
      {character.current_hp <= 0 && (
        <div
          className="w-full p-4 rounded-xl animate-fade-in"
          style={{
            border: '1px solid var(--border)',
            background: 'linear-gradient(135deg, var(--bg-surface), rgba(220, 38, 38, 0.05))',
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--hp-crimson)', fontFamily: 'var(--heading)', letterSpacing: '2px' }}>
              ☠ Death Saves
            </span>
          </div>
          <div className="flex justify-center gap-8">
            {/* Successes */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#4ade80', fontFamily: 'var(--heading)' }}>
                Successes
              </span>
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => {
                  const filled = i < character.death_save_successes;
                  return (
                    <button
                      key={`s-${i}`}
                      onClick={() => toggleDeathSave('successes', i)}
                      aria-label={`Death save success ${i + 1}`}
                      aria-pressed={filled}
                      className="cursor-pointer active:scale-90 transition-all"
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: `2px solid ${filled ? '#22c55e' : 'var(--border)'}`,
                        background: filled ? 'linear-gradient(135deg, #22c55e, #4ade80)' : 'var(--bg-raised)',
                        boxShadow: filled ? '0 0 12px rgba(34, 197, 94, 0.4)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  );
                })}
              </div>
            </div>
            {/* Failures */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#f87171', fontFamily: 'var(--heading)' }}>
                Failures
              </span>
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => {
                  const filled = i < character.death_save_failures;
                  return (
                    <button
                      key={`f-${i}`}
                      onClick={() => toggleDeathSave('failures', i)}
                      aria-label={`Death save failure ${i + 1}`}
                      aria-pressed={filled}
                      className="cursor-pointer active:scale-90 transition-all"
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: `2px solid ${filled ? '#dc2626' : 'var(--border)'}`,
                        background: filled ? 'linear-gradient(135deg, #991b1b, #dc2626)' : 'var(--bg-raised)',
                        boxShadow: filled ? '0 0 12px rgba(220, 38, 38, 0.4)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

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
            aria-label={amt > 0 ? `Heal ${amt} HP` : `Take ${Math.abs(amt)} damage`}
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

      {/* Conditions */}
      <div
        className="w-full p-4 rounded-xl"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        <span
          className="text-xs uppercase tracking-widest font-semibold block mb-3"
          style={{ color: 'var(--text)', fontFamily: 'var(--heading)', letterSpacing: '2px' }}
        >
          Conditions
        </span>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((cond) => {
            const isActive = activeConditions.includes(cond.name);
            const isExpanded = expandedCondition === cond.name;
            return (
              <div key={cond.name} className="flex flex-col">
                <button
                  onClick={() => toggleCondition(cond.name)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                  style={{
                    background: isActive ? `${cond.color}20` : 'var(--bg-raised)',
                    border: `1px solid ${isActive ? cond.color : 'var(--border)'}`,
                    color: isActive ? cond.color : 'var(--text-muted)',
                    opacity: isActive ? 1 : 0.6,
                    boxShadow: isActive ? `0 0 8px ${cond.color}25` : 'none',
                  }}
                  title={cond.description}
                >
                  <span style={{ fontSize: '13px' }}>{cond.icon}</span>
                  {cond.name}
                </button>
                {isActive && isExpanded && (
                  <div
                    className="mt-1 px-2 py-1.5 rounded-lg text-[11px] leading-snug animate-fade-in"
                    style={{
                      background: `${cond.color}10`,
                      border: `1px solid ${cond.color}30`,
                      color: 'var(--text)',
                      maxWidth: '200px',
                    }}
                  >
                    {cond.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {activeConditions.length > 0 && (
          <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Active: {activeConditions.join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Wild Shape Section (Druids only) */}
      {isDruid(character.class) && (
        <>
          {inBeastForm ? (
            <div
              className="w-full rounded-xl animate-fade-in"
              style={{
                border: '1px solid var(--spell-border)',
                background: 'linear-gradient(135deg, var(--bg-surface), rgba(139, 92, 246, 0.08))',
              }}
            >
              {/* Beast form header */}
              <div className="flex items-center justify-between p-4 pb-2">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '18px' }}>🐺</span>
                  <div>
                    <span
                      className="text-sm font-bold"
                      style={{ color: 'var(--spell-violet)', fontFamily: 'var(--heading)' }}
                    >
                      {character.wild_shape_beast_name ?? 'Beast Form'}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        AC {character.wild_shape_beast_ac}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        STR {character.wild_shape_beast_str} · DEX {character.wild_shape_beast_dex} · CON {character.wild_shape_beast_con}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        🚶 {character.wild_shape_beast_speed} ft
                      </span>
                      {character.wild_shape_beast_swim_speed != null && character.wild_shape_beast_swim_speed > 0 && (
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>🏊 {character.wild_shape_beast_swim_speed}</span>
                      )}
                      {character.wild_shape_beast_fly_speed != null && character.wild_shape_beast_fly_speed > 0 && (
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>🪽 {character.wild_shape_beast_fly_speed}</span>
                      )}
                      {character.wild_shape_beast_climb_speed != null && character.wild_shape_beast_climb_speed > 0 && (
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>🧗 {character.wild_shape_beast_climb_speed}</span>
                      )}
                      {character.wild_shape_beast_burrow_speed != null && character.wild_shape_beast_burrow_speed > 0 && (
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>⛏️ {character.wild_shape_beast_burrow_speed}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="px-3 py-1.5 rounded-lg text-xs cursor-pointer font-semibold"
                  style={{ background: 'var(--hp-crimson)', color: 'white', border: 'none' }}
                  onClick={() => onUpdate({
                    wild_shape_active: false,
                    wild_shape_current_hp: null,
                    wild_shape_max_hp: null,
                    wild_shape_beast_name: null,
                  })}
                >
                  Revert Form
                </button>
              </div>

              {/* Rules reminder */}
              <div className="px-4 pb-3">
                <div
                  className="px-3 py-2 rounded-lg"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <span className="text-[9px] uppercase tracking-wider font-semibold block mb-1" style={{ color: 'var(--spell-violet)' }}>
                    Wild Shape Rules
                  </span>
                  {WILD_SHAPE_RULES.map((rule, i) => (
                    <div key={i} className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      • {rule}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <button
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm cursor-pointer font-semibold active:scale-[0.98] transition-transform"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))',
                border: '1px solid var(--spell-border)',
                color: 'var(--spell-violet)',
              }}
              onClick={onOpenWildShapeModal}
            >
              🐺 Wild Shape
            </button>
          )}
        </>
      )}

      </div>
    </div>
  );
}

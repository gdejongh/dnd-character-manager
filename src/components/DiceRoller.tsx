import { useState, useEffect, useRef } from 'react';
import type { DiceRoll, QuickRollConfig, DieType } from '../constants/dice';
import { DICE } from '../constants/dice';
import { X, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface DiceRollerProps {
  onClose: () => void;
  lastRoll: DiceRoll | null;
  history: DiceRoll[];
  isRolling: boolean;
  onRoll: (notation: string, options?: { advantage?: 'advantage' | 'disadvantage'; label?: string }) => DiceRoll | null;
  onClearHistory: () => void;
  quickRolls: QuickRollConfig[];
}

type RollMode = 'normal' | 'advantage' | 'disadvantage';

const QUICK_ROLL_CATEGORIES = [
  { key: 'attack' as const, label: 'Attacks', icon: '⚔️' },
  { key: 'ability' as const, label: 'Ability Checks', icon: '🎯' },
  { key: 'save' as const, label: 'Saving Throws', icon: '🛡️' },
  { key: 'skill' as const, label: 'Skills', icon: '📋' },
  { key: 'damage' as const, label: 'Damage', icon: '💥' },
];

export function DiceRoller({
  onClose,
  lastRoll,
  history,
  isRolling,
  onRoll,
  onClearHistory,
  quickRolls,
}: DiceRollerProps) {
  const [mode, setMode] = useState<RollMode>('normal');
  const [customNotation, setCustomNotation] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['attack']));
  const [showHistory, setShowHistory] = useState(false);

  // Build dice pool for custom rolling
  const [dicePool, setDicePool] = useState<Record<DieType, number>>({
    d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0,
  });
  const [poolModifier, setPoolModifier] = useState(0);

  function toggleCategory(key: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleQuickRoll(qr: QuickRollConfig) {
    const advOption = mode !== 'normal' ? mode : undefined;
    onRoll(qr.notation, { advantage: advOption, label: qr.label });
  }

  function handleDieClick(type: DieType) {
    // Quick single-die roll
    const advOption = mode !== 'normal' ? mode : undefined;
    onRoll(`1${type}`, { advantage: advOption, label: type.toUpperCase() });
  }

  function handlePoolRoll() {
    const parts: string[] = [];
    for (const die of DICE) {
      if (dicePool[die.type] > 0) {
        parts.push(`${dicePool[die.type]}${die.type}`);
      }
    }
    if (parts.length === 0) return;
    const modStr = poolModifier > 0 ? `+${poolModifier}` : poolModifier < 0 ? `${poolModifier}` : '';
    const notation = parts.join('+') + modStr;
    onRoll(notation, { label: 'Custom Roll' });
  }

  function handleCustomRoll() {
    if (!customNotation.trim()) return;
    const advOption = mode !== 'normal' ? mode : undefined;
    onRoll(customNotation.trim(), { advantage: advOption, label: 'Custom' });
    setCustomNotation('');
  }

  function resetPool() {
    setDicePool({ d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0 });
    setPoolModifier(0);
  }

  const poolHasDice = Object.values(dicePool).some((v) => v > 0);

  function formatTime(ts: number) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) focusable[0].focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    dialog.addEventListener('keydown', trap);
    return () => dialog.removeEventListener('keydown', trap);
  }, []);

  return (
    <>
      <div className="hidden lg:block fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Dice Roller"
        className="fixed inset-0 z-50 flex flex-col lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-[480px] lg:max-h-[90vh] lg:rounded-2xl lg:shadow-2xl"
        style={{ background: 'var(--bg)' }}
      >
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{
          background: 'linear-gradient(180deg, var(--bg) 0%, rgba(15,14,19,0.95) 100%)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h2
          className="flex-1 m-0 text-base"
          style={{ fontFamily: 'var(--heading)', color: 'var(--accent)', letterSpacing: '0.5px' }}
        >
          🎲 Dice Roller
        </h2>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
          style={{
            background: showHistory ? 'var(--accent-bg)' : 'transparent',
            color: showHistory ? 'var(--accent)' : 'var(--text)',
            border: `1px solid ${showHistory ? 'var(--accent-border)' : 'var(--border)'}`,
            fontFamily: 'var(--heading)',
          }}
        >
          History ({history.length})
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-transparent cursor-pointer"
          style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          <X size={16} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4 pb-8">
        {/* Result Display */}
        {lastRoll && (
          <div
            className={`flex flex-col items-center py-5 rounded-2xl animate-fade-in ${isRolling ? 'dice-roll-bounce' : ''} ${lastRoll.isCrit ? 'crit-glow' : ''} ${lastRoll.isFumble ? 'fumble-pulse' : ''}`}
            style={{
              background: lastRoll.isCrit
                ? 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(240,192,64,0.08))'
                : lastRoll.isFumble
                  ? 'linear-gradient(135deg, rgba(185,28,28,0.15), rgba(239,68,68,0.08))'
                  : 'var(--bg-surface)',
              border: `1px solid ${lastRoll.isCrit ? 'var(--accent-border)' : lastRoll.isFumble ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
            }}
          >
            {lastRoll.label && (
              <span className="text-xs font-semibold mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
                {lastRoll.label}
              </span>
            )}
            <span
              className="font-bold"
              style={{
                fontSize: '48px',
                fontFamily: 'var(--heading)',
                color: lastRoll.isCrit ? 'var(--accent-bright)' : lastRoll.isFumble ? 'var(--danger-bright)' : 'var(--text-h)',
                lineHeight: 1.2,
              }}
            >
              {lastRoll.total}
            </span>
            {lastRoll.isCrit && (
              <span className="text-sm font-bold mt-1" style={{ color: 'var(--accent-bright)', fontFamily: 'var(--heading)' }}>
                ✨ NATURAL 20! ✨
              </span>
            )}
            {lastRoll.isFumble && (
              <span className="text-sm font-bold mt-1" style={{ color: 'var(--danger-bright)', fontFamily: 'var(--heading)' }}>
                💀 NATURAL 1
              </span>
            )}
            <span className="text-xs mt-1" style={{ color: 'var(--text)' }}>
              {lastRoll.notation} → [{lastRoll.results.join(', ')}]
              {lastRoll.modifier !== 0 && (
                <> {lastRoll.modifier > 0 ? '+' : ''}{lastRoll.modifier}</>
              )}
            </span>
            {lastRoll.advantage && (
              <span className="text-[10px] mt-0.5" style={{ color: 'var(--spell-violet)' }}>
                ({lastRoll.advantage})
              </span>
            )}
          </div>
        )}

        {/* Advantage/Disadvantage Toggle */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {(['normal', 'advantage', 'disadvantage'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-2.5 text-xs font-medium cursor-pointer transition-colors"
              style={{
                background: mode === m
                  ? m === 'advantage' ? 'rgba(74, 222, 128, 0.2)' : m === 'disadvantage' ? 'rgba(239, 68, 68, 0.2)' : 'var(--accent-bg)'
                  : 'var(--code-bg)',
                color: mode === m
                  ? m === 'advantage' ? '#4ade80' : m === 'disadvantage' ? '#ef4444' : 'var(--accent)'
                  : 'var(--text)',
                border: 'none',
                fontFamily: mode === m ? 'var(--heading)' : 'var(--sans)',
              }}
            >
              {m === 'normal' ? '⚖️ Normal' : m === 'advantage' ? '🎯 Advantage' : '⬇️ Disadvantage'}
            </button>
          ))}
        </div>

        {/* Quick Dice Buttons */}
        <div className="grid grid-cols-7 gap-2">
          {DICE.map((die) => (
            <button
              key={die.type}
              onClick={() => handleDieClick(die.type)}
              className="flex flex-col items-center gap-1 py-3 rounded-xl cursor-pointer active:scale-90 transition-transform"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: die.color,
              }}
            >
              <span style={{ fontSize: '16px' }}>{die.emoji}</span>
              <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--heading)' }}>
                {die.label}
              </span>
            </button>
          ))}
        </div>

        {/* Custom Notation Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type notation (e.g. 2d6+3)"
            value={customNotation}
            onChange={(e) => setCustomNotation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomRoll()}
            className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--code-bg)',
              color: 'var(--text-h)',
              border: '1px solid var(--border)',
            }}
          />
          <button
            onClick={handleCustomRoll}
            disabled={!customNotation.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer active:scale-95 transition-transform"
            style={{
              background: customNotation.trim()
                ? 'linear-gradient(135deg, var(--accent), var(--accent-bright))'
                : 'var(--bg-raised)',
              color: customNotation.trim() ? '#0f0e13' : 'var(--text)',
              border: 'none',
              fontFamily: 'var(--heading)',
            }}
          >
            Roll
          </button>
        </div>

        {/* Dice Pool Builder */}
        <div
          className="rounded-xl p-3 flex flex-col gap-3"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>
              Dice Pool Builder
            </span>
            {poolHasDice && (
              <button
                onClick={resetPool}
                className="text-[10px] bg-transparent border-none cursor-pointer"
                style={{ color: 'var(--text)' }}
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {DICE.map((die) => (
              <div key={die.type} className="flex flex-col items-center gap-1">
                <button
                  onClick={() => setDicePool((p) => ({ ...p, [die.type]: Math.min(p[die.type] + 1, 20) }))}
                  className="w-full py-1.5 rounded-lg text-xs cursor-pointer active:scale-90 transition-transform"
                  style={{
                    background: dicePool[die.type] > 0 ? `${die.color}20` : 'var(--bg-raised)',
                    color: dicePool[die.type] > 0 ? die.color : 'var(--text)',
                    border: `1px solid ${dicePool[die.type] > 0 ? `${die.color}40` : 'var(--border)'}`,
                    fontFamily: 'var(--heading)',
                    fontWeight: 600,
                  }}
                >
                  {dicePool[die.type] || '+'}
                </button>
                {dicePool[die.type] > 0 && (
                  <button
                    onClick={() => setDicePool((p) => ({ ...p, [die.type]: Math.max(0, p[die.type] - 1) }))}
                    className="text-[10px] bg-transparent border-none cursor-pointer"
                    style={{ color: 'var(--text)' }}
                  >
                    −
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text)' }}>Modifier:</span>
            <input
              type="number"
              value={poolModifier}
              onChange={(e) => setPoolModifier(parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 rounded-lg text-sm text-center outline-none"
              style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)' }}
            />
            <button
              onClick={handlePoolRoll}
              disabled={!poolHasDice}
              className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
              style={{
                background: poolHasDice
                  ? 'linear-gradient(135deg, var(--accent), var(--accent-bright))'
                  : 'var(--bg-raised)',
                color: poolHasDice ? '#0f0e13' : 'var(--text)',
                border: 'none',
                fontFamily: 'var(--heading)',
              }}
            >
              Roll Pool
            </button>
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="flex flex-col gap-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>
                Roll History
              </span>
              {history.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="flex items-center gap-1 text-[10px] bg-transparent border-none cursor-pointer"
                  style={{ color: 'var(--danger-bright)' }}
                >
                  <Trash2 size={10} /> Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text)' }}>
                No rolls yet — start rolling!
              </p>
            ) : (
              history.map((roll) => (
                <div
                  key={roll.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  <span
                    className="text-lg font-bold shrink-0"
                    style={{
                      fontFamily: 'var(--heading)',
                      color: roll.isCrit ? 'var(--accent-bright)' : roll.isFumble ? 'var(--danger-bright)' : 'var(--text-h)',
                      minWidth: '36px',
                      textAlign: 'right',
                    }}
                  >
                    {roll.total}
                  </span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-xs font-medium truncate" style={{ color: 'var(--text-h)' }}>
                      {roll.label || roll.notation}
                    </span>
                    <span className="text-[10px] truncate" style={{ color: 'var(--text)' }}>
                      {roll.notation} → [{roll.results.join(', ')}]
                    </span>
                  </div>
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--text)' }}>
                    {formatTime(roll.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Quick Rolls from Character */}
        {!showHistory && quickRolls.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}>
              Quick Rolls
            </span>
            {QUICK_ROLL_CATEGORIES.map((cat) => {
              const rolls = quickRolls.filter((qr) => qr.category === cat.key);
              if (rolls.length === 0) return null;
              return (
                <div key={cat.key} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  <button
                    onClick={() => toggleCategory(cat.key)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 bg-transparent border-none cursor-pointer text-left"
                    style={{
                      background: 'var(--bg-raised)',
                      borderBottom: expandedCategories.has(cat.key) ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>{cat.icon}</span>
                    <span className="flex-1 text-xs font-semibold" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>
                      {cat.label}
                    </span>
                    {expandedCategories.has(cat.key) ? (
                      <ChevronDown size={12} style={{ color: 'var(--text)' }} />
                    ) : (
                      <ChevronRight size={12} style={{ color: 'var(--text)' }} />
                    )}
                  </button>
                  {expandedCategories.has(cat.key) && (
                    <div className="p-2 flex flex-wrap gap-1.5">
                      {rolls.map((qr) => (
                        <button
                          key={qr.label}
                          onClick={() => handleQuickRoll(qr)}
                          className="px-3 py-2 rounded-lg text-[11px] font-medium cursor-pointer active:scale-95 transition-transform"
                          style={{
                            background: 'var(--bg-raised)',
                            color: 'var(--text-h)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {qr.label}
                          <span className="ml-1.5" style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: '10px' }}>
                            {qr.notation}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      </div>
    </>
  );
}

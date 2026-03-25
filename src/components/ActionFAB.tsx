import { useState } from 'react';
import { Dices, Coffee, Moon, X, Zap } from 'lucide-react';
import { showToast } from '../lib/toast';

interface ActionFABProps {
  // Dice roller
  onOpenDiceRoller: () => void;
  // Short rest
  isWarlock: boolean;
  currentHp: number;
  maxHp: number;
  onRestoreHp?: (amount: number) => Promise<void> | void;
  onRestoreWarlockSlots?: () => Promise<void> | void;
  // Long rest
  onRestoreSlots: () => Promise<void> | void;
  onRestoreUses: () => Promise<void> | void;
  onResetDeathSaves?: () => Promise<void> | void;
  onClearConditions?: () => Promise<void> | void;
  onDropConcentration?: () => Promise<void> | void;
}

export function ActionFAB({
  onOpenDiceRoller,
  isWarlock,
  currentHp,
  maxHp,
  onRestoreHp,
  onRestoreWarlockSlots,
  onRestoreSlots,
  onRestoreUses,
  onResetDeathSaves,
  onClearConditions,
  onDropConcentration,
}: ActionFABProps) {
  const [expanded, setExpanded] = useState(false);
  const [shortRestPrompt, setShortRestPrompt] = useState(false);
  const [longRestConfirm, setLongRestConfirm] = useState(false);
  const [resting, setResting] = useState(false);
  const [healAmount, setHealAmount] = useState('');

  const missingHp = Math.max(0, maxHp - currentHp);

  async function handleShortRest() {
    setResting(true);
    try {
      const parsed = Number.parseInt(healAmount, 10);
      const requested = Number.isNaN(parsed) ? 0 : parsed;
      const healed = Math.max(0, Math.min(requested, missingHp));

      if (healed > 0 && onRestoreHp) await onRestoreHp(healed);
      if (isWarlock && onRestoreWarlockSlots) await onRestoreWarlockSlots();

      const updates: string[] = [];
      if (healed > 0) updates.push(`restored ${healed} HP`);
      if (isWarlock) updates.push('pact slots restored');
      showToast(updates.length > 0 ? `Short Rest complete — ${updates.join(' · ')} ✓` : 'Short Rest complete ✓');
    } finally {
      setResting(false);
      setShortRestPrompt(false);
      setHealAmount('');
      setExpanded(false);
    }
  }

  async function handleLongRest() {
    setResting(true);
    try {
      await Promise.all([
        onRestoreSlots(),
        onRestoreUses(),
        onResetDeathSaves?.(),
        onClearConditions?.(),
        onDropConcentration?.(),
      ]);
      showToast('Long Rest complete — slots & uses restored ✓');
    } finally {
      setResting(false);
      setLongRestConfirm(false);
      setExpanded(false);
    }
  }

  function handleClose() {
    setExpanded(false);
    setShortRestPrompt(false);
    setLongRestConfirm(false);
    setHealAmount('');
  }

  const fabBottom = 'calc(72px + env(safe-area-inset-bottom, 0px))';

  // Short rest prompt panel
  if (shortRestPrompt) {
    return (
      <div className="fixed right-4 z-40" style={{ bottom: fabBottom }}>
        <div
          className="p-3 rounded-xl w-56 flex flex-col gap-2 mb-3 animate-fade-in"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text)',
            border: '1px solid rgba(245, 197, 66, 0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <span
            className="text-[11px] uppercase tracking-wider font-semibold"
            style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}
          >
            ☕ Short Rest
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text)' }}>
            HP {currentHp}/{maxHp}
          </span>
          <label className="text-[11px]" style={{ color: 'var(--text)' }}>
            HP to restore
          </label>
          <input
            type="number"
            min={0}
            max={missingHp}
            value={healAmount}
            onChange={(e) => setHealAmount(e.target.value)}
            placeholder={`0-${missingHp}`}
            className="w-full px-2.5 py-1.5 rounded-lg text-sm outline-none"
            style={{
              background: 'var(--code-bg)',
              color: 'var(--text-h)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--mono)',
            }}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShortRestPrompt(false); setHealAmount(''); }}
              className="flex-1 px-2 py-1.5 rounded-lg text-xs cursor-pointer"
              style={{
                background: 'transparent',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                fontFamily: 'var(--heading)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleShortRest}
              disabled={resting}
              className="flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #5b3a1a, #3d2510)',
                color: '#f5c542',
                border: '1px solid #f5c542',
                opacity: resting ? 0.6 : 1,
                fontFamily: 'var(--heading)',
              }}
            >
              {resting ? 'Resting…' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Long rest confirm panel
  if (longRestConfirm) {
    return (
      <div className="fixed right-4 z-40" style={{ bottom: fabBottom }}>
        <div
          className="p-3 rounded-xl w-56 flex flex-col gap-2 mb-3 animate-fade-in"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text)',
            border: '1px solid rgba(126, 200, 227, 0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <span
            className="text-[11px] uppercase tracking-wider font-semibold"
            style={{ color: '#7ec8e3', fontFamily: 'var(--heading)', letterSpacing: '1px' }}
          >
            🌙 Long Rest
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text)' }}>
            Restore all HP, spell slots, and feature uses. Reset death saves and clear conditions.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLongRestConfirm(false)}
              className="flex-1 px-2 py-1.5 rounded-lg text-xs cursor-pointer"
              style={{
                background: 'transparent',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                fontFamily: 'var(--heading)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleLongRest}
              disabled={resting}
              className="flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #1e3a5f, #0d1b2a)',
                color: '#7ec8e3',
                border: '1px solid #7ec8e3',
                opacity: resting ? 0.6 : 1,
                fontFamily: 'var(--heading)',
              }}
            >
              {resting ? 'Resting…' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed right-4 z-40" style={{ bottom: fabBottom }}>
      {/* Expanded action menu */}
      {expanded && (
        <div className="flex flex-col gap-2.5 mb-3 items-end animate-fade-in">
          {/* Dice Roller */}
          <button
            onClick={() => { setExpanded(false); onOpenDiceRoller(); }}
            className="flex items-center gap-2.5 rounded-full cursor-pointer active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
              color: '#0f0e13',
              border: 'none',
              padding: '0.625rem 1rem 0.625rem 0.75rem',
              boxShadow: '0 4px 16px rgba(201, 168, 76, 0.35)',
              fontFamily: 'var(--heading)',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.3px',
            }}
          >
            <Dices size={18} />
            Roll Dice
          </button>

          {/* Short Rest */}
          <button
            onClick={() => setShortRestPrompt(true)}
            className="flex items-center gap-2.5 rounded-full cursor-pointer active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(135deg, #2a1f0e, #1a1508)',
              color: '#c9a84c',
              border: '2px solid var(--accent-border)',
              padding: '0.5rem 1rem 0.5rem 0.625rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
              fontFamily: 'var(--heading)',
              fontSize: '0.75rem',
              letterSpacing: '0.3px',
            }}
          >
            <Coffee size={16} />
            Short Rest
          </button>

          {/* Long Rest */}
          <button
            onClick={() => setLongRestConfirm(true)}
            className="flex items-center gap-2.5 rounded-full cursor-pointer active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(135deg, #1a2744, #0f1923)',
              color: '#7ec8e3',
              border: '2px solid rgba(126, 200, 227, 0.25)',
              padding: '0.5rem 1rem 0.5rem 0.625rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
              fontFamily: 'var(--heading)',
              fontSize: '0.75rem',
              letterSpacing: '0.3px',
            }}
          >
            <Moon size={16} />
            Long Rest
          </button>
        </div>
      )}

      {/* Main FAB toggle */}
      <button
        onClick={() => expanded ? handleClose() : setExpanded(true)}
        className="flex items-center justify-center rounded-full cursor-pointer active:scale-90 transition-all"
        style={{
          width: '56px',
          height: '56px',
          background: expanded
            ? 'var(--bg-raised)'
            : 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
          color: expanded ? 'var(--text)' : '#0f0e13',
          border: expanded ? '2px solid var(--border)' : 'none',
          boxShadow: expanded
            ? '0 4px 15px rgba(0,0,0,0.3)'
            : '0 4px 20px rgba(201, 168, 76, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)',
          transition: 'transform 0.2s, background 0.2s, box-shadow 0.2s',
        }}
        title={expanded ? 'Close menu' : 'Actions'}
        aria-label={expanded ? 'Close actions menu' : 'Open actions menu'}
      >
        {expanded ? <X size={22} /> : <Zap size={22} />}
      </button>
    </div>
  );
}

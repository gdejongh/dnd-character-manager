import { useState } from 'react';
import { Coffee } from 'lucide-react';
import { showToast } from '../lib/toast';

interface ShortRestButtonProps {
  isWarlock: boolean;
  currentHp: number;
  maxHp: number;
  onRestoreHp?: (amount: number) => Promise<void> | void;
  onRestoreWarlockSlots?: () => Promise<void> | void;
}

export function ShortRestButton({
  isWarlock,
  currentHp,
  maxHp,
  onRestoreHp,
  onRestoreWarlockSlots,
}: ShortRestButtonProps) {
  const [prompting, setPrompting] = useState(false);
  const [resting, setResting] = useState(false);
  const [healAmount, setHealAmount] = useState('');

  const missingHp = Math.max(0, maxHp - currentHp);

  async function handleShortRest() {
    setResting(true);
    try {
      const parsed = Number.parseInt(healAmount, 10);
      const requested = Number.isNaN(parsed) ? 0 : parsed;
      const healed = Math.max(0, Math.min(requested, missingHp));

      if (healed > 0 && onRestoreHp) {
        await onRestoreHp(healed);
      }
      if (isWarlock && onRestoreWarlockSlots) {
        await onRestoreWarlockSlots();
      }

      const updates: string[] = [];
      if (healed > 0) updates.push(`restored ${healed} HP`);
      if (isWarlock) updates.push('pact slots restored');

      showToast(updates.length > 0 ? `Short Rest complete — ${updates.join(' · ')} ✓` : 'Short Rest complete ✓');
    } finally {
      setResting(false);
      setPrompting(false);
      setHealAmount('');
    }
  }

  function handleCancel() {
    setPrompting(false);
    setHealAmount('');
  }

  return (
    <div className="fixed right-4 z-40" style={{ bottom: '9rem' }}>
      {prompting && (
        <div
          className="absolute right-0 p-3 rounded-xl w-56 flex flex-col gap-2"
          style={{
            bottom: '3.5rem',
            background: 'var(--bg-surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
          }}
        >
          <span
            className="text-[11px] uppercase tracking-wider font-semibold"
            style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}
          >
            Short Rest
          </span>

          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
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
          />

          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
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
              Confirm
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => {
          if (!prompting) setPrompting(true);
        }}
        disabled={resting}
        className="flex items-center gap-2 rounded-full shadow-lg cursor-pointer transition-all duration-200"
        style={{
          background: prompting
            ? 'linear-gradient(135deg, #5b3a1a, #3d2510)'
            : 'linear-gradient(135deg, #2a1f0e, #1a1508)',
          color: prompting ? '#f5c542' : '#c9a84c',
          border: prompting ? '2px solid #f5c542' : '2px solid var(--accent-border)',
          padding: prompting ? '0.75rem 1.25rem' : '0.875rem',
          fontFamily: 'var(--heading)',
          letterSpacing: '0.5px',
          fontSize: '0.8rem',
          animation: resting ? 'glowPulse 1s ease-in-out infinite' : undefined,
          boxShadow: prompting
            ? '0 0 20px rgba(245, 197, 66, 0.3)'
            : '0 4px 15px rgba(0,0,0,0.4)',
        }}
      >
        <Coffee
          size={18}
          style={{
            animation: resting ? 'diceRoll 1.5s linear infinite' : undefined,
          }}
        />
        {prompting ? 'Short Rest' : ''}
      </button>
    </div>
  );
}

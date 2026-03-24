import { useState } from 'react';
import { Moon } from 'lucide-react';
import { showToast } from '../lib/toast';

interface LongRestButtonProps {
  onRestoreSlots: () => Promise<void> | void;
  onRestoreUses: () => Promise<void> | void;
  onResetDeathSaves?: () => Promise<void> | void;
  onClearConditions?: () => Promise<void> | void;
  onRecoverHitDice?: () => Promise<void> | void;
  onDropConcentration?: () => Promise<void> | void;
}

export function LongRestButton({ onRestoreSlots, onRestoreUses, onResetDeathSaves, onClearConditions, onRecoverHitDice, onDropConcentration }: LongRestButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [resting, setResting] = useState(false);

  async function handleLongRest() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setResting(true);
    try {
      await Promise.all([
        onRestoreSlots(),
        onRestoreUses(),
        onResetDeathSaves?.(),
        onClearConditions?.(),
        onRecoverHitDice?.(),
        onDropConcentration?.(),
      ]);
      showToast('Long Rest complete — slots, uses & hit dice restored ✓');
    } finally {
      setResting(false);
      setConfirming(false);
    }
  }

  function handleCancel() {
    setConfirming(false);
  }

  return (
    <div className="fixed right-4 z-40" style={{ bottom: '5.5rem' }}>
      {confirming && (
        <button
          onClick={handleCancel}
          className="absolute right-0 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
          style={{
            bottom: '3.5rem',
            background: 'var(--code-bg)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--heading)',
            whiteSpace: 'nowrap',
          }}
        >
          Cancel
        </button>
      )}

      <button
        onClick={handleLongRest}
        disabled={resting}
        className="flex items-center gap-2 rounded-full shadow-lg cursor-pointer transition-all duration-200"
        style={{
          background: confirming
            ? 'linear-gradient(135deg, #1e3a5f, #0d1b2a)'
            : 'linear-gradient(135deg, #1a2744, #0f1923)',
          color: confirming ? '#7ec8e3' : '#c9a84c',
          border: confirming ? '2px solid #7ec8e3' : '2px solid var(--accent-border)',
          padding: confirming ? '0.75rem 1.25rem' : '0.875rem',
          fontFamily: 'var(--heading)',
          letterSpacing: '0.5px',
          fontSize: '0.8rem',
          animation: resting ? 'glowPulse 1s ease-in-out infinite' : undefined,
          boxShadow: confirming
            ? '0 0 20px rgba(126, 200, 227, 0.3)'
            : '0 4px 15px rgba(0,0,0,0.4)',
        }}
      >
        <Moon
          size={20}
          style={{
            animation: resting ? 'diceRoll 1.5s linear infinite' : undefined,
          }}
        />
        {confirming ? 'Confirm Long Rest?' : ''}
      </button>
    </div>
  );
}

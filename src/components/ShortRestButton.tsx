import { useState } from 'react';
import { Coffee } from 'lucide-react';
import { showToast } from '../lib/toast';

interface ShortRestButtonProps {
  isWarlock: boolean;
  onRestoreWarlockSlots?: () => Promise<void> | void;
}

export function ShortRestButton({ isWarlock, onRestoreWarlockSlots }: ShortRestButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [resting, setResting] = useState(false);

  async function handleShortRest() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setResting(true);
    try {
      if (isWarlock && onRestoreWarlockSlots) {
        await onRestoreWarlockSlots();
      }
      showToast(
        isWarlock
          ? 'Short Rest complete — pact slots restored ✓'
          : 'Short Rest complete ✓',
      );
    } finally {
      setResting(false);
      setConfirming(false);
    }
  }

  function handleCancel() {
    setConfirming(false);
  }

  return (
    <div className="fixed right-4 z-40" style={{ bottom: '9rem' }}>
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
        onClick={handleShortRest}
        disabled={resting}
        className="flex items-center gap-2 rounded-full shadow-lg cursor-pointer transition-all duration-200"
        style={{
          background: confirming
            ? 'linear-gradient(135deg, #5b3a1a, #3d2510)'
            : 'linear-gradient(135deg, #2a1f0e, #1a1508)',
          color: confirming ? '#f5c542' : '#c9a84c',
          border: confirming ? '2px solid #f5c542' : '2px solid var(--accent-border)',
          padding: confirming ? '0.75rem 1.25rem' : '0.875rem',
          fontFamily: 'var(--heading)',
          letterSpacing: '0.5px',
          fontSize: '0.8rem',
          animation: resting ? 'glowPulse 1s ease-in-out infinite' : undefined,
          boxShadow: confirming
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
        {confirming ? 'Confirm Short Rest?' : ''}
      </button>
    </div>
  );
}

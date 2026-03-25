import { Dices } from 'lucide-react';

interface DiceRollerFABProps {
  onClick: () => void;
}

export function DiceRollerFAB({ onClick }: DiceRollerFABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed z-40 flex items-center justify-center rounded-full cursor-pointer active:scale-90 transition-transform"
      style={{
        width: '56px',
        height: '56px',
        bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
        right: '16px',
        background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
        color: '#0f0e13',
        border: 'none',
        boxShadow: '0 4px 20px rgba(201, 168, 76, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
      title="Roll Dice"
      aria-label="Open dice roller"
    >
      <Dices size={24} />
    </button>
  );
}

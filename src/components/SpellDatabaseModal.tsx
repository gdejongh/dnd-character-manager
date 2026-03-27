import type { ActionType } from '../types/database';
import { SpellDatabase } from './SpellDatabase';
import { X } from 'lucide-react';

interface SpellDatabaseModalProps {
  characterClass?: string;
  onAddSpell: (name: string, description: string, level: number, actionType: ActionType, concentration: boolean, ritual: boolean) => void;
  onClose: () => void;
}

export function SpellDatabaseModal({ characterClass, onAddSpell, onClose }: SpellDatabaseModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--bg)' }}>
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
          style={{ fontFamily: 'var(--heading)', color: 'var(--spell-violet)', letterSpacing: '0.5px' }}
        >
          📚 SRD Spell Database
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-transparent cursor-pointer"
          style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          <X size={16} />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-8">
        <SpellDatabase
          characterClass={characterClass}
          onAddSpell={onAddSpell}
          onClose={onClose}
        />
      </main>
    </div>
  );
}

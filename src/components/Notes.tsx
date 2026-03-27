import { ScrollText, BookOpen } from 'lucide-react';
import type { Character, CharacterNotes } from '../types/database';

interface NotesProps {
  notes: CharacterNotes | null;
  loading: boolean;
  onUpdateContent: (content: string) => void;
  character?: Character | null;
  onUpdateCharacter?: (updates: Partial<Pick<Character, 'alignment' | 'backstory' | 'personality_traits' | 'ideals' | 'bonds' | 'flaws'>>) => void;
}

const fieldStyle = {
  background: 'var(--bg-surface)',
  color: 'var(--text-h)',
  border: '1px solid var(--border)',
  fontFamily: 'var(--sans)',
  lineHeight: '1.8',
  letterSpacing: '0.2px',
};

export function Notes({ notes, loading, onUpdateContent, character, onUpdateCharacter }: NotesProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p style={{ color: 'var(--text)' }}>Loading notes…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 animate-fade-in" style={{ minHeight: 'calc(100vh - 130px)' }}>
      <div className="max-w-3xl mx-auto w-full flex flex-col flex-1 gap-6">

      {/* Character Backstory Section */}
      {character && onUpdateCharacter && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} style={{ color: 'var(--accent)' }} />
            <h3
              className="text-xs uppercase tracking-widest m-0"
              style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '2px' }}
            >
              Character Details
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {/* Alignment */}
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
                Alignment
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ ...fieldStyle, lineHeight: '1.4' }}
                placeholder="e.g. Chaotic Good"
                value={character.alignment ?? ''}
                onChange={(e) => onUpdateCharacter({ alignment: e.target.value })}
              />
            </div>

            {/* Personality Traits */}
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
                Personality Traits
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{ ...fieldStyle, minHeight: '60px' }}
                placeholder="How does your character behave?"
                value={character.personality_traits ?? ''}
                onChange={(e) => onUpdateCharacter({ personality_traits: e.target.value })}
              />
            </div>

            {/* Ideals */}
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
                Ideals
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{ ...fieldStyle, minHeight: '60px' }}
                placeholder="What drives your character?"
                value={character.ideals ?? ''}
                onChange={(e) => onUpdateCharacter({ ideals: e.target.value })}
              />
            </div>

            {/* Bonds */}
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
                Bonds
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{ ...fieldStyle, minHeight: '60px' }}
                placeholder="What connections does your character have?"
                value={character.bonds ?? ''}
                onChange={(e) => onUpdateCharacter({ bonds: e.target.value })}
              />
            </div>

            {/* Flaws */}
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
                Flaws
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{ ...fieldStyle, minHeight: '60px' }}
                placeholder="What are your character's weaknesses?"
                value={character.flaws ?? ''}
                onChange={(e) => onUpdateCharacter({ flaws: e.target.value })}
              />
            </div>

            {/* Backstory */}
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
                Backstory
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                style={{ ...fieldStyle, minHeight: '200px' }}
                placeholder="Write your character's backstory here…"
                value={character.backstory ?? ''}
                onChange={(e) => onUpdateCharacter({ backstory: e.target.value })}
              />
            </div>
          </div>
        </section>
      )}

      {/* Free-form Notes Section */}
      <section className="flex flex-col flex-1">
      <div className="flex items-center gap-2 mb-3">
        <ScrollText size={16} style={{ color: 'var(--accent)' }} />
        <h3
          className="text-xs uppercase tracking-widest m-0"
          style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '2px' }}
        >
          Notes
        </h3>
        <span className="text-[10px] ml-auto" style={{ color: 'var(--text)' }}>
          Auto-saves as you type
        </span>
      </div>
      <textarea
        className="flex-1 w-full px-5 py-4 rounded-xl text-sm outline-none resize-none"
        style={{
          ...fieldStyle,
          minHeight: '400px',
        }}
        placeholder="Write your notes, session logs, and reminders here…"
        value={notes?.content ?? ''}
        onChange={(e) => onUpdateContent(e.target.value)}
      />
      </section>

      </div>
    </div>
  );
}

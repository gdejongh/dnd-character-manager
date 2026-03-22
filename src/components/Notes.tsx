import { ScrollText } from 'lucide-react';
import type { CharacterNotes } from '../types/database';

interface NotesProps {
  notes: CharacterNotes | null;
  loading: boolean;
  onUpdateContent: (content: string) => void;
}

export function Notes({ notes, loading, onUpdateContent }: NotesProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p style={{ color: 'var(--text)' }}>Loading notes…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 pb-24 animate-fade-in" style={{ minHeight: 'calc(100vh - 130px)' }}>
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
          background: 'var(--bg-surface)',
          color: 'var(--text-h)',
          border: '1px solid var(--border)',
          minHeight: '400px',
          fontFamily: 'var(--sans)',
          lineHeight: '1.8',
          letterSpacing: '0.2px',
        }}
        placeholder="Write your notes, session logs, and reminders here…"
        value={notes?.content ?? ''}
        onChange={(e) => onUpdateContent(e.target.value)}
      />
    </div>
  );
}

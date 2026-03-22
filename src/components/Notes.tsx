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
    <div className="flex flex-col p-4 pb-24" style={{ minHeight: 'calc(100vh - 130px)' }}>
      <h3
        className="text-sm font-semibold uppercase tracking-wider mb-3"
        style={{ color: 'var(--text)' }}
      >
        Notes
      </h3>
      <textarea
        className="flex-1 w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
        style={{
          background: 'var(--code-bg)',
          color: 'var(--text-h)',
          border: '1px solid var(--border)',
          minHeight: '400px',
          fontFamily: 'var(--sans)',
        }}
        placeholder="Write your notes here… Auto-saves as you type."
        value={notes?.content ?? ''}
        onChange={(e) => onUpdateContent(e.target.value)}
      />
    </div>
  );
}

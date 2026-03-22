import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Character } from '../types/database';

interface HomeScreenProps {
  characters: Character[];
  loading: boolean;
  onSelect: (id: string) => void;
  onCreate: (name: string, race: string, charClass: string) => Promise<Character | null>;
  onDelete: (id: string) => Promise<void>;
  onSignOut: () => void;
}

export function HomeScreen({
  characters,
  loading,
  onSelect,
  onCreate,
  onDelete,
  onSignOut,
}: HomeScreenProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [race, setRace] = useState('');
  const [charClass, setCharClass] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    const character = await onCreate(name.trim(), race.trim(), charClass.trim());
    setCreating(false);
    if (character) {
      setName('');
      setRace('');
      setCharClass('');
      setShowForm(false);
      onSelect(character.id);
    }
  }

  const inputStyle = {
    background: 'var(--code-bg)',
    color: 'var(--text-h)',
    border: '1px solid var(--border)',
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header
        className="flex items-center justify-between p-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h1
          className="text-xl font-bold m-0"
          style={{ color: 'var(--text-h)', fontSize: '1.25rem', letterSpacing: 'normal' }}
        >
          ⚔️ D&D Characters
        </h1>
        <button
          onClick={onSignOut}
          className="px-3 py-1.5 rounded-lg text-sm bg-transparent cursor-pointer"
          style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          Sign Out
        </button>
      </header>

      {/* Character List */}
      <div className="flex-1 p-4">
        {loading ? (
          <p className="text-center py-12" style={{ color: 'var(--text)' }}>
            Loading characters…
          </p>
        ) : (
          <>
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
            >
              {characters.map((char) => (
                <div
                  key={char.id}
                  className="p-4 rounded-xl cursor-pointer transition-all"
                  style={{
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    boxShadow: 'var(--shadow)',
                  }}
                  onClick={() => onSelect(char.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onSelect(char.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2
                        className="text-lg font-semibold m-0"
                        style={{ color: 'var(--text-h)', fontSize: '1.125rem' }}
                      >
                        {char.name}
                      </h2>
                      <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
                        {[char.race, char.class].filter(Boolean).join(' ') || 'No race/class'}
                        {char.level > 0 && ` · Level ${char.level}`}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(char.id);
                      }}
                      className="p-2 rounded-lg text-sm bg-transparent cursor-pointer shrink-0"
                      style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
                      aria-label={`Delete ${char.name}`}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex gap-3 mt-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
                    >
                      HP {char.current_hp}/{char.max_hp}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {characters.length === 0 && (
              <p className="text-center py-12" style={{ color: 'var(--text)' }}>
                No characters yet. Create your first adventurer!
              </p>
            )}
          </>
        )}
      </div>

      {/* New Character Form / Button */}
      {showForm ? (
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Character Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg text-base outline-none"
              style={inputStyle}
              autoFocus
            />
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Race"
                value={race}
                onChange={(e) => setRace(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg text-base outline-none"
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Class"
                value={charClass}
                onChange={(e) => setCharClass(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg text-base outline-none"
                style={inputStyle}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-lg font-semibold text-base cursor-pointer"
                style={{
                  color: 'var(--text)',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex-1 py-3 rounded-lg font-semibold text-white text-base cursor-pointer disabled:opacity-50"
                style={{ background: 'var(--accent)', border: 'none' }}
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 rounded-lg font-semibold text-white text-base cursor-pointer"
            style={{ background: 'var(--accent)', border: 'none' }}
          >
            + New Character
          </button>
        </div>
      )}
    </div>
  );
}

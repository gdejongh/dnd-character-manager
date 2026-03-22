import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Character } from '../types/database';
import { LogOut, Trash2, Heart, Plus, Shield } from 'lucide-react';

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
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(180deg, var(--bg-raised) 0%, var(--bg) 100%)',
        }}
      >
        <div className="flex items-center gap-3">
          <Shield size={22} style={{ color: 'var(--accent)' }} />
          <h1
            className="m-0 animate-shimmer"
            style={{ fontSize: '1.15rem', letterSpacing: '1px' }}
          >
            D&D Characters
          </h1>
        </div>
        <button
          onClick={onSignOut}
          className="p-2.5 rounded-lg bg-transparent cursor-pointer"
          style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
          aria-label="Sign out"
        >
          <LogOut size={16} />
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
            <div className="flex flex-col gap-3">
              {characters.map((char, i) => (
                <div
                  key={char.id}
                  className="p-4 rounded-xl cursor-pointer transition-all active:scale-[0.98] animate-fade-in"
                  style={{
                    background: 'linear-gradient(135deg, var(--bg-raised) 0%, var(--bg-surface) 100%)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow)',
                    animationDelay: `${i * 60}ms`,
                  }}
                  onClick={() => onSelect(char.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onSelect(char.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2
                        className="text-lg m-0"
                        style={{ color: 'var(--accent)', fontSize: '1rem' }}
                      >
                        {char.name}
                      </h2>
                      <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
                        {[char.race, char.class].filter(Boolean).join(' · ') || 'No race/class'}
                        {char.level > 0 && ` · Level ${char.level}`}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(char.id);
                      }}
                      className="p-2.5 rounded-lg bg-transparent cursor-pointer shrink-0"
                      style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
                      aria-label={`Delete ${char.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex gap-3 mt-3">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                      style={{
                        background: 'rgba(185,28,28,0.15)',
                        color: 'var(--hp-crimson)',
                        border: '1px solid rgba(185,28,28,0.25)',
                      }}
                    >
                      <Heart size={10} fill="currentColor" /> {char.current_hp}/{char.max_hp}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {characters.length === 0 && (
              <div className="flex flex-col items-center py-16 gap-4">
                <Shield size={48} style={{ color: 'var(--border-light)' }} />
                <p className="text-center" style={{ color: 'var(--text)' }}>
                  No adventurers yet. Create your first character!
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* New Character Form / Button */}
      {showForm ? (
        <div
          className="p-5 animate-fade-in"
          style={{
            borderTop: '1px solid var(--border)',
            background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg) 100%)',
          }}
        >
          <h3
            className="text-center mb-4"
            style={{ fontFamily: 'var(--heading)', color: 'var(--accent)', fontSize: '0.9rem', letterSpacing: '1.5px' }}
          >
            ✦ CREATE NEW CHARACTER ✦
          </h3>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Character Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-lg text-base outline-none text-center"
              style={{
                ...inputStyle,
                fontFamily: 'var(--heading)',
                fontSize: '1.05rem',
                letterSpacing: '0.5px',
              }}
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
            <div className="flex gap-3 mt-1">
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
                className="flex-1 py-3 rounded-lg font-semibold text-base cursor-pointer disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
                  color: '#0f0e13',
                  border: 'none',
                  fontFamily: 'var(--heading)',
                  letterSpacing: '0.5px',
                }}
              >
                {creating ? 'Forging…' : 'Begin Adventure'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3.5 rounded-xl font-semibold text-base cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
              color: '#0f0e13',
              border: 'none',
              fontFamily: 'var(--heading)',
              letterSpacing: '0.5px',
            }}
          >
            <Plus size={18} /> New Character
          </button>
        </div>
      )}
    </div>
  );
}

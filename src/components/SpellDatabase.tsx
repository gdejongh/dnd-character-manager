import { useState } from 'react';
import type { SrdSpell } from '../types/srdSpell';
import type { ActionType } from '../types/database';
import { useSpellDatabase } from '../hooks/useSpellDatabase';
import { Search, X, Filter, ChevronDown, Plus } from 'lucide-react';

interface SpellDatabaseProps {
  characterClass?: string;
  onAddSpell: (name: string, description: string, level: number, actionType: ActionType, concentration: boolean, ritual: boolean) => void;
  onClose: () => void;
}

const LEVEL_LABELS: Record<number, string> = {
  0: 'Cantrip', 1: '1st', 2: '2nd', 3: '3rd',
  4: '4th', 5: '5th', 6: '6th', 7: '7th', 8: '8th', 9: '9th',
};

const SCHOOL_COLORS: Record<string, string> = {
  Abjuration: '#3b82f6',
  Conjuration: '#f97316',
  Divination: '#a855f7',
  Enchantment: '#ec4899',
  Evocation: '#ef4444',
  Illusion: '#8b5cf6',
  Necromancy: '#6b7280',
  Transmutation: '#22c55e',
};

function castingTimeToActionType(ct: string): ActionType {
  const lower = ct.toLowerCase();
  if (lower.includes('bonus')) return 'bonus_action';
  if (lower.includes('reaction')) return 'reaction';
  if (lower === '1 action') return 'action';
  return 'other';
}

function formatSpellDescription(spell: SrdSpell): string {
  const parts: string[] = [];
  parts.push(`[${spell.school}] — ${spell.castingTime}`);
  parts.push(`Range: ${spell.range}`);
  parts.push(`Components: ${spell.components}`);
  parts.push(`Duration: ${spell.duration}`);
  parts.push('');
  parts.push(spell.description);
  if (spell.higherLevels) {
    parts.push('');
    parts.push(`At Higher Levels: ${spell.higherLevels}`);
  }
  return parts.join('\n');
}

export function SpellDatabase({ characterClass, onAddSpell }: SpellDatabaseProps) {
  const db = useSpellDatabase();
  const [selectedSpell, setSelectedSpell] = useState<SrdSpell | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [addedSpells, setAddedSpells] = useState<Set<string>>(new Set());

  // Auto-filter by character class on mount
  useState(() => {
    if (characterClass) {
      const classKey = characterClass.toLowerCase().split(/[\s:(/–-]/)[0];
      const matchedClass = db.classes.find((c) => c.toLowerCase() === classKey);
      if (matchedClass) {
        db.setClassFilter(matchedClass);
      }
    }
  });

  function handleAddSpell(spell: SrdSpell) {
    const actionType = castingTimeToActionType(spell.castingTime);
    const description = formatSpellDescription(spell);
    onAddSpell(spell.name, description, spell.level, actionType, spell.concentration, spell.ritual);
    setAddedSpells((prev) => new Set(prev).add(spell.name));
  }

  const hasFilters = db.levelFilter !== null || db.schoolFilter !== null ||
    db.classFilter !== null || db.concentrationFilter !== null || db.ritualFilter !== null;

  if (db.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div
          className="w-8 h-8 rounded-full"
          style={{
            border: '3px solid var(--border)',
            borderTopColor: 'var(--spell-indigo)',
            animation: 'diceRoll 1s linear infinite',
          }}
        />
        <p className="text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
          Loading spell database…
        </p>
      </div>
    );
  }

  // Detail view
  if (selectedSpell) {
    const isAdded = addedSpells.has(selectedSpell.name);
    return (
      <div className="flex flex-col gap-4 p-4 animate-fade-in">
        <button
          onClick={() => setSelectedSpell(null)}
          className="self-start flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-transparent cursor-pointer"
          style={{ color: 'var(--spell-indigo)', border: '1px solid var(--spell-border)' }}
        >
          ← Back to list
        </button>

        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--spell-border)' }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3
                className="text-base m-0"
                style={{ fontFamily: 'var(--heading)', color: 'var(--spell-violet)', letterSpacing: '0.3px' }}
              >
                {selectedSpell.name}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
                {selectedSpell.level === 0 ? `${selectedSpell.school} cantrip` : `${LEVEL_LABELS[selectedSpell.level]}-level ${selectedSpell.school.toLowerCase()}`}
                {selectedSpell.ritual && ' (ritual)'}
              </p>
            </div>
            <button
              onClick={() => handleAddSpell(selectedSpell)}
              disabled={isAdded}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer shrink-0 active:scale-95 transition-transform"
              style={{
                background: isAdded
                  ? 'rgba(74, 222, 128, 0.15)'
                  : 'linear-gradient(135deg, var(--spell-indigo), var(--spell-violet))',
                color: isAdded ? '#4ade80' : 'white',
                border: isAdded ? '1px solid rgba(74, 222, 128, 0.3)' : 'none',
                fontFamily: 'var(--heading)',
              }}
            >
              {isAdded ? '✓ Added' : <><Plus size={12} /> Add to Character</>}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Casting Time', value: selectedSpell.castingTime },
              { label: 'Range', value: selectedSpell.range },
              { label: 'Components', value: selectedSpell.components },
              { label: 'Duration', value: selectedSpell.duration },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="px-3 py-2 rounded-lg"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
              >
                <span className="text-[10px] uppercase tracking-wider block" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
                  {label}
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--text-h)' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {(selectedSpell.concentration || selectedSpell.ritual) && (
            <div className="flex gap-2">
              {selectedSpell.concentration && (
                <span
                  className="px-2 py-1 rounded text-[10px] font-semibold"
                  style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)' }}
                >
                  🔮 Concentration
                </span>
              )}
              {selectedSpell.ritual && (
                <span
                  className="px-2 py-1 rounded text-[10px] font-semibold"
                  style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)' }}
                >
                  📖 Ritual
                </span>
              )}
            </div>
          )}

          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
              Classes
            </span>
            <div className="flex flex-wrap gap-1">
              {selectedSpell.classes.map((cls) => (
                <span
                  key={cls}
                  className="px-2 py-0.5 rounded text-[10px]"
                  style={{ background: 'var(--bg-raised)', color: 'var(--text-h)', border: '1px solid var(--border)' }}
                >
                  {cls}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
              Description
            </span>
            <p className="text-sm leading-relaxed whitespace-pre-wrap m-0" style={{ color: 'var(--text-h)' }}>
              {selectedSpell.description}
            </p>
          </div>

          {selectedSpell.higherLevels && (
            <div
              className="px-3 py-2.5 rounded-lg"
              style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid var(--spell-border)' }}
            >
              <span className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: 'var(--spell-indigo)', fontFamily: 'var(--heading)' }}>
                At Higher Levels
              </span>
              <p className="text-xs leading-relaxed m-0" style={{ color: 'var(--text-h)' }}>
                {selectedSpell.higherLevels}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="flex flex-col gap-3 p-4 animate-fade-in">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--spell-indigo)' }} />
        <input
          type="text"
          placeholder="Search spells by name…"
          value={db.search}
          onChange={(e) => db.setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none"
          style={{
            background: 'var(--code-bg)',
            color: 'var(--text-h)',
            border: '1px solid var(--spell-border)',
          }}
          autoFocus
        />
        {db.search && (
          <button
            onClick={() => db.setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer"
            style={{ color: 'var(--text)' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-transparent border-none cursor-pointer self-start"
        style={{
          color: hasFilters ? 'var(--spell-indigo)' : 'var(--text)',
        }}
      >
        <Filter size={13} />
        <span className="text-xs font-medium">
          Filters {hasFilters && '(active)'}
        </span>
        <ChevronDown size={12} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col gap-2 animate-fade-in">
          {/* Level */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] uppercase tracking-wider w-full mb-0.5" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>Level</span>
            {[null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
              <button
                key={lvl ?? 'all'}
                onClick={() => db.setLevelFilter(lvl)}
                className="px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer"
                style={{
                  background: db.levelFilter === lvl ? 'var(--spell-indigo)' : 'var(--bg-raised)',
                  color: db.levelFilter === lvl ? 'white' : 'var(--text)',
                  border: `1px solid ${db.levelFilter === lvl ? 'var(--spell-indigo)' : 'var(--border)'}`,
                }}
              >
                {lvl === null ? 'All' : LEVEL_LABELS[lvl]}
              </button>
            ))}
          </div>

          {/* School */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] uppercase tracking-wider w-full mb-0.5" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>School</span>
            <button
              onClick={() => db.setSchoolFilter(null)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer"
              style={{
                background: !db.schoolFilter ? 'var(--spell-indigo)' : 'var(--bg-raised)',
                color: !db.schoolFilter ? 'white' : 'var(--text)',
                border: `1px solid ${!db.schoolFilter ? 'var(--spell-indigo)' : 'var(--border)'}`,
              }}
            >
              All
            </button>
            {db.schools.map((school) => (
              <button
                key={school}
                onClick={() => db.setSchoolFilter(school)}
                className="px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer"
                style={{
                  background: db.schoolFilter === school ? `${SCHOOL_COLORS[school]}30` : 'var(--bg-raised)',
                  color: db.schoolFilter === school ? SCHOOL_COLORS[school] : 'var(--text)',
                  border: `1px solid ${db.schoolFilter === school ? `${SCHOOL_COLORS[school]}50` : 'var(--border)'}`,
                }}
              >
                {school}
              </button>
            ))}
          </div>

          {/* Class */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] uppercase tracking-wider w-full mb-0.5" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>Class</span>
            <button
              onClick={() => db.setClassFilter(null)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer"
              style={{
                background: !db.classFilter ? 'var(--spell-indigo)' : 'var(--bg-raised)',
                color: !db.classFilter ? 'white' : 'var(--text)',
                border: `1px solid ${!db.classFilter ? 'var(--spell-indigo)' : 'var(--border)'}`,
              }}
            >
              All
            </button>
            {db.classes.map((cls) => (
              <button
                key={cls}
                onClick={() => db.setClassFilter(cls)}
                className="px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer"
                style={{
                  background: db.classFilter === cls ? 'var(--spell-violet)' : 'var(--bg-raised)',
                  color: db.classFilter === cls ? 'white' : 'var(--text)',
                  border: `1px solid ${db.classFilter === cls ? 'var(--spell-violet)' : 'var(--border)'}`,
                }}
              >
                {cls}
              </button>
            ))}
          </div>

          {/* Toggles */}
          <div className="flex gap-2">
            <button
              onClick={() => db.setConcentrationFilter(db.concentrationFilter === true ? null : true)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer"
              style={{
                background: db.concentrationFilter === true ? 'rgba(251, 191, 36, 0.15)' : 'var(--bg-raised)',
                color: db.concentrationFilter === true ? '#fbbf24' : 'var(--text)',
                border: `1px solid ${db.concentrationFilter === true ? 'rgba(251, 191, 36, 0.3)' : 'var(--border)'}`,
              }}
            >
              🔮 Concentration
            </button>
            <button
              onClick={() => db.setRitualFilter(db.ritualFilter === true ? null : true)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer"
              style={{
                background: db.ritualFilter === true ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-raised)',
                color: db.ritualFilter === true ? '#a855f7' : 'var(--text)',
                border: `1px solid ${db.ritualFilter === true ? 'rgba(168, 85, 247, 0.3)' : 'var(--border)'}`,
              }}
            >
              📖 Ritual
            </button>
            {hasFilters && (
              <button
                onClick={db.clearFilters}
                className="ml-auto px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer"
                style={{ background: 'transparent', color: 'var(--danger-bright)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results count */}
      <span className="text-xs" style={{ color: 'var(--text)' }}>
        {db.spells.length} spell{db.spells.length !== 1 ? 's' : ''} found
      </span>

      {/* Spell List */}
      {db.spells.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <span style={{ fontSize: '32px' }}>🔍</span>
          <p className="text-sm" style={{ color: 'var(--text)' }}>No spells match your filters</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {db.spells.map((spell) => {
            const isAdded = addedSpells.has(spell.name);
            return (
              <button
                key={spell.name}
                onClick={() => setSelectedSpell(spell)}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer active:scale-[0.99] transition-transform bg-transparent"
                style={{
                  background: 'var(--bg-surface)',
                  border: `1px solid ${isAdded ? 'rgba(74, 222, 128, 0.2)' : 'var(--border)'}`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background: `${SCHOOL_COLORS[spell.school] ?? '#6b7280'}15`,
                    color: SCHOOL_COLORS[spell.school] ?? '#6b7280',
                    fontFamily: 'var(--heading)',
                  }}
                >
                  {spell.level === 0 ? 'C' : spell.level}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium block truncate" style={{ color: 'var(--text-h)' }}>
                    {spell.name}
                    {isAdded && <span className="ml-1.5 text-[10px]" style={{ color: '#4ade80' }}>✓</span>}
                  </span>
                  <span className="text-[10px] block truncate" style={{ color: 'var(--text)' }}>
                    {spell.school} · {spell.castingTime}
                    {spell.concentration && ' · C'}
                    {spell.ritual && ' · R'}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddSpell(spell);
                  }}
                  disabled={isAdded}
                  className="p-1.5 rounded-lg cursor-pointer shrink-0 active:scale-90 transition-transform"
                  style={{
                    background: isAdded ? 'rgba(74, 222, 128, 0.15)' : 'var(--spell-bg)',
                    color: isAdded ? '#4ade80' : 'var(--spell-indigo)',
                    border: `1px solid ${isAdded ? 'rgba(74, 222, 128, 0.3)' : 'var(--spell-border)'}`,
                  }}
                  title={isAdded ? 'Already added' : 'Add to character'}
                >
                  <Plus size={14} />
                </button>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

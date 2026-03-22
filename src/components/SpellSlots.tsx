import { useState } from 'react';
import type { FormEvent } from 'react';
import type { SpellSlot, Spell } from '../types/database';

interface SpellSlotsProps {
  slots: SpellSlot[];
  spells: Spell[];
  preparedLimit: number | null;
  onUpdateTotal: (level: number, total: number) => void;
  onSetSlotUsed: (level: number, used: number) => void;
  onResetAll: () => void;
  onAddSpell: (name: string, description: string, level: number) => void;
  onUpdateSpell: (id: string, updates: Partial<Pick<Spell, 'name' | 'description' | 'level' | 'prepared'>>) => void;
  onDeleteSpell: (id: string) => void;
}

const LEVEL_LABELS: Record<number, string> = {
  0: 'Cantrips',
  1: 'Level 1',
  2: 'Level 2',
  3: 'Level 3',
  4: 'Level 4',
  5: 'Level 5',
  6: 'Level 6',
  7: 'Level 7',
  8: 'Level 8',
  9: 'Level 9',
};

const inputStyle = {
  background: 'var(--code-bg)',
  color: 'var(--text-h)',
  border: '1px solid var(--border)',
};

export function SpellSlots({
  slots,
  spells,
  preparedLimit,
  onUpdateTotal,
  onSetSlotUsed,
  onResetAll,
  onAddSpell,
  onUpdateSpell,
  onDeleteSpell,
}: SpellSlotsProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'prepared'>('all');
  const [expandedSpellId, setExpandedSpellId] = useState<string | null>(null);
  const [addingAtLevel, setAddingAtLevel] = useState<number | null>(null);
  const [editingSpellId, setEditingSpellId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const hasAnySlots = slots.some((s) => s.total > 0);

  const q = search.toLowerCase();
  const filteredSpells = spells.filter((s) => {
    if (filter === 'prepared' && !s.prepared) return false;
    if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) return false;
    return true;
  });

  // Cantrips don't count toward the prepared limit
  const preparedCount = spells.filter((s) => s.prepared && s.level > 0).length;
  const isOverLimit = preparedLimit !== null && preparedCount > preparedLimit;

  function spellsAtLevel(level: number) {
    return filteredSpells.filter((s) => s.level === level);
  }

  function startAdd(level: number) {
    setEditingSpellId(null);
    setAddingAtLevel(level);
    setFormName('');
    setFormDesc('');
  }

  function startEdit(spell: Spell) {
    setAddingAtLevel(null);
    setEditingSpellId(spell.id);
    setFormName(spell.name);
    setFormDesc(spell.description);
  }

  function cancelForm() {
    setAddingAtLevel(null);
    setEditingSpellId(null);
    setFormName('');
    setFormDesc('');
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!formName.trim() || addingAtLevel === null) return;
    onAddSpell(formName.trim(), formDesc.trim(), addingAtLevel);
    cancelForm();
  }

  function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !editingSpellId) return;
    onUpdateSpell(editingSpellId, { name: formName.trim(), description: formDesc.trim() });
    cancelForm();
  }

  // All levels to render: 0 (cantrips) + 1–9
  const levels = [0, ...slots.map((s) => s.level)];

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Search bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="🔍 Search spells by name or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-10"
          style={inputStyle}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-base"
            style={{ color: 'var(--text)' }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter toggle */}
      <div
        className="flex rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        {(['all', 'prepared'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-1 py-2.5 text-sm font-medium cursor-pointer transition-colors"
            style={{
              background: filter === f ? 'var(--accent)' : 'var(--code-bg)',
              color: filter === f ? 'white' : 'var(--text)',
              border: 'none',
            }}
          >
            {f === 'all'
              ? `All Spells (${spells.length})`
              : preparedLimit !== null
                ? `Prepared (${preparedCount}/${preparedLimit})`
                : `Prepared (${preparedCount})`}
          </button>
        ))}
      </div>

      {/* Over-limit warning */}
      {isOverLimit && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
          style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            color: '#92400e',
          }}
        >
          <span>⚠️</span>
          <span>
            You have <strong>{preparedCount}</strong> spells prepared but can only prepare{' '}
            <strong>{preparedLimit}</strong>. Unprepare {preparedCount - (preparedLimit ?? 0)} spell
            {preparedCount - (preparedLimit ?? 0) !== 1 ? 's' : ''}.
          </span>
        </div>
      )}

      {/* Long Rest */}
      {hasAnySlots && !search && (
        <div className="flex justify-end">
          <button
            onClick={onResetAll}
            className="px-3 py-1.5 rounded-lg text-sm cursor-pointer"
            style={{
              background: 'var(--accent-bg)',
              color: 'var(--accent)',
              border: '1px solid var(--accent-border)',
            }}
          >
            Long Rest (Reset Slots)
          </button>
        </div>
      )}

      {/* Spell levels */}
      {levels.map((level) => {
        const slot = slots.find((s) => s.level === level);
        const levelSpells = spellsAtLevel(level);

        // When searching or filtering prepared, hide empty levels
        if ((search || filter === 'prepared') && levelSpells.length === 0) return null;

        return (
          <section
            key={level}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            {/* Level header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ background: 'var(--code-bg)' }}
            >
              <span className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>
                {LEVEL_LABELS[level]}
              </span>
              <div className="flex items-center gap-3">
                {level > 0 && slot && (
                  <span className="text-xs" style={{ color: 'var(--text)' }}>
                    {slot.total - slot.used}/{slot.total} slots
                  </span>
                )}
                {level === 0 && (
                  <span className="text-xs" style={{ color: 'var(--text)' }}>
                    At will
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {/* Slot circles + total editor for levels 1–9 */}
              {level > 0 && slot && !search && (
                <div className="flex items-center gap-3 flex-wrap">
                  {slot.total > 0 ? (
                    <>
                      {Array.from({ length: slot.total }, (_, i) => {
                        const isUsed = i < slot.used;
                        return (
                          <button
                            key={i}
                            onClick={() =>
                              isUsed
                                ? onSetSlotUsed(slot.level, slot.used - 1)
                                : onSetSlotUsed(slot.level, slot.used + 1)
                            }
                            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                            style={{
                              background: isUsed ? 'var(--border)' : 'var(--accent)',
                              border: isUsed
                                ? '2px solid var(--border)'
                                : '2px solid var(--accent)',
                              color: isUsed ? 'var(--text)' : 'white',
                              fontSize: '16px',
                            }}
                            aria-label={`Slot ${i + 1}: ${isUsed ? 'used' : 'available'}`}
                          >
                            {isUsed ? '○' : '●'}
                          </button>
                        );
                      })}
                    </>
                  ) : null}
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-xs" style={{ color: 'var(--text)' }}>
                      Total:
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={9}
                      value={slot.total}
                      onChange={(e) =>
                        onUpdateTotal(
                          slot.level,
                          Math.max(0, Math.min(9, Number(e.target.value) || 0)),
                        )
                      }
                      className="w-12 text-center px-1 py-0.5 rounded outline-none text-sm"
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              {/* Spells at this level */}
              {levelSpells.map((spell) => (
                <div key={spell.id}>
                  {editingSpellId === spell.id ? (
                    /* ─── Edit form ─── */
                    <form
                      onSubmit={handleSaveEdit}
                      className="flex flex-col gap-2 p-3 rounded-xl"
                      style={{ border: '1px solid var(--accent-border)' }}
                    >
                      <input
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={inputStyle}
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Spell name"
                        required
                        autoFocus
                      />
                      <textarea
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y"
                        style={{ ...inputStyle, fontFamily: 'var(--sans)', minHeight: '120px' }}
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        placeholder="Spell description — paste from any source"
                        rows={6}
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer"
                          style={{ background: 'var(--accent)', border: 'none' }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelForm}
                          className="py-2 px-4 rounded-lg text-sm cursor-pointer"
                          style={{ color: 'var(--text)', background: 'transparent', border: '1px solid var(--border)' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteSpell(spell.id);
                            cancelForm();
                          }}
                          className="py-2 px-4 rounded-lg text-sm cursor-pointer"
                          style={{ background: '#ef4444', color: 'white', border: 'none' }}
                        >
                          Delete
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* ─── Spell card ─── */
                    <div
                      className="rounded-xl"
                      style={{ border: '1px solid var(--border)' }}
                    >
                      <div
                        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
                        onClick={() =>
                          setExpandedSpellId(
                            expandedSpellId === spell.id ? null : spell.id,
                          )
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) =>
                          e.key === 'Enter' &&
                          setExpandedSpellId(
                            expandedSpellId === spell.id ? null : spell.id,
                          )
                        }
                      >
                        {/* Prepared toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateSpell(spell.id, { prepared: !spell.prepared });
                          }}
                          className="w-6 h-6 rounded flex items-center justify-center shrink-0 cursor-pointer"
                          style={{
                            background: spell.prepared ? 'var(--accent)' : 'transparent',
                            border: spell.prepared
                              ? '2px solid var(--accent)'
                              : '2px solid var(--border)',
                            color: spell.prepared ? 'white' : 'transparent',
                            fontSize: '11px',
                          }}
                          aria-label={`${spell.prepared ? 'Unprepare' : 'Prepare'} ${spell.name}`}
                        >
                          ✓
                        </button>

                        <span
                          className="flex-1 text-sm font-medium truncate"
                          style={{
                            color: spell.prepared ? 'var(--text-h)' : 'var(--text)',
                          }}
                        >
                          {spell.name}
                        </span>

                        <span
                          className="text-xs shrink-0"
                          style={{ color: 'var(--text)' }}
                        >
                          {expandedSpellId === spell.id ? '▾' : '▸'}
                        </span>
                      </div>

                      {/* Expanded description — selectable for copy */}
                      {expandedSpellId === spell.id && (
                        <div
                          className="px-3 pb-3"
                          style={{ borderTop: '1px solid var(--border)' }}
                        >
                          {spell.description ? (
                            <p
                              className="text-sm mt-2 m-0"
                              style={{
                                color: 'var(--text)',
                                whiteSpace: 'pre-wrap',
                                userSelect: 'text',
                                lineHeight: '1.6',
                              }}
                            >
                              {spell.description}
                            </p>
                          ) : (
                            <p
                              className="text-sm mt-2 m-0 italic"
                              style={{ color: 'var(--text)' }}
                            >
                              No description.
                            </p>
                          )}
                          <button
                            onClick={() => startEdit(spell)}
                            className="mt-3 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                            style={{
                              background: 'var(--accent-bg)',
                              color: 'var(--accent)',
                              border: '1px solid var(--accent-border)',
                            }}
                          >
                            Edit Spell
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* "No spells" placeholder */}
              {levelSpells.length === 0 && !search && addingAtLevel !== level && (
                <p className="text-sm m-0" style={{ color: 'var(--text)' }}>
                  No spells at this level yet.
                </p>
              )}

              {/* Add spell form */}
              {addingAtLevel === level ? (
                <form
                  onSubmit={handleAdd}
                  className="flex flex-col gap-2 p-3 rounded-xl"
                  style={{ border: '1px solid var(--accent-border)' }}
                >
                  <input
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={inputStyle}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Spell name"
                    required
                    autoFocus
                  />
                  <textarea
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y"
                    style={{ ...inputStyle, fontFamily: 'var(--sans)', minHeight: '120px' }}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Spell description — paste from any source"
                    rows={6}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer"
                      style={{ background: 'var(--accent)', border: 'none' }}
                    >
                      Add Spell
                    </button>
                    <button
                      type="button"
                      onClick={cancelForm}
                      className="py-2 px-4 rounded-lg text-sm cursor-pointer"
                      style={{ color: 'var(--text)', background: 'transparent', border: '1px solid var(--border)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                !search && (
                  <button
                    onClick={() => startAdd(level)}
                    className="w-full py-2 rounded-lg text-sm cursor-pointer"
                    style={{
                      background: 'var(--accent-bg)',
                      color: 'var(--accent)',
                      border: '1px solid var(--accent-border)',
                    }}
                  >
                    + Add Spell
                  </button>
                )
              )}
            </div>
          </section>
        );
      })}

      {/* Search/filter found nothing */}
      {(search || filter === 'prepared') && filteredSpells.length === 0 && (
        <p className="text-center py-8" style={{ color: 'var(--text)' }}>
          {search
            ? `No spells matching "${search}"${filter === 'prepared' ? ' in prepared spells' : ''}`
            : 'No spells prepared yet — toggle the checkbox on a spell to prepare it.'}
        </p>
      )}
    </div>
  );
}

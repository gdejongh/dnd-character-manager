import { useState, useRef } from 'react';
import type { FormEvent } from 'react';
import type { SpellSlot, Spell, ActionType } from '../types/database';
import { NumericInput } from './NumericInput';
import { ActionTypePicker, ActionTypeBadge, ActionTypeFilterBar } from './ActionType';
import type { ActionTypeFilter } from '../constants/actionTypes';
import { Search, X, Wand2, BookOpen } from 'lucide-react';
import { getSpellSlotProgression, isWarlock, getWarlockPactInfo } from '../constants/dnd';
import { SpellDatabaseModal } from './SpellDatabaseModal';

interface SpellSlotsProps {
  slots: SpellSlot[];
  spells: Spell[];
  preparedLimit: number | null;
  characterClass: string;
  characterLevel: number;
  concentrationSpellId: string | null;
  onUpdateTotal: (level: number, total: number) => void;
  onSetSlotUsed: (level: number, used: number) => void;
  onAutoFillSlots: (slotTotals: Record<number, number>) => void;
  onAddSpell: (name: string, description: string, level: number, actionType: ActionType, concentration: boolean) => void;
  onUpdateSpell: (id: string, updates: Partial<Pick<Spell, 'name' | 'description' | 'level' | 'prepared' | 'concentration' | 'action_type'>>) => void;
  onDeleteSpell: (id: string) => void;
  onSetConcentration: (spellId: string | null) => void;
  readOnly?: boolean;
}

const LEVEL_LABELS: Record<number, string> = {
  0: 'Cantrips',
  1: '1st Level',
  2: '2nd Level',
  3: '3rd Level',
  4: '4th Level',
  5: '5th Level',
  6: '6th Level',
  7: '7th Level',
  8: '8th Level',
  9: '9th Level',
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
  characterClass,
  characterLevel,
  concentrationSpellId,
  onUpdateTotal,
  onSetSlotUsed,
  onAutoFillSlots,
  onAddSpell,
  onUpdateSpell,
  onDeleteSpell,
  onSetConcentration,
  readOnly,
}: SpellSlotsProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'prepared'>('all');
  const [actionFilter, setActionFilter] = useState<ActionTypeFilter>('all');
  const [expandedSpellId, setExpandedSpellId] = useState<string | null>(null);
  const [addingAtLevel, setAddingAtLevel] = useState<number | null>(null);
  const [editingSpellId, setEditingSpellId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formActionType, setFormActionType] = useState<ActionType>('action');
  const [formConcentration, setFormConcentration] = useState(false);
  const [drainingSlot, setDrainingSlot] = useState<string | null>(null);
  const [showSrdBrowser, setShowSrdBrowser] = useState(false);
  const drainTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function isSpellPrepared(spell: Spell) {
    return spell.level === 0 || spell.prepared;
  }

  const q = search.toLowerCase();
  const filteredSpells = spells.filter((s) => {
    if (filter === 'prepared' && !isSpellPrepared(s)) return false;
    if (actionFilter !== 'all' && s.action_type !== actionFilter) return false;
    if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) return false;
    return true;
  });

  const preparedCount = spells.filter((s) => s.prepared && s.level > 0).length;
  const isOverLimit = preparedLimit !== null && preparedCount > preparedLimit;

  function spellsAtLevel(level: number) {
    return filteredSpells.filter((s) => s.level === level);
  }

  function handleSlotToggle(slot: SpellSlot, index: number, isUsed: boolean) {
    const key = `${slot.level}-${index}`;
    setDrainingSlot(key);
    clearTimeout(drainTimeoutRef.current);
    drainTimeoutRef.current = setTimeout(() => setDrainingSlot(null), 350);
    if (isUsed) onSetSlotUsed(slot.level, slot.used - 1);
    else onSetSlotUsed(slot.level, slot.used + 1);
  }

  function startAdd(level: number) {
    setEditingSpellId(null);
    setAddingAtLevel(level);
    setFormName('');
    setFormDesc('');
    setFormActionType('action');
    setFormConcentration(false);
  }

  function startEdit(spell: Spell) {
    setAddingAtLevel(null);
    setEditingSpellId(spell.id);
    setFormName(spell.name);
    setFormDesc(spell.description);
    setFormActionType(spell.action_type ?? 'action');
    setFormConcentration(spell.concentration ?? false);
  }

  function cancelForm() {
    setAddingAtLevel(null);
    setEditingSpellId(null);
    setFormName('');
    setFormDesc('');
    setFormActionType('action');
    setFormConcentration(false);
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!formName.trim() || addingAtLevel === null) return;
    onAddSpell(formName.trim(), formDesc.trim(), addingAtLevel, formActionType, addingAtLevel > 0 && formConcentration);
    cancelForm();
  }

  function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !editingSpellId) return;
    const editingSpell = spells.find(s => s.id === editingSpellId);
    const conc = editingSpell && editingSpell.level > 0 ? formConcentration : false;
    onUpdateSpell(editingSpellId, { name: formName.trim(), description: formDesc.trim(), action_type: formActionType, concentration: conc });
    // If we un-marked concentration on the spell we're concentrating on, drop it
    if (!conc && concentrationSpellId === editingSpellId) {
      onSetConcentration(null);
    }
    cancelForm();
  }

  const levels = [0, ...slots.map((s) => s.level)];

  const warlockMode = isWarlock(characterClass);
  const pactInfo = warlockMode ? getWarlockPactInfo(characterLevel) : null;
  const suggestedSlots = getSpellSlotProgression(characterClass, characterLevel);
  const hasSuggestedSlots = Object.keys(suggestedSlots).length > 0;

  function handleAutoFill() {
    onAutoFillSlots(suggestedSlots);
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-4">
      {hasSuggestedSlots && !readOnly && (
        <div
          className="flex items-center justify-between p-3 rounded-xl"
          style={{
            background: warlockMode ? 'rgba(139, 92, 246, 0.08)' : 'var(--bg-surface)',
            border: `1px solid ${warlockMode ? 'var(--spell-border)' : 'var(--border)'}`,
          }}
        >
          <div className="flex flex-col">
            <span className="text-xs font-semibold" style={{ color: warlockMode ? 'var(--spell-violet)' : 'var(--text)', fontFamily: 'var(--heading)' }}>
              {warlockMode ? 'Pact Magic' : 'Spell Slots'}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {warlockMode && pactInfo
                ? `${pactInfo.slotCount} slot${pactInfo.slotCount > 1 ? 's' : ''} at ${pactInfo.slotLevel}${pactInfo.slotLevel === 1 ? 'st' : pactInfo.slotLevel === 2 ? 'nd' : pactInfo.slotLevel === 3 ? 'rd' : 'th'} level · Short rest recovery`
                : `${characterClass || 'Class'} level ${characterLevel}`}
            </span>
          </div>
          <button
            onClick={handleAutoFill}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(135deg, var(--spell-indigo), var(--spell-violet))',
              color: 'white',
              border: 'none',
              fontFamily: 'var(--heading)',
              letterSpacing: '0.3px',
            }}
          >
            <Wand2 size={12} /> Auto-fill
          </button>
        </div>
      )}

      {/* Browse SRD Spells Button */}
      {!readOnly && (
        <button
          onClick={() => setShowSrdBrowser(true)}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold cursor-pointer active:scale-[0.98] transition-transform"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
            color: 'var(--spell-violet)',
            border: '1px solid var(--spell-border)',
            fontFamily: 'var(--heading)',
            letterSpacing: '0.3px',
          }}
        >
          <BookOpen size={15} /> Browse SRD Spells
        </button>
      )}

      {/* SRD Spell Database Modal */}
      {showSrdBrowser && (
        <SpellDatabaseModal
          characterClass={characterClass}
          onAddSpell={onAddSpell}
          onClose={() => setShowSrdBrowser(false)}
        />
      )}

      {/* Active Concentration Banner */}
      {concentrationSpellId && (() => {
        const concSpell = spells.find(s => s.id === concentrationSpellId);
        if (!concSpell) return null;
        return (
          <div
            className="flex items-center justify-between px-3 py-2.5 rounded-xl animate-fade-in"
            style={{
              background: 'rgba(251, 191, 36, 0.08)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
            }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '14px' }}>🔮</span>
              <div className="flex flex-col">
                <span className="text-xs font-semibold" style={{ color: '#fbbf24', fontFamily: 'var(--heading)' }}>
                  Concentrating
                </span>
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-h)' }}>
                  {concSpell.name}
                </span>
              </div>
            </div>
            {!readOnly && (
              <button
                onClick={() => onSetConcentration(null)}
                className="px-3 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer active:scale-95 transition-transform"
                style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)', fontFamily: 'var(--heading)' }}
              >
                Drop
              </button>
            )}
          </div>
        );
      })()}

      {/* Search bar */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--spell-indigo)' }} />
        <input
          type="text"
          placeholder="Search spells by name or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none"
          style={{ ...inputStyle, borderColor: 'var(--spell-border)' }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer"
            style={{ color: 'var(--text)' }}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter toggle */}
      <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--spell-border)' }}>
        {(['all', 'prepared'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-1 py-2.5 text-sm font-medium cursor-pointer transition-colors"
            style={{
              background: filter === f
                ? (f === 'prepared' ? 'var(--spell-indigo)' : 'var(--spell-violet)')
                : 'var(--code-bg)',
              color: filter === f ? 'white' : 'var(--text)',
              border: 'none',
              fontFamily: filter === f ? 'var(--heading)' : 'var(--sans)',
              letterSpacing: filter === f ? '0.3px' : '0',
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

      {/* Action type filter */}
      <ActionTypeFilterBar
        value={actionFilter}
        onChange={setActionFilter}
        counts={{
          all: spells.length,
          action: spells.filter((s) => s.action_type === 'action').length,
          bonus_action: spells.filter((s) => s.action_type === 'bonus_action').length,
          reaction: spells.filter((s) => s.action_type === 'reaction').length,
          other: spells.filter((s) => (!s.action_type || s.action_type === 'other')).length,
        }}
      />

      {/* Over-limit warning */}
      {isOverLimit && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm animate-fade-in"
          style={{
            background: 'rgba(201, 168, 76, 0.1)',
            border: '1px solid var(--accent-border)',
            color: 'var(--accent)',
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

      {/* Spell Levels */}

      {/* Spell levels */}
      <div className="md:grid md:grid-cols-2 md:gap-4 flex flex-col gap-4">
      {levels.map((level) => {
        const slot = slots.find((s) => s.level === level);
        const levelSpells = spellsAtLevel(level);

        if ((search || filter === 'prepared') && levelSpells.length === 0) return null;

        return (
          <section
            key={level}
            className="rounded-xl overflow-hidden"
            style={{
              border: '1px solid var(--spell-border)',
              background: 'var(--bg-surface)',
            }}
          >
            {/* Level header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                background: level === 0
                  ? 'linear-gradient(135deg, var(--bg-raised), var(--bg-surface))'
                  : 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
                borderBottom: '1px solid var(--spell-border)',
              }}
            >
              <span
                className="font-semibold text-sm"
                style={{ color: 'var(--spell-violet)', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}
              >
                {LEVEL_LABELS[level]}
              </span>
              <div className="flex items-center gap-3">
                {level > 0 && slot && (
                  <span className="text-xs font-mono" style={{ color: 'var(--spell-indigo)' }}>
                    {slot.total - slot.used}/{slot.total} slots
                  </span>
                )}
                {level === 0 && (
                  <span className="text-xs italic" style={{ color: 'var(--text)' }}>
                    At will
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {/* Slot orbs */}
              {level > 0 && slot && !search && (
                <div className="flex items-center gap-3 flex-wrap">
                  {slot.total > 0 && (
                    <>
                      {Array.from({ length: slot.total }, (_, i) => {
                        const isUsed = i < slot.used;
                        const key = `${slot.level}-${i}`;
                        const isDraining = drainingSlot === key;
                        return (
                          <button
                            key={i}
                            onClick={() => { if (!readOnly) handleSlotToggle(slot, i, isUsed); }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${readOnly ? '' : 'cursor-pointer'} transition-all ${isDraining ? 'slot-drain' : ''}`}
                            style={{
                              background: isUsed
                                ? 'var(--bg-raised)'
                                : 'linear-gradient(135deg, var(--spell-indigo), var(--spell-violet))',
                              border: isUsed
                                ? '2px solid var(--border)'
                                : '2px solid var(--spell-violet)',
                              boxShadow: isUsed ? 'none' : '0 0 8px rgba(99,102,241,0.4)',
                              fontSize: '16px',
                              color: isUsed ? 'var(--border-light)' : 'white',
                            }}
                            aria-label={`Slot ${i + 1}: ${isUsed ? 'used' : 'available'}`}
                          >
                            {isUsed ? '○' : '◆'}
                          </button>
                        );
                      })}
                    </>
                  )}
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-xs" style={{ color: 'var(--text)' }}>Slots:</span>
                    <NumericInput
                      min={0}
                      max={9}
                      value={slot.total}
                      onChange={(val) => onUpdateTotal(slot.level, val)}
                      className="w-12 text-center px-1 py-0.5 rounded outline-none text-sm"
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              {/* Spells at this level */}
              {levelSpells.map((spell) => {
                const isCantrip = spell.level === 0;
                const isPrepared = isSpellPrepared(spell);

                return (
                <div key={spell.id}>
                  {editingSpellId === spell.id ? (
                    <form
                      onSubmit={handleSaveEdit}
                      className="flex flex-col gap-2 p-3 rounded-xl"
                      style={{ border: '1px solid var(--spell-border)', background: 'var(--spell-bg)' }}
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
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
                          Casting Time
                        </span>
                        <ActionTypePicker value={formActionType} onChange={setFormActionType} />
                      </div>
                      {spell.level > 0 && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <button
                            type="button"
                            onClick={() => setFormConcentration(!formConcentration)}
                            className="w-5 h-5 rounded flex items-center justify-center shrink-0 cursor-pointer"
                            style={{
                              background: formConcentration ? 'rgba(251, 191, 36, 0.2)' : 'transparent',
                              border: formConcentration ? '2px solid #fbbf24' : '2px solid var(--border-light)',
                              color: formConcentration ? '#fbbf24' : 'transparent',
                              fontSize: '11px',
                            }}
                          >
                            C
                          </button>
                          <span className="text-xs" style={{ color: 'var(--text)' }}>Concentration</span>
                        </label>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer"
                          style={{ background: 'var(--spell-indigo)', color: 'white', border: 'none' }}
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
                          onClick={() => { onDeleteSpell(spell.id); cancelForm(); }}
                          className="py-2 px-4 rounded-lg text-sm cursor-pointer"
                          style={{ background: 'var(--danger)', color: 'white', border: 'none' }}
                        >
                          Delete
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div
                      className="rounded-xl"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg-raised)' }}
                    >
                      <div
                        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
                        onClick={() => setExpandedSpellId(expandedSpellId === spell.id ? null : spell.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setExpandedSpellId(expandedSpellId === spell.id ? null : spell.id)}
                      >
                        {isCantrip ? (
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                            style={{
                              background: 'var(--spell-indigo)',
                              border: '2px solid var(--spell-indigo)',
                              color: 'white',
                              fontSize: '11px',
                              boxShadow: '0 0 6px rgba(99,102,241,0.4)',
                            }}
                            aria-label={`Cantrip ${spell.name} is always prepared`}
                            title="Cantrips are always prepared"
                          >
                            ✓
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); if (!readOnly) onUpdateSpell(spell.id, { prepared: !spell.prepared }); }}
                            className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${readOnly ? '' : 'cursor-pointer'}`}
                            style={{
                              background: isPrepared ? 'var(--spell-indigo)' : 'transparent',
                              border: isPrepared ? '2px solid var(--spell-indigo)' : '2px solid var(--border-light)',
                              color: isPrepared ? 'white' : 'transparent',
                              fontSize: '11px',
                              boxShadow: isPrepared ? '0 0 6px rgba(99,102,241,0.4)' : 'none',
                            }}
                            aria-label={`${isPrepared ? 'Unprepare' : 'Prepare'} ${spell.name}`}
                          >
                            ✓
                          </button>
                        )}
                        <span
                          className="flex-1 text-sm font-medium truncate"
                          style={{ color: isPrepared ? 'var(--text-h)' : 'var(--text)' }}
                        >
                          {spell.name}
                        </span>
                        <ActionTypeBadge type={spell.action_type ?? 'action'} small />
                        {spell.concentration && (
                          <span
                            className="shrink-0 text-[9px] font-bold rounded px-1.5 py-0.5"
                            style={{
                              background: concentrationSpellId === spell.id ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.08)',
                              color: concentrationSpellId === spell.id ? '#fbbf24' : 'rgba(251, 191, 36, 0.6)',
                              border: concentrationSpellId === spell.id ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid rgba(251, 191, 36, 0.2)',
                            }}
                            title="Concentration"
                          >
                            C
                          </span>
                        )}
                        <span className="text-xs shrink-0" style={{ color: 'var(--spell-indigo)' }}>
                          {expandedSpellId === spell.id ? '▾' : '▸'}
                        </span>
                      </div>

                      {expandedSpellId === spell.id && (
                        <div className="px-3 pb-3 animate-fade-in" style={{ borderTop: '1px solid var(--border)' }}>
                          {spell.description ? (
                            <p
                              className="text-sm mt-2 m-0"
                              style={{ color: 'var(--text)', whiteSpace: 'pre-wrap', userSelect: 'text', lineHeight: '1.6' }}
                            >
                              {spell.description}
                            </p>
                          ) : (
                            <p className="text-sm mt-2 m-0 italic" style={{ color: 'var(--text)' }}>
                              No description.
                            </p>
                          )}
                          {!readOnly && (
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => startEdit(spell)}
                              className="px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                              style={{ background: 'var(--spell-bg)', color: 'var(--spell-violet)', border: '1px solid var(--spell-border)' }}
                            >
                              Edit Spell
                            </button>
                            {spell.concentration && spell.level > 0 && (
                              concentrationSpellId === spell.id ? (
                                <button
                                  onClick={() => onSetConcentration(null)}
                                  className="px-3 py-1.5 rounded-lg text-xs cursor-pointer active:scale-95 transition-transform"
                                  style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)' }}
                                >
                                  Drop Concentration
                                </button>
                              ) : (
                                <button
                                  onClick={() => onSetConcentration(spell.id)}
                                  className="px-3 py-1.5 rounded-lg text-xs cursor-pointer active:scale-95 transition-transform"
                                  style={{ background: 'rgba(251, 191, 36, 0.08)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.2)' }}
                                >
                                  Concentrate
                                </button>
                              )
                            )}
                          </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
              })}

              {levelSpells.length === 0 && !search && addingAtLevel !== level && (
                <p className="text-sm m-0 italic" style={{ color: 'var(--text)' }}>
                  No spells at this level yet.
                </p>
              )}

              {!readOnly && (addingAtLevel === level ? (
                <form
                  onSubmit={handleAdd}
                  className="flex flex-col gap-2 p-3 rounded-xl"
                  style={{ border: '1px solid var(--spell-border)', background: 'var(--spell-bg)' }}
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
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
                      Casting Time
                    </span>
                    <ActionTypePicker value={formActionType} onChange={setFormActionType} />
                  </div>
                  {level > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setFormConcentration(!formConcentration)}
                        className="w-5 h-5 rounded flex items-center justify-center shrink-0 cursor-pointer"
                        style={{
                          background: formConcentration ? 'rgba(251, 191, 36, 0.2)' : 'transparent',
                          border: formConcentration ? '2px solid #fbbf24' : '2px solid var(--border-light)',
                          color: formConcentration ? '#fbbf24' : 'transparent',
                          fontSize: '11px',
                        }}
                      >
                        C
                      </button>
                      <span className="text-xs" style={{ color: 'var(--text)' }}>Concentration</span>
                    </label>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer"
                      style={{ background: 'var(--spell-indigo)', color: 'white', border: 'none' }}
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
                    className="w-full py-2.5 rounded-lg text-sm cursor-pointer"
                    style={{
                      background: 'var(--spell-bg)',
                      color: 'var(--spell-violet)',
                      border: '1px solid var(--spell-border)',
                    }}
                  >
                    + Add Spell
                  </button>
                )
              ))}
            </div>
          </section>
        );
      })}
      </div>

      {(search || filter === 'prepared') && filteredSpells.length === 0 && (
        <p className="text-center py-8" style={{ color: 'var(--text)' }}>
          {search
            ? `No spells matching "${search}"${filter === 'prepared' ? ' in prepared spells' : ''}`
            : 'No spells prepared yet — cantrips are always prepared; use the checkbox for leveled spells.'}
        </p>
      )}
      </div>
    </div>
  );
}

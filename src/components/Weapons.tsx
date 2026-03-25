import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Weapon, ActionType, AbilityScore, Ability } from '../types/database';
import {
  getWeaponAttackBonus,
  formatWeaponDamage,
  formatModifier,
} from '../constants/dnd';
import { ActionTypePicker, ActionTypeBadge } from './ActionType';
import { Swords, Trash2, Pencil } from 'lucide-react';

interface WeaponsProps {
  weapons: Weapon[];
  scores: AbilityScore[];
  level: number;
  onAdd: (
    name: string,
    damageDice: string,
    damageType: string,
    abilityMod: 'STR' | 'DEX',
    proficient: boolean,
    actionType: ActionType,
  ) => void;
  onUpdate: (
    id: string,
    updates: Partial<Pick<Weapon, 'name' | 'damage_dice' | 'damage_type' | 'ability_mod' | 'proficient' | 'action_type'>>,
  ) => void;
  onDelete: (id: string) => void;
}

const DAMAGE_TYPES = [
  'slashing', 'piercing', 'bludgeoning',
  'fire', 'cold', 'lightning', 'thunder',
  'acid', 'poison', 'necrotic', 'radiant',
  'force', 'psychic',
];

const inputStyle = {
  background: 'var(--code-bg)',
  color: 'var(--text-h)',
  border: '1px solid var(--border)',
};

export function Weapons({ weapons, scores, level, onAdd, onUpdate, onDelete }: WeaponsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Add form state
  const [name, setName] = useState('');
  const [damageDice, setDamageDice] = useState('1d8');
  const [damageType, setDamageType] = useState('slashing');
  const [abilityMod, setAbilityMod] = useState<'STR' | 'DEX'>('STR');
  const [proficient, setProficient] = useState(true);
  const [actionType, setActionType] = useState<ActionType>('action');

  const abilityScoreMap = Object.fromEntries(
    (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const).map((a) => [
      a,
      scores.find((s) => s.ability === a)?.score ?? 10,
    ]),
  ) as Record<Ability, number>;

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), damageDice.trim() || '1d4', damageType, abilityMod, proficient, actionType);
    setName('');
    setDamageDice('1d8');
    setDamageType('slashing');
    setAbilityMod('STR');
    setProficient(true);
    setActionType('action');
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Swords size={18} style={{ color: 'var(--hp-crimson)' }} />
        <h3
          className="text-xs uppercase tracking-widest m-0 flex-1"
          style={{ fontFamily: 'var(--heading)', letterSpacing: '2px', color: 'var(--hp-crimson)' }}
        >
          Weapons &amp; Attacks
        </h3>
        <span className="text-xs" style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>
          {weapons.length} weapon{weapons.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Weapon List */}
      {weapons.length === 0 && !showForm && (
        <div
          className="text-center py-8 rounded-xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <Swords size={32} style={{ color: 'var(--border-light)', margin: '0 auto 8px' }} />
          <p className="text-sm m-0" style={{ color: 'var(--text)' }}>No weapons yet.</p>
          <p className="text-xs m-0 mt-1" style={{ color: 'var(--text)' }}>Add your first weapon or attack!</p>
        </div>
      )}

      <div className="md:grid md:grid-cols-2 md:gap-4 flex flex-col gap-4">
      {weapons.map((weapon) => (
        editingId === weapon.id ? (
          <WeaponEditCard
            key={weapon.id}
            weapon={weapon}
            onUpdate={onUpdate}
            onDelete={() => { onDelete(weapon.id); setEditingId(null); }}
            onDone={() => setEditingId(null)}
          />
        ) : (
          <WeaponCard
            key={weapon.id}
            weapon={weapon}
            abilityScoreMap={abilityScoreMap}
            level={level}
            onEdit={() => setEditingId(weapon.id)}
          />
        )
      ))}
      </div>

      {/* Add Weapon Form */}
      {showForm ? (
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 p-4 rounded-xl"
          style={{ border: '1px solid var(--accent-border)', background: 'var(--bg-surface)' }}
        >
          <input
            className="w-full px-4 py-3 rounded-lg text-sm outline-none"
            style={inputStyle}
            placeholder="Weapon name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}>
                Damage Dice
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
                placeholder="1d8"
                value={damageDice}
                onChange={(e) => setDamageDice(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}>
                Damage Type
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
                style={inputStyle}
                value={damageType}
                onChange={(e) => setDamageType(e.target.value)}
              >
                {DAMAGE_TYPES.map((dt) => (
                  <option key={dt} value={dt}>{dt.charAt(0).toUpperCase() + dt.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}>
                Ability
              </label>
              <div className="flex gap-1.5">
                {(['STR', 'DEX'] as const).map((ab) => (
                  <button
                    key={ab}
                    type="button"
                    onClick={() => setAbilityMod(ab)}
                    className="px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all"
                    style={{
                      background: abilityMod === ab ? 'var(--accent-bg)' : 'var(--code-bg)',
                      color: abilityMod === ab ? 'var(--accent)' : 'var(--text)',
                      border: abilityMod === ab ? '2px solid var(--accent-border)' : '1px solid var(--border)',
                      fontFamily: 'var(--heading)',
                    }}
                  >
                    {ab}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}>
                Proficient
              </label>
              <button
                type="button"
                onClick={() => setProficient(!proficient)}
                className="px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all"
                style={{
                  background: proficient ? 'rgba(34,197,94,0.15)' : 'var(--code-bg)',
                  color: proficient ? '#22c55e' : 'var(--text)',
                  border: proficient ? '2px solid rgba(34,197,94,0.4)' : '1px solid var(--border)',
                  fontFamily: 'var(--heading)',
                }}
              >
                {proficient ? '✓ Yes' : 'No'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}>
              Action Type
            </label>
            <ActionTypePicker value={actionType} onChange={setActionType} />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-3 rounded-lg text-sm cursor-pointer"
              style={{ color: 'var(--text)', background: 'transparent', border: '1px solid var(--border)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-lg font-semibold text-sm cursor-pointer"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))', color: '#0f0e13', border: 'none' }}
            >
              Add Weapon
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl font-semibold text-sm cursor-pointer"
          style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
        >
          + Add Weapon
        </button>
      )}
      </div>
    </div>
  );
}

/* ── Weapon Display Card ─────────────────────────────────────────────────── */

function WeaponCard({
  weapon,
  abilityScoreMap,
  level,
  onEdit,
}: {
  weapon: Weapon;
  abilityScoreMap: Record<Ability, number>;
  level: number;
  onEdit: () => void;
}) {
  const atkBonus = getWeaponAttackBonus(level, abilityScoreMap, weapon.ability_mod, weapon.proficient);
  const dmgStr = formatWeaponDamage(weapon.damage_dice, abilityScoreMap, weapon.ability_mod, weapon.damage_type);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', letterSpacing: '0.3px' }}
            >
              {weapon.name}
            </span>
            <ActionTypeBadge type={weapon.action_type} small />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--text)' }}>
              <span style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', fontSize: '10px' }}>ATK </span>
              <span style={{ color: 'var(--text-h)', fontFamily: 'var(--mono)', fontWeight: 700 }}>
                {formatModifier(atkBonus)}
              </span>
            </span>
            <span className="text-xs" style={{ color: 'var(--text)' }}>
              <span style={{ color: 'var(--hp-crimson)', fontFamily: 'var(--heading)', fontSize: '10px' }}>DMG </span>
              <span style={{ color: 'var(--text-h)', fontFamily: 'var(--mono)', fontWeight: 700 }}>
                {dmgStr}
              </span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full"
            style={{ color: 'var(--text)', background: 'var(--code-bg)', fontFamily: 'var(--heading)' }}
          >
            {weapon.ability_mod}
          </span>
          {weapon.proficient && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ color: '#22c55e', background: 'rgba(34,197,94,0.1)', fontFamily: 'var(--heading)' }}
            >
              PROF
            </span>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg cursor-pointer bg-transparent"
            style={{ color: 'var(--text)', border: 'none' }}
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Weapon Edit Card ────────────────────────────────────────────────────── */

function WeaponEditCard({
  weapon,
  onUpdate,
  onDelete,
  onDone,
}: {
  weapon: Weapon;
  onUpdate: WeaponsProps['onUpdate'];
  onDelete: () => void;
  onDone: () => void;
}) {
  return (
    <div
      className="rounded-xl p-4 animate-fade-in flex flex-col gap-3"
      style={{ border: '1px solid var(--accent-border)', background: 'var(--bg-raised)' }}
    >
      <input
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={inputStyle}
        value={weapon.name}
        onChange={(e) => onUpdate(weapon.id, { name: e.target.value })}
        placeholder="Weapon name"
      />

      <div className="flex gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}>
            Damage Dice
          </label>
          <input
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
            value={weapon.damage_dice}
            onChange={(e) => onUpdate(weapon.id, { damage_dice: e.target.value })}
            placeholder="1d8"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}>
            Damage Type
          </label>
          <select
            className="w-full px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
            style={inputStyle}
            value={weapon.damage_type}
            onChange={(e) => onUpdate(weapon.id, { damage_type: e.target.value })}
          >
            {DAMAGE_TYPES.map((dt) => (
              <option key={dt} value={dt}>{dt.charAt(0).toUpperCase() + dt.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}>
            Ability
          </label>
          <div className="flex gap-1.5">
            {(['STR', 'DEX'] as const).map((ab) => (
              <button
                key={ab}
                type="button"
                onClick={() => onUpdate(weapon.id, { ability_mod: ab })}
                className="px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all"
                style={{
                  background: weapon.ability_mod === ab ? 'var(--accent-bg)' : 'var(--code-bg)',
                  color: weapon.ability_mod === ab ? 'var(--accent)' : 'var(--text)',
                  border: weapon.ability_mod === ab ? '2px solid var(--accent-border)' : '1px solid var(--border)',
                  fontFamily: 'var(--heading)',
                }}
              >
                {ab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}>
            Proficient
          </label>
          <button
            type="button"
            onClick={() => onUpdate(weapon.id, { proficient: !weapon.proficient })}
            className="px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all"
            style={{
              background: weapon.proficient ? 'rgba(34,197,94,0.15)' : 'var(--code-bg)',
              color: weapon.proficient ? '#22c55e' : 'var(--text)',
              border: weapon.proficient ? '2px solid rgba(34,197,94,0.4)' : '1px solid var(--border)',
              fontFamily: 'var(--heading)',
            }}
          >
            {weapon.proficient ? '✓ Yes' : 'No'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}>
          Action Type
        </label>
        <ActionTypePicker value={weapon.action_type} onChange={(v) => onUpdate(weapon.id, { action_type: v })} />
      </div>

      <div className="flex gap-2">
        <button
          className="flex-1 py-2 rounded-lg text-sm cursor-pointer"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))', color: '#0f0e13', border: 'none' }}
          onClick={onDone}
        >
          Done
        </button>
        <button
          className="py-2 px-4 rounded-lg text-sm cursor-pointer flex items-center gap-1"
          style={{ background: 'var(--danger)', color: 'white', border: 'none' }}
          onClick={onDelete}
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
}

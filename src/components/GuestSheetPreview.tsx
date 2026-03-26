import { useState, useEffect, useCallback } from 'react';
import type { Ability, AbilityScore, SpellSlot, Spell, Weapon, Feature, ActionType } from '../types/database';
import type { GuestCharacterData, GuestScoreData } from './GuestCharacterBuilder';
import { ABILITIES, ABILITY_NAMES, getModifier, formatModifier, getProficiencyBonus, getPreparedSpellLimit } from '../constants/dnd';
import { SpellSlots } from './SpellSlots';
import { Weapons } from './Weapons';
import { FeaturesTraits } from './FeaturesTraits';
import {
  Shield, Heart, Footprints, Sparkles, Pencil, Trash2,
  Backpack, ScrollText, Flame, Users, Lock,
  BookOpen, Swords, Scroll, Star,
} from 'lucide-react';

const GUEST_EXTRAS_KEY = 'dnd-guest-extras';

interface GuestExtras {
  slots: SpellSlot[];
  spells: Spell[];
  weapons: Weapon[];
  features: Feature[];
  concentrationSpellId: string | null;
}

function loadExtras(): GuestExtras {
  try {
    const stored = localStorage.getItem(GUEST_EXTRAS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {
    slots: Array.from({ length: 9 }, (_, i) => ({
      id: crypto.randomUUID(),
      character_id: 'guest',
      level: i + 1,
      total: 0,
      used: 0,
    })),
    spells: [],
    weapons: [],
    features: [],
    concentrationSpellId: null,
  };
}

function saveExtras(extras: GuestExtras) {
  localStorage.setItem(GUEST_EXTRAS_KEY, JSON.stringify(extras));
}

type GuestTab = 'sheet' | 'spells' | 'weapons' | 'features';

const GUEST_TABS: { key: GuestTab; label: string; icon: typeof Shield }[] = [
  { key: 'sheet', label: 'Sheet', icon: Shield },
  { key: 'spells', label: 'Spells', icon: BookOpen },
  { key: 'weapons', label: 'Arms', icon: Swords },
  { key: 'features', label: 'Traits', icon: Star },
];

interface GuestSheetPreviewProps {
  character: GuestCharacterData;
  scores: GuestScoreData[];
  onCreateAccount: () => void;
  onEdit: () => void;
  onStartOver: () => void;
}

export function GuestSheetPreview({
  character,
  scores,
  onCreateAccount,
  onEdit,
  onStartOver,
}: GuestSheetPreviewProps) {
  const [activeTab, setActiveTab] = useState<GuestTab>('sheet');
  const [extras, setExtras] = useState<GuestExtras>(loadExtras);

  // Persist extras to localStorage on change
  useEffect(() => { saveExtras(extras); }, [extras]);

  const scoreMap = Object.fromEntries(scores.map((s) => [s.ability, s.score])) as Record<Ability, number>;
  const profBonus = getProficiencyBonus(character.level);
  const preparedLimit = getPreparedSpellLimit(character.class, character.level, scoreMap);

  // Build full AbilityScore objects for the Weapons component
  const abilityScoreObjects: AbilityScore[] = ABILITIES.map((ability) => ({
    id: `guest-${ability}`,
    character_id: 'guest',
    ability,
    score: scoreMap[ability] ?? 10,
    saving_throw_proficiency: false,
  }));

  // ── Spell Slot mutations ──
  const updateTotal = useCallback(async (level: number, total: number) => {
    setExtras((prev) => ({
      ...prev,
      slots: prev.slots.map((s) => s.level === level ? { ...s, total, used: 0 } : s),
    }));
  }, []);

  const setSlotUsed = useCallback(async (level: number, used: number) => {
    setExtras((prev) => ({
      ...prev,
      slots: prev.slots.map((s) => s.level === level ? { ...s, used: Math.max(0, Math.min(s.total, used)) } : s),
    }));
  }, []);

  const autoFillSlots = useCallback(async (slotTotals: Record<number, number>) => {
    setExtras((prev) => ({
      ...prev,
      slots: prev.slots.map((s) => ({ ...s, total: slotTotals[s.level] ?? 0, used: 0 })),
    }));
  }, []);

  // ── Spell mutations ──
  const addSpell = useCallback(async (name: string, description: string, level: number, actionType: ActionType = 'action', concentration: boolean = false) => {
    const spell: Spell = {
      id: crypto.randomUUID(),
      character_id: 'guest',
      name,
      description,
      level,
      prepared: false,
      concentration,
      action_type: actionType,
      created_at: new Date().toISOString(),
    };
    setExtras((prev) => ({ ...prev, spells: [...prev.spells, spell] }));
  }, []);

  const updateSpell = useCallback(async (id: string, updates: Partial<Pick<Spell, 'name' | 'description' | 'level' | 'prepared' | 'concentration' | 'action_type'>>) => {
    setExtras((prev) => ({
      ...prev,
      spells: prev.spells.map((s) => s.id === id ? { ...s, ...updates } : s),
    }));
  }, []);

  const deleteSpell = useCallback(async (id: string) => {
    setExtras((prev) => ({
      ...prev,
      spells: prev.spells.filter((s) => s.id !== id),
      concentrationSpellId: prev.concentrationSpellId === id ? null : prev.concentrationSpellId,
    }));
  }, []);

  const setConcentration = useCallback(async (spellId: string | null) => {
    setExtras((prev) => ({ ...prev, concentrationSpellId: spellId }));
  }, []);

  // ── Weapon mutations ──
  const addWeapon = useCallback(async (name: string, damageDice: string, damageType: string, abilityMod: 'STR' | 'DEX', proficient: boolean, actionType: ActionType = 'action') => {
    const weapon: Weapon = {
      id: crypto.randomUUID(),
      character_id: 'guest',
      name,
      damage_dice: damageDice,
      damage_type: damageType,
      ability_mod: abilityMod,
      proficient,
      action_type: actionType,
      created_at: new Date().toISOString(),
    };
    setExtras((prev) => ({ ...prev, weapons: [...prev.weapons, weapon] }));
  }, []);

  const updateWeapon = useCallback(async (id: string, updates: Partial<Pick<Weapon, 'name' | 'damage_dice' | 'damage_type' | 'ability_mod' | 'proficient' | 'action_type'>>) => {
    setExtras((prev) => ({
      ...prev,
      weapons: prev.weapons.map((w) => w.id === id ? { ...w, ...updates } : w),
    }));
  }, []);

  const deleteWeapon = useCallback(async (id: string) => {
    setExtras((prev) => ({ ...prev, weapons: prev.weapons.filter((w) => w.id !== id) }));
  }, []);

  // ── Feature mutations ──
  const addFeature = useCallback(async (title: string, description: string, source: string, actionType: ActionType = 'other', maxUses: number | null = null) => {
    const feature: Feature = {
      id: crypto.randomUUID(),
      character_id: 'guest',
      title,
      description,
      source,
      action_type: actionType,
      max_uses: maxUses,
      used_uses: 0,
      created_at: new Date().toISOString(),
    };
    setExtras((prev) => ({ ...prev, features: [...prev.features, feature] }));
  }, []);

  const updateFeature = useCallback(async (id: string, updates: Partial<Pick<Feature, 'title' | 'description' | 'source' | 'action_type' | 'max_uses' | 'used_uses'>>) => {
    setExtras((prev) => ({
      ...prev,
      features: prev.features.map((f) => f.id === id ? { ...f, ...updates } : f),
    }));
  }, []);

  const deleteFeature = useCallback(async (id: string) => {
    setExtras((prev) => ({ ...prev, features: prev.features.filter((f) => f.id !== id) }));
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-6 pb-24">
      {/* Save banner */}
      <div
        className="w-full max-w-2xl mb-4 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-3 animate-fade-in"
        style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}
      >
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm font-semibold" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}>
            Save {character.name}?
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
            Create a free account to save your character and unlock all features.
          </p>
        </div>
        <button
          onClick={onCreateAccount}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer whitespace-nowrap"
          style={{
            background: 'var(--accent)',
            color: '#0f0e13',
            border: 'none',
            fontFamily: 'var(--heading)',
            letterSpacing: '0.5px',
          }}
        >
          Create Account
        </button>
      </div>

      {/* Character header */}
      <div className="w-full max-w-2xl mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 style={{ fontFamily: 'var(--heading)', fontSize: '1.6rem', color: 'var(--accent)', margin: 0 }}>
              {character.name}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
              {[character.race, character.class, `Level ${character.level}`].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
              style={{ background: 'var(--bg-surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              onClick={onStartOver}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
              style={{ background: 'var(--bg-surface)', color: 'var(--danger-bright)', border: '1px solid var(--border)' }}
            >
              <Trash2 size={12} /> Start Over
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="w-full max-w-2xl flex gap-1 mb-4 p-1 rounded-xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {GUEST_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            style={{
              background: activeTab === key ? 'var(--accent)' : 'transparent',
              color: activeTab === key ? '#0f0e13' : 'var(--text)',
              border: 'none',
              fontFamily: 'var(--heading)',
              letterSpacing: '0.3px',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="w-full max-w-2xl animate-fade-in">
        {activeTab === 'sheet' && (
          <div
            className="p-5 sm:p-8 rounded-2xl"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
          >
            {/* Stat bar */}
            <div
              className="grid grid-cols-4 gap-3 mb-6 p-3 rounded-xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              {[
                { icon: Heart, label: 'HP', value: `${character.max_hp}`, color: 'var(--hp-green)' },
                { icon: Shield, label: 'AC', value: `${character.armor_class}`, color: 'var(--spell-indigo)' },
                { icon: Footprints, label: 'Speed', value: `${character.speed} ft`, color: 'var(--text-h)' },
                { icon: Sparkles, label: 'Prof.', value: formatModifier(profBonus), color: 'var(--accent)' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <Icon size={16} style={{ color }} />
                  <span className="text-lg font-bold" style={{ color }}>{value}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text)' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Ability scores */}
            <h3 className="text-xs font-bold mb-3 uppercase" style={{ color: 'var(--text)', letterSpacing: '1.5px' }}>
              Ability Scores
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
              {ABILITIES.map((ability) => {
                const score = scoreMap[ability] ?? 10;
                const mod = getModifier(score);
                return (
                  <div
                    key={ability}
                    className="flex flex-col items-center p-3 rounded-xl"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                  >
                    <span className="text-[10px] font-bold" style={{ color: 'var(--accent)', letterSpacing: '1px' }}>{ability}</span>
                    <span className="text-[9px] mb-1" style={{ color: 'var(--text)' }}>{ABILITY_NAMES[ability]}</span>
                    <span className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>{score}</span>
                    <span className="text-xs font-bold mt-0.5" style={{ color: mod >= 0 ? 'var(--hp-green)' : 'var(--danger-bright)' }}>
                      {formatModifier(mod)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Locked features teaser */}
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Lock size={14} style={{ color: 'var(--text)' }} />
                <span className="text-xs font-bold uppercase" style={{ color: 'var(--text)', letterSpacing: '1px' }}>
                  More with an account
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { icon: Backpack, label: 'Inventory' },
                  { icon: ScrollText, label: 'Notes' },
                  { icon: Flame, label: 'Combat Tracker' },
                  { icon: Users, label: 'Share & Party' },
                  { icon: Scroll, label: 'HP Tracker' },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', opacity: 0.5 }}
                  >
                    <Icon size={14} style={{ color: 'var(--text)' }} />
                    <span className="text-xs" style={{ color: 'var(--text)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'spells' && (
          <SpellSlots
            slots={extras.slots}
            spells={extras.spells}
            preparedLimit={preparedLimit}
            characterClass={character.class}
            characterLevel={character.level}
            concentrationSpellId={extras.concentrationSpellId}
            onUpdateTotal={updateTotal}
            onSetSlotUsed={setSlotUsed}
            onAutoFillSlots={autoFillSlots}
            onAddSpell={addSpell}
            onUpdateSpell={updateSpell}
            onDeleteSpell={deleteSpell}
            onSetConcentration={setConcentration}
          />
        )}

        {activeTab === 'weapons' && (
          <Weapons
            weapons={extras.weapons}
            scores={abilityScoreObjects}
            level={character.level}
            onAdd={addWeapon}
            onUpdate={updateWeapon}
            onDelete={deleteWeapon}
          />
        )}

        {activeTab === 'features' && (
          <FeaturesTraits
            features={extras.features}
            onAdd={addFeature}
            onUpdate={updateFeature}
            onDelete={deleteFeature}
          />
        )}
      </div>
    </div>
  );
}

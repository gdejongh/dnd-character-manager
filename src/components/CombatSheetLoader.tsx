import { useCallback, useEffect } from 'react';
import type { Character, Spell, Feature, Weapon, ActionType } from '../types/database';
import { useCharacter } from '../hooks/useCharacter';
import { useAbilityScores } from '../hooks/useAbilityScores';
import { useSpellSlots } from '../hooks/useSpellSlots';
import { useSpells } from '../hooks/useSpells';
import { useWeapons } from '../hooks/useWeapons';
import { useFeatures } from '../hooks/useFeatures';
import { CombatView } from './CombatView';

export interface ResourceConsumers {
  consumeSpellSlot: (level: number) => Promise<void>;
  consumeFeatureUse: (featureId: string) => Promise<void>;
  restoreSpellSlot: (level: number) => Promise<void>;
  restoreFeatureUse: (featureId: string) => Promise<void>;
}

interface CombatSheetLoaderProps {
  characterId: string;
  /** Optional callback to sync HP changes to the combat session tables */
  onCombatHpSync?: (newHp: number) => void;
  /** Authoritative current HP from the combat session (realtime-synced) */
  combatantHp?: number;
  /** When provided, Cast/Use/Attack buttons trigger this instead of internal animation handlers */
  onActionInitiated?: (action: {
    spell?: Spell;
    feature?: Feature;
    weapon?: Weapon;
    actionType: ActionType;
    spellSlotLevel?: number;
  }) => void;
  /** Action types already used this turn */
  usedActionTypes?: ReadonlySet<string>;
  /** Ref that receives resource consumption functions for the parent to call */
  resourceConsumersRef?: React.RefObject<ResourceConsumers | null>;
  /** When true, only reactions are usable (not this user's turn) */
  offTurn?: boolean;
}

export function CombatSheetLoader({ characterId, onCombatHpSync, combatantHp, onActionInitiated, usedActionTypes, resourceConsumersRef, offTurn }: CombatSheetLoaderProps) {
  const { character, loading: charLoading, updateCharacter } = useCharacter(characterId);
  const { scores, loading: scoresLoading } = useAbilityScores(characterId);
  const { slots, setSlotUsed } = useSpellSlots(characterId);
  const { spells } = useSpells(characterId);
  const { weapons } = useWeapons(characterId);
  const { features, updateFeature } = useFeatures(characterId);

  // Expose resource consumption functions to parent via ref
  useEffect(() => {
    if (!resourceConsumersRef) return;
    resourceConsumersRef.current = {
      consumeSpellSlot: async (level: number) => {
        const slot = slots.find((s) => s.level === level);
        if (slot && slot.used < slot.total) {
          await setSlotUsed(level, slot.used + 1);
        }
      },
      consumeFeatureUse: async (featureId: string) => {
        const feature = features.find((f) => f.id === featureId);
        if (feature && feature.max_uses !== null && feature.used_uses < feature.max_uses) {
          await updateFeature(featureId, { used_uses: feature.used_uses + 1 });
        }
      },
      restoreSpellSlot: async (level: number) => {
        const slot = slots.find((s) => s.level === level);
        if (slot && slot.used > 0) {
          await setSlotUsed(level, slot.used - 1);
        }
      },
      restoreFeatureUse: async (featureId: string) => {
        const feature = features.find((f) => f.id === featureId);
        if (feature && feature.used_uses > 0) {
          await updateFeature(featureId, { used_uses: feature.used_uses - 1 });
        }
      },
    };
    return () => { resourceConsumersRef.current = null; };
  });

  const handleUpdateCharacter = useCallback(
    (updates: Partial<Pick<Character, 'current_hp' | 'max_hp' | 'temp_hp'>>) => {
      updateCharacter(updates);
      if (onCombatHpSync && updates.current_hp !== undefined) {
        onCombatHpSync(updates.current_hp);
      }
    },
    [updateCharacter, onCombatHpSync],
  );

  if (charLoading || scoresLoading) {
    return (
      <div className="flex items-center justify-center flex-1" style={{ minHeight: '40vh' }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full"
            style={{ border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'diceRoll 1s linear infinite' }}
          />
          <p style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>Loading combat sheet…</p>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex items-center justify-center flex-1" style={{ minHeight: '40vh' }}>
        <p style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>Character not found</p>
      </div>
    );
  }

  // Override character HP with authoritative combat HP when provided
  const effectiveCharacter = combatantHp !== undefined
    ? { ...character, current_hp: combatantHp }
    : character;

  return (
    <CombatView
      character={effectiveCharacter}
      scores={scores}
      slots={slots}
      spells={spells}
      weapons={weapons}
      features={features}
      onUpdateCharacter={handleUpdateCharacter}
      onSetSlotUsed={setSlotUsed}
      onUpdateFeature={updateFeature}
      onActionInitiated={onActionInitiated}
      usedActionTypes={usedActionTypes}
      offTurn={offTurn}
    />
  );
}

import { useCallback } from 'react';
import type { Character } from '../types/database';
import { useCharacter } from '../hooks/useCharacter';
import { useAbilityScores } from '../hooks/useAbilityScores';
import { useSpellSlots } from '../hooks/useSpellSlots';
import { useSpells } from '../hooks/useSpells';
import { useFeatures } from '../hooks/useFeatures';
import { CombatView } from './CombatView';

interface CombatSheetLoaderProps {
  characterId: string;
  /** Optional callback to sync HP changes to the combat session tables */
  onCombatHpSync?: (newHp: number) => void;
}

export function CombatSheetLoader({ characterId, onCombatHpSync }: CombatSheetLoaderProps) {
  const { character, loading: charLoading, updateCharacter } = useCharacter(characterId);
  const { scores, loading: scoresLoading } = useAbilityScores(characterId);
  const { slots, setSlotUsed } = useSpellSlots(characterId);
  const { spells } = useSpells(characterId);
  const { features, updateFeature } = useFeatures(characterId);

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

  return (
    <CombatView
      character={character}
      scores={scores}
      slots={slots}
      spells={spells}
      features={features}
      onUpdateCharacter={handleUpdateCharacter}
      onSetSlotUsed={setSlotUsed}
      onUpdateFeature={updateFeature}
    />
  );
}

import type { Ability } from '../types/database';

export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export interface DieConfig {
  type: DieType;
  sides: number;
  label: string;
  emoji: string;
  color: string;
}

export const DICE: DieConfig[] = [
  { type: 'd4', sides: 4, label: 'D4', emoji: '🔺', color: '#ef4444' },
  { type: 'd6', sides: 6, label: 'D6', emoji: '🎲', color: '#f97316' },
  { type: 'd8', sides: 8, label: 'D8', emoji: '💎', color: '#eab308' },
  { type: 'd10', sides: 10, label: 'D10', emoji: '🔷', color: '#22c55e' },
  { type: 'd12', sides: 12, label: 'D12', emoji: '⬡', color: '#3b82f6' },
  { type: 'd20', sides: 20, label: 'D20', emoji: '⚡', color: '#8b5cf6' },
  { type: 'd100', sides: 100, label: 'D100', emoji: '💯', color: '#ec4899' },
];

export interface DiceRoll {
  id: string;
  notation: string;
  dice: { type: DieType; count: number }[];
  modifier: number;
  results: number[];
  total: number;
  advantage?: 'advantage' | 'disadvantage';
  isCrit?: boolean;
  isFumble?: boolean;
  label?: string;
  timestamp: number;
}

export interface QuickRollConfig {
  label: string;
  notation: string;
  category: 'ability' | 'save' | 'skill' | 'attack' | 'damage';
  icon: string;
}

export function buildQuickRolls(
  abilityScores: Record<Ability, number>,
  level: number,
  skillProficiencies: string[],
  savingThrowProficiencies: Ability[],
  weapons: { name: string; damage_dice: string; ability_mod: Ability; proficient: boolean }[],
): QuickRollConfig[] {
  const profBonus = Math.ceil(level / 4) + 1;

  function mod(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  function fmt(m: number): string {
    return m >= 0 ? `+${m}` : `${m}`;
  }

  const rolls: QuickRollConfig[] = [];

  // Ability checks
  const abilities: { key: Ability; name: string }[] = [
    { key: 'STR', name: 'Strength' },
    { key: 'DEX', name: 'Dexterity' },
    { key: 'CON', name: 'Constitution' },
    { key: 'INT', name: 'Intelligence' },
    { key: 'WIS', name: 'Wisdom' },
    { key: 'CHA', name: 'Charisma' },
  ];

  for (const { key, name } of abilities) {
    const m = mod(abilityScores[key] ?? 10);
    rolls.push({
      label: `${name} Check`,
      notation: `1d20${fmt(m)}`,
      category: 'ability',
      icon: '🎯',
    });
  }

  // Saving throws
  for (const { key, name } of abilities) {
    const m = mod(abilityScores[key] ?? 10);
    const prof = savingThrowProficiencies.includes(key);
    const total = m + (prof ? profBonus : 0);
    rolls.push({
      label: `${name} Save`,
      notation: `1d20${fmt(total)}`,
      category: 'save',
      icon: '🛡️',
    });
  }

  // Skills
  const SKILLS: { name: string; ability: Ability }[] = [
    { name: 'Acrobatics', ability: 'DEX' },
    { name: 'Animal Handling', ability: 'WIS' },
    { name: 'Arcana', ability: 'INT' },
    { name: 'Athletics', ability: 'STR' },
    { name: 'Deception', ability: 'CHA' },
    { name: 'History', ability: 'INT' },
    { name: 'Insight', ability: 'WIS' },
    { name: 'Intimidation', ability: 'CHA' },
    { name: 'Investigation', ability: 'INT' },
    { name: 'Medicine', ability: 'WIS' },
    { name: 'Nature', ability: 'INT' },
    { name: 'Perception', ability: 'WIS' },
    { name: 'Performance', ability: 'CHA' },
    { name: 'Persuasion', ability: 'CHA' },
    { name: 'Religion', ability: 'INT' },
    { name: 'Sleight of Hand', ability: 'DEX' },
    { name: 'Stealth', ability: 'DEX' },
    { name: 'Survival', ability: 'WIS' },
  ];

  for (const skill of SKILLS) {
    const m = mod(abilityScores[skill.ability] ?? 10);
    const prof = skillProficiencies.includes(skill.name);
    const total = m + (prof ? profBonus : 0);
    rolls.push({
      label: skill.name,
      notation: `1d20${fmt(total)}`,
      category: 'skill',
      icon: '📋',
    });
  }

  // Weapon attacks & damage
  for (const weapon of weapons) {
    const m = mod(abilityScores[weapon.ability_mod] ?? 10);
    const attackBonus = m + (weapon.proficient ? profBonus : 0);
    rolls.push({
      label: `${weapon.name} Attack`,
      notation: `1d20${fmt(attackBonus)}`,
      category: 'attack',
      icon: '⚔️',
    });
    if (weapon.damage_dice) {
      const dmgMod = m;
      rolls.push({
        label: `${weapon.name} Damage`,
        notation: `${weapon.damage_dice}${fmt(dmgMod)}`,
        category: 'damage',
        icon: '💥',
      });
    }
  }

  return rolls;
}

export const MAX_HISTORY = 50;

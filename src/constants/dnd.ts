import type { Ability } from '../types/database';

export const ABILITIES: Ability[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export const ABILITY_NAMES: Record<Ability, string> = {
  STR: 'Strength',
  DEX: 'Dexterity',
  CON: 'Constitution',
  INT: 'Intelligence',
  WIS: 'Wisdom',
  CHA: 'Charisma',
};

export interface Skill {
  name: string;
  ability: Ability;
}

export const SKILLS: Skill[] = [
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

export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/** Which ability governs spell preparation for each class (null = class doesn't prepare) */
const PREP_ABILITY: Record<string, Ability | null> = {
  wizard: 'INT',
  cleric: 'WIS',
  druid: 'WIS',
  paladin: 'CHA',
  artificer: 'INT',
};

/**
 * Returns the max number of spells a character can prepare, or null if the
 * class doesn't use preparation (e.g. sorcerer, bard, warlock, ranger).
 * Cantrips never count toward this limit.
 *
 * Formulas (5e):
 *  Wizard / Cleric / Druid: ability mod + class level (min 1)
 *  Paladin: ability mod + floor(level / 2) (min 1)
 *  Artificer: ability mod + ceil(level / 2) (min 1)
 */
export function getPreparedSpellLimit(
  className: string,
  level: number,
  abilityScores: Record<Ability, number>,
): number | null {
  const key = className.toLowerCase().trim();
  const ability = PREP_ABILITY[key];
  if (!ability) return null;

  const mod = getModifier(abilityScores[ability] ?? 10);

  if (key === 'paladin') return Math.max(1, mod + Math.floor(level / 2));
  if (key === 'artificer') return Math.max(1, mod + Math.ceil(level / 2));
  return Math.max(1, mod + level);
}

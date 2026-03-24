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

/** Normalize a class string like "Wizard: Chronurgy Magic" or "Cleric (Light)" to "wizard" */
function resolveClassKey(className: string): string {
  return className.toLowerCase().trim().split(/[\s:(/–-]/)[0];
}

/** Which ability governs spellcasting for each class */
const SPELLCASTING_ABILITY: Record<string, Ability | null> = {
  wizard: 'INT',
  cleric: 'WIS',
  druid: 'WIS',
  paladin: 'CHA',
  artificer: 'INT',
  bard: 'CHA',
  sorcerer: 'CHA',
  warlock: 'CHA',
  ranger: 'WIS',
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
  const key = resolveClassKey(className);
  const ability = SPELLCASTING_ABILITY[key];
  if (!ability) return null;

  const mod = getModifier(abilityScores[ability] ?? 10);

  if (key === 'paladin') return Math.max(1, mod + Math.floor(level / 2));
  if (key === 'artificer') return Math.max(1, mod + Math.ceil(level / 2));
  return Math.max(1, mod + level);
}

/** Returns the spellcasting ability for a given class, or null */
export function getSpellcastingAbility(className: string): Ability | null {
  return SPELLCASTING_ABILITY[resolveClassKey(className)] ?? null;
}

/** Spell Save DC = 8 + proficiency bonus + spellcasting ability modifier */
export function getSpellSaveDC(
  className: string,
  level: number,
  abilityScores: Record<Ability, number>,
): number | null {
  const ability = getSpellcastingAbility(className);
  if (!ability) return null;
  const mod = getModifier(abilityScores[ability] ?? 10);
  return 8 + getProficiencyBonus(level) + mod;
}

/** Spell Attack Bonus = proficiency bonus + spellcasting ability modifier */
export function getSpellAttackBonus(
  className: string,
  level: number,
  abilityScores: Record<Ability, number>,
): number | null {
  const ability = getSpellcastingAbility(className);
  if (!ability) return null;
  const mod = getModifier(abilityScores[ability] ?? 10);
  return getProficiencyBonus(level) + mod;
}

/** Weapon attack bonus = ability modifier + proficiency bonus (if proficient) */
export function getWeaponAttackBonus(
  level: number,
  abilityScores: Record<Ability, number>,
  abilityMod: Ability,
  proficient: boolean,
): number {
  const mod = getModifier(abilityScores[abilityMod] ?? 10);
  return mod + (proficient ? getProficiencyBonus(level) : 0);
}

/** Format weapon damage string, e.g. "1d8 + 3 slashing" */
export function formatWeaponDamage(
  damageDice: string,
  abilityScores: Record<Ability, number>,
  abilityMod: Ability,
  damageType: string,
): string {
  const mod = getModifier(abilityScores[abilityMod] ?? 10);
  const modStr = mod !== 0 ? ` ${formatModifier(mod)}` : '';
  return `${damageDice}${modStr} ${damageType}`;
}

/* ── Standard 5e Conditions ── */

export interface ConditionInfo {
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const CONDITIONS: ConditionInfo[] = [
  { name: 'Blinded', icon: '🙈', color: '#6b7280', description: 'Can\'t see. Auto-fail sight checks. Attacks have disadvantage; attacks against have advantage.' },
  { name: 'Charmed', icon: '💖', color: '#ec4899', description: 'Can\'t attack the charmer. Charmer has advantage on social checks.' },
  { name: 'Deafened', icon: '🔇', color: '#6b7280', description: 'Can\'t hear. Auto-fail hearing checks.' },
  { name: 'Exhaustion', icon: '😩', color: '#f59e0b', description: 'Cumulative penalties. Level 6 = death.' },
  { name: 'Frightened', icon: '😨', color: '#a855f7', description: 'Disadvantage on checks/attacks while source is in sight. Can\'t willingly move closer.' },
  { name: 'Grappled', icon: '🤼', color: '#f97316', description: 'Speed becomes 0. Ends if grappler is incapacitated or effect removes you.' },
  { name: 'Incapacitated', icon: '💫', color: '#ef4444', description: 'Can\'t take actions or reactions.' },
  { name: 'Invisible', icon: '👻', color: '#818cf8', description: 'Can\'t be seen without magic. Attacks have advantage; attacks against have disadvantage.' },
  { name: 'Paralyzed', icon: '⚡', color: '#eab308', description: 'Incapacitated. Can\'t move or speak. Auto-fail STR/DEX saves. Attacks have advantage; melee hits are crits.' },
  { name: 'Petrified', icon: '🪨', color: '#78716c', description: 'Turned to stone. Weight ×10. Resistant to all damage. Immune to poison/disease.' },
  { name: 'Poisoned', icon: '☠️', color: '#22c55e', description: 'Disadvantage on attack rolls and ability checks.' },
  { name: 'Prone', icon: '🛌', color: '#a3a3a3', description: 'Disadvantage on attacks. Melee attacks against have advantage; ranged have disadvantage.' },
  { name: 'Restrained', icon: '⛓️', color: '#f97316', description: 'Speed 0. Attacks have disadvantage. DEX saves have disadvantage. Attacks against have advantage.' },
  { name: 'Stunned', icon: '💥', color: '#facc15', description: 'Incapacitated. Can\'t move. Can speak only falteringly. Auto-fail STR/DEX saves.' },
  { name: 'Unconscious', icon: '💤', color: '#dc2626', description: 'Incapacitated. Can\'t move or speak. Unaware. Drop held items. Prone. Auto-fail STR/DEX saves.' },
];

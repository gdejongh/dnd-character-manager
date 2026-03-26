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

/* ── Wild Shape (Druid) ── */

export function isDruid(className: string): boolean {
  return resolveClassKey(className) === 'druid';
}

export interface WildShapeLimits {
  maxCR: number;
  canSwim: boolean;
  canFly: boolean;
}

/**
 * Wild Shape CR and movement limits by druid level (5e base rules).
 * Level 2: CR ≤ 1/4, no swim/fly
 * Level 4: CR ≤ 1/2, swim ok, no fly
 * Level 8: CR ≤ 1, swim + fly ok
 */
export function getWildShapeLimits(level: number): WildShapeLimits {
  if (level >= 8) return { maxCR: 1, canSwim: true, canFly: true };
  if (level >= 4) return { maxCR: 0.5, canSwim: true, canFly: false };
  return { maxCR: 0.25, canSwim: false, canFly: false };
}

/** Wild Shape uses per short rest (always 2 in 5e) */
export const WILD_SHAPE_USES = 2;

export const WILD_SHAPE_RULES = [
  'You retain your INT, WIS, and CHA scores.',
  'You can\'t cast spells. Transforming doesn\'t break concentration.',
  'You keep your proficiencies and gain the beast\'s as well.',
  'You can\'t use equipment, but merged gear continues to function.',
  'When beast HP hits 0, you revert and excess damage carries over.',
];

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

/* ── Hit Die per Class ── */

const HIT_DIE: Record<string, number> = {
  barbarian: 12,
  fighter: 10, paladin: 10, ranger: 10,
  bard: 8, cleric: 8, druid: 8, monk: 8, rogue: 8, warlock: 8, artificer: 8,
  sorcerer: 6, wizard: 6,
};

export function getHitDie(className: string): number {
  return HIT_DIE[resolveClassKey(className)] ?? 8;
}

/* ── Spell Slot Progression Tables (5e) ── */

// Index = level - 1; sub-array = [1st, 2nd, ..., 9th] slot totals
const FULL_CASTER_SLOTS: number[][] = [
  [2], [3], [4,2], [4,3], [4,3,2], [4,3,3], [4,3,3,1], [4,3,3,2],
  [4,3,3,3,1], [4,3,3,3,2], [4,3,3,3,2,1], [4,3,3,3,2,1],
  [4,3,3,3,2,1,1], [4,3,3,3,2,1,1], [4,3,3,3,2,1,1,1], [4,3,3,3,2,1,1,1],
  [4,3,3,3,2,1,1,1,1], [4,3,3,3,3,1,1,1,1], [4,3,3,3,3,2,1,1,1], [4,3,3,3,3,2,2,1,1],
];

// Half casters: Paladin, Ranger (no slots at level 1)
const HALF_CASTER_SLOTS: number[][] = [
  [], [2], [3], [3], [4,2], [4,2], [4,3], [4,3],
  [4,3,2], [4,3,2], [4,3,3], [4,3,3],
  [4,3,3,1], [4,3,3,1], [4,3,3,2], [4,3,3,2],
  [4,3,3,3,1], [4,3,3,3,1], [4,3,3,3,2], [4,3,3,3,2],
];

// Artificer: half-caster but gets 2 first-level slots at level 1
const ARTIFICER_SLOTS: number[][] = [
  [2], [2], [3], [3], [4,2], [4,2], [4,3], [4,3],
  [4,3,2], [4,3,2], [4,3,3], [4,3,3],
  [4,3,3,1], [4,3,3,1], [4,3,3,2], [4,3,3,2],
  [4,3,3,3,1], [4,3,3,3,1], [4,3,3,3,2], [4,3,3,3,2],
];

// Warlock pact magic: [slot count, slot level] per character level
const WARLOCK_PACT: [number, number][] = [
  [1,1], [2,1], [2,2], [2,2], [2,3], [2,3], [2,4], [2,4],
  [2,5], [2,5], [3,5], [3,5], [3,5], [3,5], [3,5], [3,5],
  [4,5], [4,5], [4,5], [4,5],
];

const FULL_CASTERS = ['wizard', 'cleric', 'druid', 'bard', 'sorcerer'];
const HALF_CASTERS = ['paladin', 'ranger'];

export function isWarlock(className: string): boolean {
  return resolveClassKey(className) === 'warlock';
}

/** Returns Warlock pact magic info for a given level */
export function getWarlockPactInfo(level: number): { slotCount: number; slotLevel: number } {
  const idx = Math.max(0, Math.min(19, level - 1));
  const [slotCount, slotLevel] = WARLOCK_PACT[idx];
  return { slotCount, slotLevel };
}

/** Returns spell slot totals by level (1–9) for a class at a given character level */
export function getSpellSlotProgression(className: string, level: number): Record<number, number> {
  const key = resolveClassKey(className);
  const idx = Math.max(0, Math.min(19, level - 1));

  if (key === 'warlock') {
    const [count, slotLevel] = WARLOCK_PACT[idx];
    return { [slotLevel]: count };
  }

  let table: number[];
  if (FULL_CASTERS.includes(key)) table = FULL_CASTER_SLOTS[idx];
  else if (HALF_CASTERS.includes(key)) table = HALF_CASTER_SLOTS[idx];
  else if (key === 'artificer') table = ARTIFICER_SLOTS[idx];
  else return {};

  const result: Record<number, number> = {};
  for (let i = 0; i < table.length; i++) {
    result[i + 1] = table[i];
  }
  return result;
}

/* ── Movement Speed Types (5e) ── */

export interface SpeedType {
  key: 'speed' | 'swim_speed' | 'fly_speed' | 'climb_speed' | 'burrow_speed';
  label: string;
  emoji: string;
}

export const SPEED_TYPES: SpeedType[] = [
  { key: 'speed', label: 'Walking', emoji: '🚶' },
  { key: 'swim_speed', label: 'Swimming', emoji: '🏊' },
  { key: 'fly_speed', label: 'Flying', emoji: '🪽' },
  { key: 'climb_speed', label: 'Climbing', emoji: '🧗' },
  { key: 'burrow_speed', label: 'Burrowing', emoji: '⛏️' },
];

export const EXTRA_SPEED_TYPES = SPEED_TYPES.filter(s => s.key !== 'speed');

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

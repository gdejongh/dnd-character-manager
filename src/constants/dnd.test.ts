import { describe, it, expect } from 'vitest';
import {
  getModifier,
  getProficiencyBonus,
  formatModifier,
  resolveClassKey,
  hasClass,
  getClassLevel,
  getTotalLevel,
  getWildShapeLimits,
  getPreparedSpellLimit,
  getSpellcastingAbility,
  getSpellSaveDC,
  getSpellAttackBonus,
  getWeaponAttackBonus,
  getHitDie,
  getWarlockPactInfo,
  getSpellSlotProgression,
  getMulticlassCasterLevel,
  getSpellSlotsForClasses,
  isWarlock,
  isDruid,
} from './dnd';
import type { Ability } from '../types/database';

const scores = (overrides: Partial<Record<Ability, number>> = {}): Record<Ability, number> => ({
  STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10,
  ...overrides,
});

describe('getModifier', () => {
  it('computes 5e ability modifiers', () => {
    expect(getModifier(1)).toBe(-5);
    expect(getModifier(8)).toBe(-1);
    expect(getModifier(9)).toBe(-1);
    expect(getModifier(10)).toBe(0);
    expect(getModifier(11)).toBe(0);
    expect(getModifier(15)).toBe(2);
    expect(getModifier(20)).toBe(5);
    expect(getModifier(30)).toBe(10);
  });
});

describe('getProficiencyBonus', () => {
  it('follows the 5e proficiency progression', () => {
    expect(getProficiencyBonus(1)).toBe(2);
    expect(getProficiencyBonus(4)).toBe(2);
    expect(getProficiencyBonus(5)).toBe(3);
    expect(getProficiencyBonus(8)).toBe(3);
    expect(getProficiencyBonus(9)).toBe(4);
    expect(getProficiencyBonus(13)).toBe(5);
    expect(getProficiencyBonus(17)).toBe(6);
    expect(getProficiencyBonus(20)).toBe(6);
  });
});

describe('formatModifier', () => {
  it('adds a plus sign for non-negative values', () => {
    expect(formatModifier(3)).toBe('+3');
    expect(formatModifier(0)).toBe('+0');
    expect(formatModifier(-2)).toBe('-2');
  });
});

describe('resolveClassKey', () => {
  it('normalizes subclass and formatting variations', () => {
    expect(resolveClassKey('Wizard: Chronurgy Magic')).toBe('wizard');
    expect(resolveClassKey('Cleric (Light)')).toBe('cleric');
    expect(resolveClassKey('  DRUID  ')).toBe('druid');
    expect(resolveClassKey('Fighter/Champion')).toBe('fighter');
  });
});

describe('multiclass helpers', () => {
  const classes = [
    { className: 'Wizard: Evocation', level: 5 },
    { className: 'Cleric', level: 3 },
  ];

  it('hasClass matches via normalized keys', () => {
    expect(hasClass(classes, 'wizard')).toBe(true);
    expect(hasClass(classes, 'druid')).toBe(false);
  });

  it('getClassLevel returns the matching level or 0', () => {
    expect(getClassLevel(classes, 'cleric')).toBe(3);
    expect(getClassLevel(classes, 'paladin')).toBe(0);
  });

  it('getTotalLevel sums all class levels', () => {
    expect(getTotalLevel(classes)).toBe(8);
    expect(getTotalLevel([])).toBe(0);
  });

  it('isWarlock and isDruid accept strings and class lists', () => {
    expect(isWarlock('Warlock (Fiend)')).toBe(true);
    expect(isWarlock(classes)).toBe(false);
    expect(isDruid('Druid: Circle of the Moon')).toBe(true);
    expect(isDruid(classes)).toBe(false);
  });
});

describe('getWildShapeLimits', () => {
  it('scales CR and movement with druid level', () => {
    expect(getWildShapeLimits(2)).toEqual({ maxCR: 0.25, canSwim: false, canFly: false });
    expect(getWildShapeLimits(4)).toEqual({ maxCR: 0.5, canSwim: true, canFly: false });
    expect(getWildShapeLimits(8)).toEqual({ maxCR: 1, canSwim: true, canFly: true });
    expect(getWildShapeLimits(20)).toEqual({ maxCR: 1, canSwim: true, canFly: true });
  });
});

describe('getPreparedSpellLimit', () => {
  it('uses ability mod + level for full preparers', () => {
    expect(getPreparedSpellLimit('Wizard', 5, scores({ INT: 16 }))).toBe(8);
    expect(getPreparedSpellLimit('Cleric', 3, scores({ WIS: 14 }))).toBe(5);
  });

  it('uses half level for paladin (down) and artificer (up)', () => {
    expect(getPreparedSpellLimit('Paladin', 5, scores({ CHA: 16 }))).toBe(5);
    expect(getPreparedSpellLimit('Artificer', 5, scores({ INT: 16 }))).toBe(6);
  });

  it('returns null for classes that do not prepare spells', () => {
    expect(getPreparedSpellLimit('Sorcerer', 5, scores())).toBeNull();
    expect(getPreparedSpellLimit('Fighter', 5, scores())).toBeNull();
  });

  it('never drops below 1', () => {
    expect(getPreparedSpellLimit('Wizard', 1, scores({ INT: 6 }))).toBe(1);
  });
});

describe('spellcasting derived stats', () => {
  it('getSpellcastingAbility maps classes to abilities', () => {
    expect(getSpellcastingAbility('Wizard')).toBe('INT');
    expect(getSpellcastingAbility('Warlock')).toBe('CHA');
    expect(getSpellcastingAbility('Fighter')).toBeNull();
  });

  it('getSpellSaveDC is 8 + proficiency + ability mod', () => {
    expect(getSpellSaveDC('Wizard', 5, scores({ INT: 16 }))).toBe(14);
    expect(getSpellSaveDC('Fighter', 5, scores())).toBeNull();
  });

  it('getSpellAttackBonus is proficiency + ability mod', () => {
    expect(getSpellAttackBonus('Cleric', 1, scores({ WIS: 16 }))).toBe(5);
    expect(getSpellAttackBonus('Barbarian', 1, scores())).toBeNull();
  });
});

describe('getWeaponAttackBonus', () => {
  it('adds proficiency only when proficient', () => {
    expect(getWeaponAttackBonus(5, scores({ STR: 18 }), 'STR', true)).toBe(7);
    expect(getWeaponAttackBonus(5, scores({ STR: 18 }), 'STR', false)).toBe(4);
  });
});

describe('getHitDie', () => {
  it('returns the class hit die with a d8 fallback', () => {
    expect(getHitDie('Barbarian')).toBe(12);
    expect(getHitDie('Fighter')).toBe(10);
    expect(getHitDie('Wizard')).toBe(6);
    expect(getHitDie('Homebrew Class')).toBe(8);
  });
});

describe('getWarlockPactInfo', () => {
  it('follows the pact magic table', () => {
    expect(getWarlockPactInfo(1)).toEqual({ slotCount: 1, slotLevel: 1 });
    expect(getWarlockPactInfo(5)).toEqual({ slotCount: 2, slotLevel: 3 });
    expect(getWarlockPactInfo(11)).toEqual({ slotCount: 3, slotLevel: 5 });
    expect(getWarlockPactInfo(17)).toEqual({ slotCount: 4, slotLevel: 5 });
  });

  it('clamps out-of-range levels', () => {
    expect(getWarlockPactInfo(0)).toEqual({ slotCount: 1, slotLevel: 1 });
    expect(getWarlockPactInfo(25)).toEqual({ slotCount: 4, slotLevel: 5 });
  });
});

describe('getSpellSlotProgression', () => {
  it('full casters use the full caster table', () => {
    expect(getSpellSlotProgression('Wizard', 1)).toEqual({ 1: 2 });
    expect(getSpellSlotProgression('Wizard', 5)).toEqual({ 1: 4, 2: 3, 3: 2 });
    expect(getSpellSlotProgression('Bard', 20)).toEqual({
      1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1,
    });
  });

  it('half casters start at level 2; artificer starts at level 1', () => {
    expect(getSpellSlotProgression('Paladin', 1)).toEqual({});
    expect(getSpellSlotProgression('Paladin', 2)).toEqual({ 1: 2 });
    expect(getSpellSlotProgression('Artificer', 1)).toEqual({ 1: 2 });
  });

  it('warlocks get pact slots only', () => {
    expect(getSpellSlotProgression('Warlock', 5)).toEqual({ 3: 2 });
  });

  it('non-casters get nothing', () => {
    expect(getSpellSlotProgression('Fighter', 10)).toEqual({});
  });
});

describe('getMulticlassCasterLevel', () => {
  it('full casters contribute all levels', () => {
    expect(getMulticlassCasterLevel([
      { className: 'Wizard', level: 5 },
      { className: 'Cleric', level: 3 },
    ])).toBe(8);
  });

  it('half casters contribute half rounded down, artificer rounded up', () => {
    expect(getMulticlassCasterLevel([{ className: 'Paladin', level: 5 }])).toBe(2);
    expect(getMulticlassCasterLevel([{ className: 'Ranger', level: 3 }])).toBe(1);
    expect(getMulticlassCasterLevel([{ className: 'Artificer', level: 3 }])).toBe(2);
  });

  it('warlock and non-casters contribute nothing', () => {
    expect(getMulticlassCasterLevel([
      { className: 'Warlock', level: 10 },
      { className: 'Fighter', level: 5 },
    ])).toBe(0);
  });
});

describe('getSpellSlotsForClasses', () => {
  it('returns empty for non-casters', () => {
    expect(getSpellSlotsForClasses([])).toEqual({});
    expect(getSpellSlotsForClasses([{ className: 'Fighter', level: 10 }])).toEqual({});
  });

  it('single caster uses its own class progression', () => {
    expect(getSpellSlotsForClasses([{ className: 'Wizard', level: 5 }]))
      .toEqual({ 1: 4, 2: 3, 3: 2 });
    // Paladin 3 keeps its half-caster table (3 slots), not the multiclass
    // formula (caster level 1 would give only 2)
    expect(getSpellSlotsForClasses([{ className: 'Paladin', level: 3 }]))
      .toEqual({ 1: 3 });
  });

  it('multiple casters share slots at the combined caster level', () => {
    // Wizard 3 / Cleric 2 → caster level 5
    expect(getSpellSlotsForClasses([
      { className: 'Wizard', level: 3 },
      { className: 'Cleric', level: 2 },
    ])).toEqual({ 1: 4, 2: 3, 3: 2 });

    // Paladin 2 / Wizard 3 → caster level 1 + 3 = 4
    expect(getSpellSlotsForClasses([
      { className: 'Paladin', level: 2 },
      { className: 'Wizard', level: 3 },
    ])).toEqual({ 1: 4, 2: 3 });
  });

  it('two half-casters below caster level 1 get no slots', () => {
    expect(getSpellSlotsForClasses([
      { className: 'Paladin', level: 1 },
      { className: 'Ranger', level: 1 },
    ])).toEqual({});
  });

  it('pure warlock gets pact slots', () => {
    expect(getSpellSlotsForClasses([{ className: 'Warlock', level: 5 }]))
      .toEqual({ 3: 2 });
  });

  it('warlock multiclass merges pact slots into the pool', () => {
    // Sorcerer 5 → {1:4, 2:3, 3:2}; Warlock 3 adds 2 pact slots at level 2
    expect(getSpellSlotsForClasses([
      { className: 'Sorcerer', level: 5 },
      { className: 'Warlock', level: 3 },
    ])).toEqual({ 1: 4, 2: 5, 3: 2 });
  });

  it('ignores non-caster classes in the mix', () => {
    expect(getSpellSlotsForClasses([
      { className: 'Wizard', level: 5 },
      { className: 'Fighter', level: 3 },
    ])).toEqual({ 1: 4, 2: 3, 3: 2 });
  });
});

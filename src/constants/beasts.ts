/**
 * Curated SRD beast stat blocks for Wild Shape.
 *
 * These are Open Game Content from the 5e SRD.
 * Only basic mechanical stats are included (no flavor text).
 */

export interface BeastAttack {
  name: string;
  toHitBonus: number;
  damage: string;
  damageType: string;
}

export interface Beast {
  name: string;
  cr: number;
  hp: number;
  ac: number;
  str: number;
  dex: number;
  con: number;
  speed: number;
  swimSpeed: number | null;
  flySpeed: number | null;
  climbSpeed: number | null;
  burrowSpeed: number | null;
  senses: string;
  attacks: BeastAttack[];
  specialTraits: string[];
}

export const BEASTS: Beast[] = [
  // ── CR 0 ──
  {
    name: 'Cat',
    cr: 0,
    hp: 2,
    ac: 12,
    str: 3, dex: 15, con: 10,
    speed: 40, swimSpeed: null, flySpeed: null, climbSpeed: 30, burrowSpeed: null,
    senses: 'Darkvision 30 ft.',
    attacks: [
      { name: 'Claws', toHitBonus: 0, damage: '1', damageType: 'slashing' },
    ],
    specialTraits: ['Keen Smell: Advantage on Perception checks using smell.'],
  },
  {
    name: 'Frog',
    cr: 0,
    hp: 1,
    ac: 11,
    str: 1, dex: 13, con: 8,
    speed: 20, swimSpeed: 20, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Darkvision 30 ft.',
    attacks: [],
    specialTraits: ['Amphibious: Can breathe air and water.', 'Standing Leap: Long jump 10 ft., high jump 5 ft.'],
  },
  {
    name: 'Hawk',
    cr: 0,
    hp: 1,
    ac: 13,
    str: 5, dex: 16, con: 8,
    speed: 10, swimSpeed: null, flySpeed: 60, climbSpeed: null, burrowSpeed: null,
    senses: 'Passive Perception 14',
    attacks: [
      { name: 'Talons', toHitBonus: 5, damage: '1', damageType: 'slashing' },
    ],
    specialTraits: ['Keen Sight: Advantage on Perception checks using sight.'],
  },
  {
    name: 'Spider',
    cr: 0,
    hp: 1,
    ac: 12,
    str: 2, dex: 14, con: 8,
    speed: 20, swimSpeed: null, flySpeed: null, climbSpeed: 20, burrowSpeed: null,
    senses: 'Darkvision 30 ft.',
    attacks: [
      { name: 'Bite', toHitBonus: 4, damage: '1', damageType: 'piercing' },
    ],
    specialTraits: ['Spider Climb: Can climb difficult surfaces including ceilings.', 'Web Sense: Knows location of any creature touching its web.'],
  },
  {
    name: 'Rat',
    cr: 0,
    hp: 1,
    ac: 10,
    str: 2, dex: 11, con: 9,
    speed: 20, swimSpeed: null, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Darkvision 30 ft.',
    attacks: [
      { name: 'Bite', toHitBonus: 0, damage: '1', damageType: 'piercing' },
    ],
    specialTraits: ['Keen Smell: Advantage on Perception checks using smell.'],
  },

  // ── CR 1/8 ──
  {
    name: 'Blood Hawk',
    cr: 0.125,
    hp: 7,
    ac: 12,
    str: 6, dex: 14, con: 10,
    speed: 10, swimSpeed: null, flySpeed: 60, climbSpeed: null, burrowSpeed: null,
    senses: 'Passive Perception 14',
    attacks: [
      { name: 'Beak', toHitBonus: 4, damage: '1d4+2', damageType: 'piercing' },
    ],
    specialTraits: ['Keen Sight: Advantage on Perception checks using sight.', 'Pack Tactics: Advantage on attack if ally is within 5 ft. of target.'],
  },
  {
    name: 'Giant Crab',
    cr: 0.125,
    hp: 13,
    ac: 15,
    str: 13, dex: 15, con: 11,
    speed: 30, swimSpeed: 30, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Blindsight 30 ft.',
    attacks: [
      { name: 'Claw', toHitBonus: 3, damage: '1d6+1', damageType: 'bludgeoning' },
    ],
    specialTraits: ['Amphibious: Can breathe air and water.'],
  },
  {
    name: 'Giant Rat',
    cr: 0.125,
    hp: 7,
    ac: 12,
    str: 7, dex: 15, con: 11,
    speed: 30, swimSpeed: null, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Darkvision 60 ft.',
    attacks: [
      { name: 'Bite', toHitBonus: 4, damage: '1d4+2', damageType: 'piercing' },
    ],
    specialTraits: ['Keen Smell: Advantage on Perception checks using smell.', 'Pack Tactics: Advantage on attack if ally is within 5 ft. of target.'],
  },
  {
    name: 'Poisonous Snake',
    cr: 0.125,
    hp: 2,
    ac: 13,
    str: 2, dex: 16, con: 11,
    speed: 30, swimSpeed: 30, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Blindsight 10 ft.',
    attacks: [
      { name: 'Bite', toHitBonus: 5, damage: '1 + 2d4 poison', damageType: 'piercing' },
    ],
    specialTraits: [],
  },

  // ── CR 1/4 ──
  {
    name: 'Boar',
    cr: 0.25,
    hp: 11,
    ac: 11,
    str: 13, dex: 11, con: 12,
    speed: 40, swimSpeed: null, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Passive Perception 9',
    attacks: [
      { name: 'Tusk', toHitBonus: 3, damage: '1d6+1', damageType: 'slashing' },
    ],
    specialTraits: ['Charge: +1d6 slashing on tusk hit after 20 ft. move. DC 11 STR save or prone.', 'Relentless (1/day): If reduced to 0 HP, drop to 1 HP instead.'],
  },
  {
    name: 'Constrictor Snake',
    cr: 0.25,
    hp: 13,
    ac: 12,
    str: 15, dex: 14, con: 12,
    speed: 30, swimSpeed: 30, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Blindsight 10 ft.',
    attacks: [
      { name: 'Bite', toHitBonus: 4, damage: '1d6+2', damageType: 'piercing' },
      { name: 'Constrict', toHitBonus: 4, damage: '1d8+2', damageType: 'bludgeoning' },
    ],
    specialTraits: [],
  },
  {
    name: 'Draft Horse',
    cr: 0.25,
    hp: 19,
    ac: 10,
    str: 18, dex: 10, con: 12,
    speed: 40, swimSpeed: null, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Passive Perception 10',
    attacks: [
      { name: 'Hooves', toHitBonus: 6, damage: '2d4+4', damageType: 'bludgeoning' },
    ],
    specialTraits: [],
  },
  {
    name: 'Elk',
    cr: 0.25,
    hp: 13,
    ac: 10,
    str: 16, dex: 10, con: 12,
    speed: 50, swimSpeed: null, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Passive Perception 10',
    attacks: [
      { name: 'Ram', toHitBonus: 5, damage: '1d6+3', damageType: 'bludgeoning' },
      { name: 'Hooves', toHitBonus: 5, damage: '2d4+3', damageType: 'bludgeoning' },
    ],
    specialTraits: ['Charge: +1d6 damage on ram hit after 20 ft. move. DC 13 STR save or prone.'],
  },
  {
    name: 'Giant Badger',
    cr: 0.25,
    hp: 13,
    ac: 10,
    str: 13, dex: 10, con: 15,
    speed: 30, swimSpeed: null, flySpeed: null, climbSpeed: null, burrowSpeed: 10,
    senses: 'Darkvision 30 ft.',
    attacks: [
      { name: 'Bite', toHitBonus: 3, damage: '1d6+1', damageType: 'piercing' },
      { name: 'Claws', toHitBonus: 3, damage: '2d4+1', damageType: 'slashing' },
    ],
    specialTraits: ['Keen Smell: Advantage on Perception checks using smell.'],
  },
  {
    name: 'Giant Frog',
    cr: 0.25,
    hp: 18,
    ac: 11,
    str: 12, dex: 13, con: 11,
    speed: 30, swimSpeed: 30, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Darkvision 30 ft.',
    attacks: [
      { name: 'Bite', toHitBonus: 3, damage: '1d6+1', damageType: 'piercing' },
    ],
    specialTraits: ['Amphibious: Can breathe air and water.', 'Standing Leap: Long jump 20 ft., high jump 10 ft.', 'Swallow: On hit, target grappled (escape DC 11). While swallowed, target blinded and restrained, takes 2d4 acid at start of frog turns.'],
  },
  {
    name: 'Giant Poisonous Snake',
    cr: 0.25,
    hp: 11,
    ac: 14,
    str: 10, dex: 18, con: 13,
    speed: 30, swimSpeed: 30, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Blindsight 10 ft.',
    attacks: [
      { name: 'Bite', toHitBonus: 6, damage: '1d4+4 + 3d6 poison', damageType: 'piercing' },
    ],
    specialTraits: [],
  },
  {
    name: 'Giant Wolf Spider',
    cr: 0.25,
    hp: 11,
    ac: 13,
    str: 12, dex: 16, con: 13,
    speed: 40, swimSpeed: null, flySpeed: null, climbSpeed: 40, burrowSpeed: null,
    senses: 'Blindsight 10 ft., Darkvision 60 ft.',
    attacks: [
      { name: 'Bite', toHitBonus: 3, damage: '1d6+1 + 2d6 poison', damageType: 'piercing' },
    ],
    specialTraits: ['Spider Climb: Can climb difficult surfaces including ceilings.', 'Web Sense: Knows location of any creature touching its web.'],
  },
  {
    name: 'Wolf',
    cr: 0.25,
    hp: 11,
    ac: 13,
    str: 12, dex: 15, con: 12,
    speed: 40, swimSpeed: null, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Passive Perception 13',
    attacks: [
      { name: 'Bite', toHitBonus: 4, damage: '2d4+2', damageType: 'piercing' },
    ],
    specialTraits: ['Keen Hearing and Smell: Advantage on Perception checks using hearing or smell.', 'Pack Tactics: Advantage on attack if ally is within 5 ft. of target.'],
  },

  // ── CR 1/2 ──
  {
    name: 'Ape',
    cr: 0.5,
    hp: 19,
    ac: 12,
    str: 16, dex: 14, con: 14,
    speed: 30, swimSpeed: null, flySpeed: null, climbSpeed: 30, burrowSpeed: null,
    senses: 'Passive Perception 12',
    attacks: [
      { name: 'Fist', toHitBonus: 5, damage: '1d6+3', damageType: 'bludgeoning' },
    ],
    specialTraits: [],
  },
  {
    name: 'Black Bear',
    cr: 0.5,
    hp: 19,
    ac: 11,
    str: 15, dex: 10, con: 14,
    speed: 40, swimSpeed: null, flySpeed: null, climbSpeed: 30, burrowSpeed: null,
    senses: 'Passive Perception 13',
    attacks: [
      { name: 'Bite', toHitBonus: 4, damage: '1d6+2', damageType: 'piercing' },
      { name: 'Claws', toHitBonus: 4, damage: '2d4+2', damageType: 'slashing' },
    ],
    specialTraits: ['Keen Smell: Advantage on Perception checks using smell.'],
  },
  {
    name: 'Crocodile',
    cr: 0.5,
    hp: 19,
    ac: 12,
    str: 15, dex: 10, con: 13,
    speed: 20, swimSpeed: 30, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Passive Perception 10',
    attacks: [
      { name: 'Bite', toHitBonus: 4, damage: '1d10+2', damageType: 'piercing' },
    ],
    specialTraits: ['Hold Breath: Can hold breath for 15 minutes.'],
  },
  {
    name: 'Giant Goat',
    cr: 0.5,
    hp: 19,
    ac: 11,
    str: 17, dex: 11, con: 12,
    speed: 40, swimSpeed: null, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Passive Perception 11',
    attacks: [
      { name: 'Ram', toHitBonus: 5, damage: '2d4+3', damageType: 'bludgeoning' },
    ],
    specialTraits: ['Charge: +2d4 damage on ram after 20 ft. move. DC 13 STR save or prone.', 'Sure-Footed: Advantage on saves against being knocked prone.'],
  },
  {
    name: 'Giant Wasp',
    cr: 0.5,
    hp: 13,
    ac: 12,
    str: 10, dex: 14, con: 10,
    speed: 10, swimSpeed: null, flySpeed: 50, climbSpeed: null, burrowSpeed: null,
    senses: 'Passive Perception 10',
    attacks: [
      { name: 'Sting', toHitBonus: 4, damage: '1d6+2 + 3d6 poison', damageType: 'piercing' },
    ],
    specialTraits: [],
  },
  {
    name: 'Reef Shark',
    cr: 0.5,
    hp: 22,
    ac: 12,
    str: 14, dex: 13, con: 13,
    speed: 0, swimSpeed: 40, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Blindsight 30 ft.',
    attacks: [
      { name: 'Bite', toHitBonus: 4, damage: '1d8+2', damageType: 'piercing' },
    ],
    specialTraits: ['Pack Tactics: Advantage on attack if ally is within 5 ft. of target.', 'Water Breathing: Can breathe only underwater.'],
  },
  {
    name: 'Warhorse',
    cr: 0.5,
    hp: 19,
    ac: 11,
    str: 18, dex: 12, con: 13,
    speed: 60, swimSpeed: null, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Passive Perception 11',
    attacks: [
      { name: 'Hooves', toHitBonus: 6, damage: '2d6+4', damageType: 'bludgeoning' },
    ],
    specialTraits: ['Trampling Charge: +2d6 damage on hooves after 20 ft. move. DC 14 STR save or prone.'],
  },

  // ── CR 1 ──
  {
    name: 'Brown Bear',
    cr: 1,
    hp: 34,
    ac: 11,
    str: 19, dex: 10, con: 16,
    speed: 40, swimSpeed: null, flySpeed: null, climbSpeed: 30, burrowSpeed: null,
    senses: 'Passive Perception 13',
    attacks: [
      { name: 'Bite', toHitBonus: 6, damage: '1d8+4', damageType: 'piercing' },
      { name: 'Claws', toHitBonus: 6, damage: '2d6+4', damageType: 'slashing' },
    ],
    specialTraits: ['Keen Smell: Advantage on Perception checks using smell.'],
  },
  {
    name: 'Dire Wolf',
    cr: 1,
    hp: 37,
    ac: 14,
    str: 17, dex: 15, con: 15,
    speed: 50, swimSpeed: null, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Passive Perception 13',
    attacks: [
      { name: 'Bite', toHitBonus: 5, damage: '2d6+3', damageType: 'piercing' },
    ],
    specialTraits: ['Keen Hearing and Smell: Advantage on Perception checks using hearing or smell.', 'Pack Tactics: Advantage on attack if ally is within 5 ft. of target.'],
  },
  {
    name: 'Giant Eagle',
    cr: 1,
    hp: 26,
    ac: 13,
    str: 16, dex: 17, con: 13,
    speed: 10, swimSpeed: null, flySpeed: 80, climbSpeed: null, burrowSpeed: null,
    senses: 'Passive Perception 14',
    attacks: [
      { name: 'Beak', toHitBonus: 5, damage: '1d6+3', damageType: 'piercing' },
      { name: 'Talons', toHitBonus: 5, damage: '2d6+3', damageType: 'slashing' },
    ],
    specialTraits: ['Keen Sight: Advantage on Perception checks using sight.'],
  },
  {
    name: 'Giant Hyena',
    cr: 1,
    hp: 45,
    ac: 12,
    str: 16, dex: 14, con: 14,
    speed: 50, swimSpeed: null, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Passive Perception 10',
    attacks: [
      { name: 'Bite', toHitBonus: 5, damage: '2d6+3', damageType: 'piercing' },
    ],
    specialTraits: ['Rampage: On reducing a creature to 0 HP, can move half speed and bite as bonus action.'],
  },
  {
    name: 'Giant Octopus',
    cr: 1,
    hp: 52,
    ac: 11,
    str: 17, dex: 13, con: 13,
    speed: 10, swimSpeed: 60, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Darkvision 60 ft.',
    attacks: [
      { name: 'Tentacles', toHitBonus: 5, damage: '2d6+3', damageType: 'bludgeoning' },
    ],
    specialTraits: ['Hold Breath: Can hold breath for 1 hour.', 'Underwater Camouflage: Advantage on Stealth checks while underwater.', 'Water Breathing: Can breathe only underwater.'],
  },
  {
    name: 'Giant Spider',
    cr: 1,
    hp: 26,
    ac: 14,
    str: 14, dex: 16, con: 12,
    speed: 30, swimSpeed: null, flySpeed: null, climbSpeed: 30, burrowSpeed: null,
    senses: 'Blindsight 10 ft., Darkvision 60 ft.',
    attacks: [
      { name: 'Bite', toHitBonus: 5, damage: '1d8+3 + 2d8 poison', damageType: 'piercing' },
      { name: 'Web (Recharge 5-6)', toHitBonus: 5, damage: 'Restrained', damageType: 'special' },
    ],
    specialTraits: ['Spider Climb: Can climb difficult surfaces including ceilings.', 'Web Sense: Knows location of any creature touching its web.', 'Web Walker: Ignores movement restrictions caused by webbing.'],
  },
  {
    name: 'Giant Toad',
    cr: 1,
    hp: 39,
    ac: 11,
    str: 15, dex: 13, con: 13,
    speed: 20, swimSpeed: 40, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Darkvision 30 ft.',
    attacks: [
      { name: 'Bite', toHitBonus: 4, damage: '1d10+2 + 1d10 poison', damageType: 'piercing' },
    ],
    specialTraits: ['Amphibious: Can breathe air and water.', 'Standing Leap: Long jump 20 ft., high jump 10 ft.', 'Swallow: On hit, target grappled and swallowed. Blinded, restrained, 3d6 acid per turn.'],
  },
  {
    name: 'Lion',
    cr: 1,
    hp: 26,
    ac: 12,
    str: 17, dex: 15, con: 13,
    speed: 50, swimSpeed: null, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Passive Perception 13',
    attacks: [
      { name: 'Bite', toHitBonus: 5, damage: '1d8+3', damageType: 'piercing' },
      { name: 'Claw', toHitBonus: 5, damage: '1d6+3', damageType: 'slashing' },
    ],
    specialTraits: ['Keen Smell: Advantage on Perception checks using smell.', 'Pack Tactics: Advantage on attack if ally is within 5 ft. of target.', 'Pounce: +1d6 claw damage after 20 ft. move. DC 13 STR save or prone, bonus action bite.'],
  },
  {
    name: 'Tiger',
    cr: 1,
    hp: 37,
    ac: 12,
    str: 17, dex: 15, con: 14,
    speed: 40, swimSpeed: null, flySpeed: null, climbSpeed: null, burrowSpeed: null,
    senses: 'Darkvision 60 ft.',
    attacks: [
      { name: 'Bite', toHitBonus: 5, damage: '1d10+3', damageType: 'piercing' },
      { name: 'Claw', toHitBonus: 5, damage: '1d8+3', damageType: 'slashing' },
    ],
    specialTraits: ['Keen Smell: Advantage on Perception checks using smell.', 'Pounce: +1d6 claw damage after 20 ft. move. DC 13 STR save or prone, bonus action bite.'],
  },
];

/** Format CR as a display string (e.g., 0.25 → "1/4") */
export function formatCR(cr: number): string {
  if (cr === 0) return '0';
  if (cr === 0.125) return '1/8';
  if (cr === 0.25) return '1/4';
  if (cr === 0.5) return '1/2';
  return String(cr);
}

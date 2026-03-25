export interface RuleEntry {
  name: string;
  icon: string;
  description: string;
}

export interface RuleSection {
  title: string;
  emoji: string;
  entries: RuleEntry[];
}

export const COMBAT_ACTIONS: RuleEntry[] = [
  {
    name: 'Attack',
    icon: '⚔️',
    description: 'Make one melee or ranged attack. Certain features (Extra Attack) let you make more than one attack with this action.',
  },
  {
    name: 'Cast a Spell',
    icon: '✨',
    description: 'Cast a spell with a casting time of 1 action. If a spell has a casting time of 1 bonus action, you can still use your action for something else.',
  },
  {
    name: 'Dash',
    icon: '💨',
    description: 'Gain extra movement equal to your speed (after applying any modifiers) for the current turn. This effectively doubles your movement.',
  },
  {
    name: 'Disengage',
    icon: '🛡️',
    description: 'Your movement doesn\'t provoke opportunity attacks for the rest of the turn.',
  },
  {
    name: 'Dodge',
    icon: '🔄',
    description: 'Until the start of your next turn, any attack roll against you has disadvantage if you can see the attacker, and you make DEX saving throws with advantage. You lose this benefit if you are incapacitated or your speed drops to 0.',
  },
  {
    name: 'Help',
    icon: '🤝',
    description: 'Aid an ally attacking a creature within 5 ft of you (next attack roll against that creature has advantage), or aid an ally in a task (they get advantage on next ability check for that task).',
  },
  {
    name: 'Hide',
    icon: '🫥',
    description: 'Make a Dexterity (Stealth) check to hide. If you succeed, you gain the benefits of being an unseen attacker (advantage on attack rolls) until you are discovered or stop hiding.',
  },
  {
    name: 'Ready',
    icon: '⏳',
    description: 'Prepare an action to trigger when a specific circumstance occurs. Use your reaction to execute it when the trigger happens. If you ready a spell, you must concentrate on it until you release it.',
  },
  {
    name: 'Search',
    icon: '🔍',
    description: 'Devote your attention to finding something. Make a Wisdom (Perception) check or an Intelligence (Investigation) check, as directed by the DM.',
  },
  {
    name: 'Use an Object',
    icon: '🎒',
    description: 'Interact with a second object on your turn (the first interaction is free), such as drawing a second weapon, drinking a potion, or pulling a lever.',
  },
  {
    name: 'Opportunity Attack',
    icon: '⚡',
    description: 'Reaction: When a hostile creature you can see moves out of your reach, make one melee attack against it. Provoked by moving out of reach without Disengaging.',
  },
  {
    name: 'Grapple',
    icon: '🤼',
    description: 'Special melee attack. Make a Strength (Athletics) check contested by the target\'s Strength (Athletics) or Dexterity (Acrobatics). On success, the target is grappled (speed = 0). Target must be no more than one size larger than you.',
  },
  {
    name: 'Shove',
    icon: '🫸',
    description: 'Special melee attack. Make a Strength (Athletics) check contested by the target\'s Strength (Athletics) or Dexterity (Acrobatics). On success, knock the target prone or push it 5 ft away. Target must be no more than one size larger than you.',
  },
];

export const COMMON_RULES: RuleEntry[] = [
  {
    name: 'Cover',
    icon: '🧱',
    description: 'Half cover: +2 AC and DEX saves. Three-quarters cover: +5 AC and DEX saves. Total cover: can\'t be targeted directly by an attack or spell.',
  },
  {
    name: 'Difficult Terrain',
    icon: '🌿',
    description: 'Every foot of movement costs 1 extra foot. This applies in rough ground, snow, swamps, undergrowth, stairs, and similar obstacles.',
  },
  {
    name: 'Climbing & Swimming',
    icon: '🧗',
    description: 'Each foot of climbing or swimming costs 1 extra foot of movement (2 extra feet in difficult terrain), unless the creature has a climbing or swimming speed.',
  },
  {
    name: 'Falling',
    icon: '⬇️',
    description: 'Take 1d6 bludgeoning damage for every 10 feet fallen, to a maximum of 20d6. Land prone if damage is taken.',
  },
  {
    name: 'Concentration',
    icon: '🔮',
    description: 'Some spells require concentration. You can only concentrate on one spell at a time. Taking damage forces a CON save (DC = 10 or half the damage taken, whichever is higher). Being incapacitated or killed also breaks concentration.',
  },
  {
    name: 'Short Rest',
    icon: '☕',
    description: 'At least 1 hour of downtime. You can spend Hit Dice to restore HP (roll the die + CON modifier per Hit Die). Warlocks recover spell slots on short rest.',
  },
  {
    name: 'Long Rest',
    icon: '🛏️',
    description: 'At least 8 hours. Regain all lost HP and up to half your total Hit Dice (minimum 1). Restore all spell slots. Can only benefit from one long rest per 24 hours. Must have at least 1 HP to benefit.',
  },
  {
    name: 'Vision & Light',
    icon: '👁️',
    description: 'Bright light: normal vision. Dim light: lightly obscured (disadvantage on Perception checks relying on sight). Darkness: heavily obscured (effectively blinded). Darkvision treats darkness as dim light.',
  },
  {
    name: 'Suffocating',
    icon: '💨',
    description: 'A creature can hold its breath for 1 + CON modifier minutes (minimum 30 seconds). When out of breath, it survives for CON modifier rounds (minimum 1). At 0 remaining rounds, it drops to 0 HP and is dying.',
  },
  {
    name: 'Death Saving Throws',
    icon: '💀',
    description: 'Roll d20 at the start of each turn while at 0 HP. 10+ = success, 9 or below = failure. 3 successes = stabilized. 3 failures = death. Natural 20 = regain 1 HP. Natural 1 = two failures.',
  },
];

export const RULE_SECTIONS: RuleSection[] = [
  { title: 'Combat Actions', emoji: '⚔️', entries: COMBAT_ACTIONS },
  { title: 'Common Rules', emoji: '📜', entries: COMMON_RULES },
];

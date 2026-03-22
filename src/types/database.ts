export interface Character {
  id: string;
  user_id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  current_hp: number;
  max_hp: number;
  temp_hp: number;
  skill_proficiencies: string[];
  created_at: string;
  updated_at: string;
}

export interface AbilityScore {
  id: string;
  character_id: string;
  ability: Ability;
  score: number;
  saving_throw_proficiency: boolean;
}

export interface SpellSlot {
  id: string;
  character_id: string;
  level: number;
  total: number;
  used: number;
}

export interface InventoryItem {
  id: string;
  character_id: string;
  name: string;
  quantity: number;
  weight: number;
  notes: string;
  created_at: string;
}

export interface Feature {
  id: string;
  character_id: string;
  title: string;
  description: string;
  source: string;
  created_at: string;
}

export interface CharacterNotes {
  id: string;
  character_id: string;
  content: string;
  updated_at: string;
}

export interface Spell {
  id: string;
  character_id: string;
  name: string;
  description: string;
  level: number;
  prepared: boolean;
  created_at: string;
}

export type Ability = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export type Tab = 'sheet' | 'hp' | 'spells' | 'items' | 'features' | 'notes';

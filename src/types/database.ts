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
  armor_class: number;
  death_save_successes: number;
  death_save_failures: number;
  conditions: string[];
  skill_proficiencies: string[];
  image_url: string | null;
  image_position: number;
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

export type ActionType = 'action' | 'bonus_action' | 'reaction' | 'other';

export interface Feature {
  id: string;
  character_id: string;
  title: string;
  description: string;
  source: string;
  action_type: ActionType;
  max_uses: number | null;
  used_uses: number;
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
  action_type: ActionType;
  created_at: string;
}

export interface Weapon {
  id: string;
  character_id: string;
  name: string;
  damage_dice: string;
  damage_type: string;
  ability_mod: 'STR' | 'DEX';
  proficient: boolean;
  action_type: ActionType;
  created_at: string;
}

export type Ability = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export type Tab = 'sheet' | 'hp' | 'spells' | 'weapons' | 'items' | 'features' | 'notes' | 'combat';

/* ── Live Combat Session ── */

export type SessionStatus = 'lobby' | 'active' | 'ended';
export type CombatantType = 'player' | 'enemy' | 'ally';

export interface CombatSession {
  id: string;
  room_code: string;
  dm_user_id: string;
  status: SessionStatus;
  current_turn_index: number;
  round_number: number;
  created_at: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  character_id: string;
  character_name: string;
  character_class: string;
  current_hp: number;
  max_hp: number;
  joined_at: string;
}

export interface Combatant {
  id: string;
  session_id: string;
  name: string;
  combatant_type: CombatantType;
  initiative: number;
  participant_id: string | null;
  character_id: string | null;
  current_hp: number;
  max_hp: number;
  image_url: string | null;
  image_position: number;
  sort_order: number;
}

/* ── Character Sharing ── */

export type ShareStatus = 'pending' | 'accepted' | 'declined';

export interface CharacterShare {
  id: string;
  character_id: string;
  sender_id: string;
  sender_email: string;
  sender_username: string;
  recipient_email: string;
  recipient_id: string | null;
  status: ShareStatus;
  created_at: string;
}

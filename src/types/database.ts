export interface Character {
  id: string;
  user_id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  primary_casting_class: string | null;
  current_hp: number;
  max_hp: number;
  temp_hp: number;
  armor_class: number;
  death_save_successes: number;
  death_save_failures: number;
  conditions: string[];
  skill_proficiencies: string[];
  initiative_modifier: number | null;
  passive_perception: number | null;
  hit_dice_remaining: number | null;
  inspiration: boolean;
  speed: number;
  swim_speed: number | null;
  fly_speed: number | null;
  climb_speed: number | null;
  burrow_speed: number | null;
  concentration_spell_id: string | null;
  wild_shape_active: boolean;
  wild_shape_beast_name: string | null;
  wild_shape_current_hp: number | null;
  wild_shape_max_hp: number | null;
  wild_shape_beast_ac: number | null;
  wild_shape_beast_str: number | null;
  wild_shape_beast_dex: number | null;
  wild_shape_beast_con: number | null;
  wild_shape_beast_speed: number | null;
  wild_shape_beast_swim_speed: number | null;
  wild_shape_beast_fly_speed: number | null;
  wild_shape_beast_climb_speed: number | null;
  wild_shape_beast_burrow_speed: number | null;
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
export type FeatureRestType = 'long_rest' | 'short_rest';

export interface Feature {
  id: string;
  character_id: string;
  title: string;
  description: string;
  source: string;
  action_type: ActionType;
  max_uses: number | null;
  used_uses: number;
  rest_type: FeatureRestType;
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
  concentration: boolean;
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

export interface CustomBeast {
  id: string;
  character_id: string;
  name: string;
  cr: number;
  hp: number;
  ac: number;
  str: number;
  dex: number;
  con: number;
  speed: number;
  swim_speed: number | null;
  fly_speed: number | null;
  climb_speed: number | null;
  burrow_speed: number | null;
  senses: string;
  attacks: { name: string; toHitBonus: number; damage: string; damageType: string }[];
  special_traits: string[];
  created_at: string;
}

export interface CharacterClass {
  id: string;
  character_id: string;
  class_name: string;
  level: number;
  sort_order: number;
  created_at: string;
}

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

import { useState, useEffect } from 'react';
import type { Character } from '../types/database';
import { supabase } from '../lib/supabase';

export function useCharacter(
  characterId: string | null,
  onCharacterSync?: (character: Character) => void,
) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!characterId) {
      Promise.resolve().then(() => {
        if (active) { setCharacter(null); setLoading(false); }
      });
      return () => { active = false; };
    }
    supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error('Error fetching character:', error);
        else {
          setCharacter(data);
          onCharacterSync?.(data);
        }
        setLoading(false);
      });
    return () => { active = false; };
  }, [characterId, onCharacterSync]);

  async function updateCharacter(
    updates: Partial<
      Pick<Character, 'name' | 'race' | 'class' | 'level' | 'primary_casting_class' | 'current_hp' | 'max_hp' | 'temp_hp' | 'armor_class' | 'death_save_successes' | 'death_save_failures' | 'conditions' | 'skill_proficiencies' | 'proficiencies' | 'languages' | 'gold' | 'initiative_modifier' | 'passive_perception' | 'hit_dice_remaining' | 'inspiration' | 'speed' | 'swim_speed' | 'fly_speed' | 'climb_speed' | 'burrow_speed' | 'concentration_spell_id' | 'alignment' | 'backstory' | 'personality_traits' | 'ideals' | 'bonds' | 'flaws' | 'wild_shape_active' | 'wild_shape_beast_name' | 'wild_shape_current_hp' | 'wild_shape_max_hp' | 'wild_shape_beast_ac' | 'wild_shape_beast_str' | 'wild_shape_beast_dex' | 'wild_shape_beast_con' | 'wild_shape_beast_speed' | 'wild_shape_beast_swim_speed' | 'wild_shape_beast_fly_speed' | 'wild_shape_beast_climb_speed' | 'wild_shape_beast_burrow_speed' | 'image_url' | 'image_position' | 'theme'>
    >,
  ) {
    if (!characterId) return;
    const { data, error } = await supabase
      .from('characters')
      .update(updates)
      .eq('id', characterId)
      .select()
      .single();

    if (error) console.error('Error updating character:', error);
    else {
      setCharacter(data);
      onCharacterSync?.(data);
    }
  }

  return { character, loading, updateCharacter };
}

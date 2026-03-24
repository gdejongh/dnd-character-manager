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
      Pick<Character, 'name' | 'race' | 'class' | 'level' | 'current_hp' | 'max_hp' | 'temp_hp' | 'skill_proficiencies' | 'image_url' | 'image_position'>
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

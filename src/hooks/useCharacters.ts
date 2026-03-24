import { useState, useEffect, useCallback } from 'react';
import type { Character } from '../types/database';
import { supabase } from '../lib/supabase';
import { ABILITIES } from '../constants/dnd';

export function useCharacters(userId: string | undefined) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let active = true;
    if (!userId) {
      Promise.resolve().then(() => {
        if (active) { setCharacters([]); setLoading(false); }
      });
      return () => { active = false; };
    }
    supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error('Error fetching characters:', error);
        else setCharacters(data ?? []);
        setLoading(false);
      });
    return () => { active = false; };
  }, [userId, fetchKey]);

  const refresh = useCallback(() => setFetchKey((k) => k + 1), []);
  const syncCharacter = useCallback(
    (updatedCharacter: Character) => {
      setCharacters((prevCharacters) => {
        if (updatedCharacter.user_id !== userId) return prevCharacters;
        let replaced = false;
        const nextCharacters = prevCharacters.map((character) => {
          if (character.id !== updatedCharacter.id) return character;
          replaced = true;
          return updatedCharacter;
        });
        return replaced ? nextCharacters : prevCharacters;
      });
    },
    [userId],
  );

  async function createCharacter(name: string, race: string, charClass: string) {
    if (!userId) return null;

    const { data: character, error } = await supabase
      .from('characters')
      .insert({ user_id: userId, name, race, class: charClass })
      .select()
      .single();

    if (error || !character) {
      console.error('Error creating character:', error);
      return null;
    }

    // Seed default ability scores
    const scores = ABILITIES.map((ability) => ({
      character_id: character.id,
      ability,
      score: 10,
      saving_throw_proficiency: false,
    }));
    await supabase.from('ability_scores').insert(scores);

    // Seed empty spell slot rows for levels 1–9
    const slots = Array.from({ length: 9 }, (_, i) => ({
      character_id: character.id,
      level: i + 1,
      total: 0,
      used: 0,
    }));
    await supabase.from('spell_slots').insert(slots);

    // Seed empty notes
    await supabase.from('notes').insert({ character_id: character.id, content: '' });

    refresh();
    return character as Character;
  }

  async function deleteCharacter(id: string) {
    const { error } = await supabase.from('characters').delete().eq('id', id);
    if (error) console.error('Error deleting character:', error);
    else refresh();
  }

  return { characters, loading, createCharacter, deleteCharacter, syncCharacter, refresh };
}

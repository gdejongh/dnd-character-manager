import { useState, useEffect } from 'react';
import type { Spell, ActionType } from '../types/database';
import { supabase } from '../lib/supabase';

export function useSpells(characterId: string | null) {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!characterId) {
      Promise.resolve().then(() => {
        if (active) { setSpells([]); setLoading(false); }
      });
      return () => { active = false; };
    }
    supabase
      .from('spells')
      .select('*')
      .eq('character_id', characterId)
      .order('level')
      .order('name')
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error('Error fetching spells:', error);
        else setSpells(data ?? []);
        setLoading(false);
      });
    return () => { active = false; };
  }, [characterId]);

  async function addSpell(name: string, description: string, level: number, actionType: ActionType = 'action') {
    if (!characterId) return;
    const { data, error } = await supabase
      .from('spells')
      .insert({ character_id: characterId, name, description, level, action_type: actionType })
      .select()
      .single();

    if (error) console.error('Error adding spell:', error);
    else if (data) setSpells((prev) => [...prev, data].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)));
  }

  async function updateSpell(
    id: string,
    updates: Partial<Pick<Spell, 'name' | 'description' | 'level' | 'prepared' | 'action_type'>>,
  ) {
    const { data, error } = await supabase
      .from('spells')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) console.error('Error updating spell:', error);
    else if (data) setSpells((prev) =>
      prev.map((s) => (s.id === id ? data : s)).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)),
    );
  }

  async function deleteSpell(id: string) {
    const { error } = await supabase.from('spells').delete().eq('id', id);
    if (error) console.error('Error deleting spell:', error);
    else setSpells((prev) => prev.filter((s) => s.id !== id));
  }

  return { spells, loading, addSpell, updateSpell, deleteSpell };
}

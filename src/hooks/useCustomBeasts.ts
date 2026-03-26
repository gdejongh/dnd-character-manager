import { useState, useEffect } from 'react';
import type { CustomBeast } from '../types/database';
import { supabase } from '../lib/supabase';
import type { Beast } from '../constants/beasts';

export function useCustomBeasts(characterId: string | null) {
  const [customBeasts, setCustomBeasts] = useState<CustomBeast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!characterId) {
      Promise.resolve().then(() => {
        if (active) { setCustomBeasts([]); setLoading(false); }
      });
      return () => { active = false; };
    }
    supabase
      .from('custom_beasts')
      .select('*')
      .eq('character_id', characterId)
      .order('name')
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error('Error fetching custom beasts:', error);
        else setCustomBeasts(data ?? []);
        setLoading(false);
      });
    return () => { active = false; };
  }, [characterId]);

  async function addCustomBeast(beast: Beast) {
    if (!characterId) return;
    const { data, error } = await supabase
      .from('custom_beasts')
      .insert({
        character_id: characterId,
        name: beast.name,
        cr: beast.cr,
        hp: beast.hp,
        ac: beast.ac,
        str: beast.str,
        dex: beast.dex,
        con: beast.con,
        speed: beast.speed,
        swim_speed: beast.swimSpeed,
        fly_speed: beast.flySpeed,
        climb_speed: beast.climbSpeed,
        burrow_speed: beast.burrowSpeed,
        senses: beast.senses,
        attacks: beast.attacks,
        special_traits: beast.specialTraits,
      })
      .select()
      .single();

    if (error) console.error('Error adding custom beast:', error);
    else if (data) setCustomBeasts((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function deleteCustomBeast(id: string) {
    const { error } = await supabase.from('custom_beasts').delete().eq('id', id);
    if (error) console.error('Error deleting custom beast:', error);
    else setCustomBeasts((prev) => prev.filter((b) => b.id !== id));
  }

  return { customBeasts, loading, addCustomBeast, deleteCustomBeast };
}

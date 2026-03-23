import { useState, useEffect } from 'react';
import type { Weapon, ActionType } from '../types/database';
import { supabase } from '../lib/supabase';

export function useWeapons(characterId: string | null) {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!characterId) {
      Promise.resolve().then(() => {
        if (active) { setWeapons([]); setLoading(false); }
      });
      return () => { active = false; };
    }
    supabase
      .from('weapons')
      .select('*')
      .eq('character_id', characterId)
      .order('name')
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error('Error fetching weapons:', error);
        else setWeapons(data ?? []);
        setLoading(false);
      });
    return () => { active = false; };
  }, [characterId]);

  async function addWeapon(
    name: string,
    damageDice: string,
    damageType: string,
    abilityMod: 'STR' | 'DEX',
    proficient: boolean,
    actionType: ActionType = 'action',
  ) {
    if (!characterId) return;
    const { data, error } = await supabase
      .from('weapons')
      .insert({
        character_id: characterId,
        name,
        damage_dice: damageDice,
        damage_type: damageType,
        ability_mod: abilityMod,
        proficient,
        action_type: actionType,
      })
      .select()
      .single();

    if (error) console.error('Error adding weapon:', error);
    else if (data) setWeapons((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function updateWeapon(
    id: string,
    updates: Partial<Pick<Weapon, 'name' | 'damage_dice' | 'damage_type' | 'ability_mod' | 'proficient' | 'action_type'>>,
  ) {
    const { data, error } = await supabase
      .from('weapons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) console.error('Error updating weapon:', error);
    else if (data) setWeapons((prev) =>
      prev.map((w) => (w.id === id ? data : w)).sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  async function deleteWeapon(id: string) {
    const { error } = await supabase.from('weapons').delete().eq('id', id);
    if (error) console.error('Error deleting weapon:', error);
    else setWeapons((prev) => prev.filter((w) => w.id !== id));
  }

  return { weapons, loading, addWeapon, updateWeapon, deleteWeapon };
}

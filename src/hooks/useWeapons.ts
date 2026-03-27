import { useState, useEffect } from 'react';
import type { Weapon, WeaponDamageComponent, ActionType, RechargeType, Ability } from '../types/database';
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

    // Fetch weapons first, then their damage components
    supabase
      .from('weapons')
      .select('*')
      .eq('character_id', characterId)
      .order('name')
      .then(async ({ data: weaponData, error: weaponError }) => {
        if (!active) return;
        if (weaponError) {
          console.error('Error fetching weapons:', weaponError);
          setLoading(false);
          return;
        }
        const weaponList = weaponData ?? [];
        if (weaponList.length === 0) {
          setWeapons([]);
          setLoading(false);
          return;
        }

        const weaponIds = weaponList.map((w) => w.id);
        const { data: compData, error: compError } = await supabase
          .from('weapon_damage_components')
          .select('*')
          .in('weapon_id', weaponIds);

        if (!active) return;
        if (compError) console.error('Error fetching damage components:', compError);

        const compsByWeapon = new Map<string, WeaponDamageComponent[]>();
        for (const comp of compData ?? []) {
          const list = compsByWeapon.get(comp.weapon_id) ?? [];
          list.push(comp);
          compsByWeapon.set(comp.weapon_id, list);
        }

        setWeapons(weaponList.map((w) => ({
          ...w,
          damage_components: compsByWeapon.get(w.id) ?? [],
        })));
        setLoading(false);
      });
    return () => { active = false; };
  }, [characterId]);

  async function addWeapon(
    name: string,
    damageDice: string,
    damageType: string,
    abilityMod: Ability,
    proficient: boolean,
    actionType: ActionType = 'action',
    maxCharges?: number | null,
    rechargeType?: RechargeType | null,
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
        max_charges: maxCharges ?? null,
        recharge_type: maxCharges ? (rechargeType ?? null) : null,
      })
      .select()
      .single();

    if (error) console.error('Error adding weapon:', error);
    else if (data) setWeapons((prev) => [...prev, { ...data, damage_components: [] }].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function updateWeapon(
    id: string,
    updates: Partial<Pick<Weapon, 'name' | 'damage_dice' | 'damage_type' | 'ability_mod' | 'proficient' | 'action_type' | 'max_charges' | 'used_charges' | 'recharge_type'>>,
  ) {
    const { data, error } = await supabase
      .from('weapons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) console.error('Error updating weapon:', error);
    else if (data) setWeapons((prev) =>
      prev.map((w) => (w.id === id ? { ...data, damage_components: w.damage_components ?? [] } : w)).sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  async function deleteWeapon(id: string) {
    const { error } = await supabase.from('weapons').delete().eq('id', id);
    if (error) console.error('Error deleting weapon:', error);
    else setWeapons((prev) => prev.filter((w) => w.id !== id));
  }

  async function addDamageComponent(weaponId: string, damageDice: string, damageType: string) {
    const { data, error } = await supabase
      .from('weapon_damage_components')
      .insert({ weapon_id: weaponId, damage_dice: damageDice, damage_type: damageType })
      .select()
      .single();

    if (error) console.error('Error adding damage component:', error);
    else if (data) {
      setWeapons((prev) => prev.map((w) =>
        w.id === weaponId
          ? { ...w, damage_components: [...(w.damage_components ?? []), data] }
          : w,
      ));
    }
  }

  async function removeDamageComponent(weaponId: string, componentId: string) {
    const { error } = await supabase.from('weapon_damage_components').delete().eq('id', componentId);
    if (error) console.error('Error removing damage component:', error);
    else {
      setWeapons((prev) => prev.map((w) =>
        w.id === weaponId
          ? { ...w, damage_components: (w.damage_components ?? []).filter((c) => c.id !== componentId) }
          : w,
      ));
    }
  }

  async function resetAllCharges() {
    if (!characterId) return;
    const { error } = await supabase
      .from('weapons')
      .update({ used_charges: 0 })
      .eq('character_id', characterId)
      .not('max_charges', 'is', null)
      .gt('used_charges', 0);

    if (error) console.error('Error resetting weapon charges:', error);
    else setWeapons((prev) => prev.map((w) => w.max_charges ? { ...w, used_charges: 0 } : w));
  }

  async function resetChargesByRestType(restType: RechargeType) {
    if (!characterId) return;
    const { error } = await supabase
      .from('weapons')
      .update({ used_charges: 0 })
      .eq('character_id', characterId)
      .eq('recharge_type', restType)
      .gt('used_charges', 0);

    if (error) console.error(`Error resetting ${restType} weapon charges:`, error);
    else setWeapons((prev) => prev.map((w) => w.recharge_type === restType ? { ...w, used_charges: 0 } : w));
  }

  return {
    weapons, loading,
    addWeapon, updateWeapon, deleteWeapon,
    addDamageComponent, removeDamageComponent,
    resetAllCharges, resetChargesByRestType,
  };
}

import { useState, useEffect } from 'react';
import type { InventoryItem, RechargeType } from '../types/database';
import { supabase } from '../lib/supabase';

export function useInventory(characterId: string | null) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!characterId) {
      Promise.resolve().then(() => {
        if (active) { setItems([]); setLoading(false); }
      });
      return () => { active = false; };
    }
    supabase
      .from('inventory_items')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at')
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error('Error fetching inventory:', error);
        else setItems(data ?? []);
        setLoading(false);
      });
    return () => { active = false; };
  }, [characterId]);

  async function addItem(
    name: string,
    quantity: number,
    weight: number,
    notes: string,
    maxCharges?: number | null,
    rechargeType?: RechargeType | null,
    resistances?: string[],
    immunities?: string[],
  ) {
    if (!characterId) return;
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        character_id: characterId,
        name,
        quantity,
        weight,
        notes,
        max_charges: maxCharges ?? null,
        recharge_type: maxCharges ? (rechargeType ?? null) : null,
        resistances: resistances ?? [],
        immunities: immunities ?? [],
      })
      .select()
      .single();

    if (error) console.error('Error adding item:', error);
    else if (data) setItems((prev) => [...prev, data]);
  }

  async function updateItem(
    id: string,
    updates: Partial<Pick<InventoryItem, 'name' | 'quantity' | 'weight' | 'notes' | 'max_charges' | 'used_charges' | 'recharge_type' | 'resistances' | 'immunities'>>,
  ) {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) console.error('Error updating item:', error);
    else if (data) setItems((prev) => prev.map((i) => (i.id === id ? data : i)));
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (error) console.error('Error deleting item:', error);
    else setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function resetAllCharges() {
    if (!characterId) return;
    const { error } = await supabase
      .from('inventory_items')
      .update({ used_charges: 0 })
      .eq('character_id', characterId)
      .not('max_charges', 'is', null)
      .gt('used_charges', 0);

    if (error) console.error('Error resetting item charges:', error);
    else setItems((prev) => prev.map((i) => i.max_charges ? { ...i, used_charges: 0 } : i));
  }

  async function resetChargesByRestType(restType: RechargeType) {
    if (!characterId) return;
    const { error } = await supabase
      .from('inventory_items')
      .update({ used_charges: 0 })
      .eq('character_id', characterId)
      .eq('recharge_type', restType)
      .gt('used_charges', 0);

    if (error) {
      console.error(`Error resetting ${restType} item charges:`, error);
    } else {
      setItems((prev) => prev.map((i) => i.recharge_type === restType ? { ...i, used_charges: 0 } : i));
    }
  }

  return { items, loading, addItem, updateItem, deleteItem, resetAllCharges, resetChargesByRestType };
}

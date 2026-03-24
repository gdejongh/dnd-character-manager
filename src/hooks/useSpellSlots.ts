import { useState, useEffect } from 'react';
import type { SpellSlot } from '../types/database';
import { supabase } from '../lib/supabase';

export function useSpellSlots(characterId: string | null) {
  const [slots, setSlots] = useState<SpellSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!characterId) {
      Promise.resolve().then(() => {
        if (active) { setSlots([]); setLoading(false); }
      });
      return () => { active = false; };
    }
    supabase
      .from('spell_slots')
      .select('*')
      .eq('character_id', characterId)
      .order('level')
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error('Error fetching spell slots:', error);
        else setSlots(data ?? []);
        setLoading(false);
      });
    return () => { active = false; };
  }, [characterId]);

  async function updateTotal(level: number, total: number) {
    if (!characterId) return;
    const { error } = await supabase
      .from('spell_slots')
      .update({ total, used: 0 })
      .eq('character_id', characterId)
      .eq('level', level);

    if (error) console.error('Error updating slot total:', error);
    else setSlots((prev) => prev.map((s) => (s.level === level ? { ...s, total, used: 0 } : s)));
  }

  async function setSlotUsed(level: number, used: number) {
    if (!characterId) return;
    const slot = slots.find((s) => s.level === level);
    if (!slot) return;
    const clamped = Math.max(0, Math.min(slot.total, used));
    const { error } = await supabase
      .from('spell_slots')
      .update({ used: clamped })
      .eq('character_id', characterId)
      .eq('level', level);

    if (error) console.error('Error setting slot used:', error);
    else setSlots((prev) => prev.map((s) => (s.level === level ? { ...s, used: clamped } : s)));
  }

  async function resetAll() {
    if (!characterId) return;
    const { error } = await supabase
      .from('spell_slots')
      .update({ used: 0 })
      .eq('character_id', characterId);

    if (error) console.error('Error resetting spell slots:', error);
    else setSlots((prev) => prev.map((s) => ({ ...s, used: 0 })));
  }

  async function autoFillSlots(slotTotals: Record<number, number>) {
    if (!characterId) return;
    const rows = [];
    for (let level = 1; level <= 9; level++) {
      rows.push({
        character_id: characterId,
        level,
        total: slotTotals[level] ?? 0,
        used: 0,
      });
    }
    const { error } = await supabase
      .from('spell_slots')
      .upsert(rows, { onConflict: 'character_id,level' });

    if (error) {
      console.error('Error auto-filling spell slots:', error);
      return;
    }
    const { data } = await supabase
      .from('spell_slots')
      .select('*')
      .eq('character_id', characterId)
      .order('level');
    if (data) setSlots(data);
  }

  return { slots, loading, updateTotal, setSlotUsed, resetAll, autoFillSlots };
}

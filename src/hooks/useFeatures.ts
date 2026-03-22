import { useState, useEffect } from 'react';
import type { Feature, ActionType } from '../types/database';
import { supabase } from '../lib/supabase';

export function useFeatures(characterId: string | null) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!characterId) {
      Promise.resolve().then(() => {
        if (active) { setFeatures([]); setLoading(false); }
      });
      return () => { active = false; };
    }
    supabase
      .from('features')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at')
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error('Error fetching features:', error);
        else setFeatures(data ?? []);
        setLoading(false);
      });
    return () => { active = false; };
  }, [characterId]);

  async function addFeature(title: string, description: string, source: string, actionType: ActionType = 'other', maxUses: number | null = null) {
    if (!characterId) return;
    const { data, error } = await supabase
      .from('features')
      .insert({ character_id: characterId, title, description, source, action_type: actionType, max_uses: maxUses })
      .select()
      .single();

    if (error) console.error('Error adding feature:', error);
    else if (data) setFeatures((prev) => [...prev, data]);
  }

  async function updateFeature(id: string, updates: Partial<Pick<Feature, 'title' | 'description' | 'source' | 'action_type' | 'max_uses' | 'used_uses'>>) {
    const { data, error } = await supabase
      .from('features')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) console.error('Error updating feature:', error);
    else if (data) setFeatures((prev) => prev.map((f) => (f.id === id ? data : f)));
  }

  async function resetAllUses() {
    if (!characterId) return;
    const { error } = await supabase
      .from('features')
      .update({ used_uses: 0 })
      .eq('character_id', characterId)
      .gt('used_uses', 0);

    if (error) console.error('Error resetting feature uses:', error);
    else setFeatures((prev) => prev.map((f) => ({ ...f, used_uses: 0 })));
  }

  async function deleteFeature(id: string) {
    const { error } = await supabase.from('features').delete().eq('id', id);
    if (error) console.error('Error deleting feature:', error);
    else setFeatures((prev) => prev.filter((f) => f.id !== id));
  }

  return { features, loading, addFeature, updateFeature, resetAllUses, deleteFeature };
}

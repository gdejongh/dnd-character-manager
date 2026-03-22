import { useState, useEffect } from 'react';
import type { AbilityScore } from '../types/database';
import { supabase } from '../lib/supabase';

export function useAbilityScores(characterId: string | null) {
  const [scores, setScores] = useState<AbilityScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!characterId) {
      Promise.resolve().then(() => {
        if (active) { setScores([]); setLoading(false); }
      });
      return () => { active = false; };
    }
    supabase
      .from('ability_scores')
      .select('*')
      .eq('character_id', characterId)
      .order('ability')
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error('Error fetching ability scores:', error);
        else setScores(data ?? []);
        setLoading(false);
      });
    return () => { active = false; };
  }, [characterId]);

  async function updateScore(ability: string, score: number) {
    if (!characterId) return;
    const { error } = await supabase
      .from('ability_scores')
      .update({ score })
      .eq('character_id', characterId)
      .eq('ability', ability);

    if (error) console.error('Error updating score:', error);
    else setScores((prev) => prev.map((s) => (s.ability === ability ? { ...s, score } : s)));
  }

  async function toggleSavingThrow(ability: string) {
    if (!characterId) return;
    const current = scores.find((s) => s.ability === ability);
    if (!current) return;

    const newVal = !current.saving_throw_proficiency;
    const { error } = await supabase
      .from('ability_scores')
      .update({ saving_throw_proficiency: newVal })
      .eq('character_id', characterId)
      .eq('ability', ability);

    if (error) console.error('Error toggling saving throw:', error);
    else
      setScores((prev) =>
        prev.map((s) => (s.ability === ability ? { ...s, saving_throw_proficiency: newVal } : s)),
      );
  }

  return { scores, loading, updateScore, toggleSavingThrow };
}

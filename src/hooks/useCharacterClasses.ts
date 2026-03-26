import { useState, useEffect, useCallback } from 'react';
import type { CharacterClass } from '../types/database';
import { supabase } from '../lib/supabase';

/** Build the display string like "Wizard 5 / Druid 3" */
function buildClassDisplayString(classes: CharacterClass[]): string {
  if (classes.length === 0) return '';
  return classes
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => `${c.class_name} ${c.level}`)
    .join(' / ');
}

function totalLevel(classes: CharacterClass[]): number {
  return classes.reduce((sum, c) => sum + c.level, 0);
}

export function useCharacterClasses(characterId: string | null) {
  const [classes, setClasses] = useState<CharacterClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!characterId) {
      Promise.resolve().then(() => {
        if (active) { setClasses([]); setLoading(false); }
      });
      return () => { active = false; };
    }
    supabase
      .from('character_classes')
      .select('*')
      .eq('character_id', characterId)
      .order('sort_order')
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error('Error fetching character classes:', error);
        else setClasses(data ?? []);
        setLoading(false);
      });
    return () => { active = false; };
  }, [characterId]);

  /** Sync derived class/level fields on the characters row */
  const syncDerived = useCallback(async (updated: CharacterClass[]) => {
    if (!characterId) return;
    const total = totalLevel(updated);
    const display = buildClassDisplayString(updated);
    await supabase
      .from('characters')
      .update({ class: display, level: Math.min(20, Math.max(1, total || 1)) })
      .eq('id', characterId);
  }, [characterId]);

  async function addClass(className: string, level: number = 1) {
    if (!characterId) return;
    const total = totalLevel(classes) + level;
    if (total > 20) return;

    const sortOrder = classes.length > 0
      ? Math.max(...classes.map((c) => c.sort_order)) + 1
      : 0;

    const { data, error } = await supabase
      .from('character_classes')
      .insert({ character_id: characterId, class_name: className, level, sort_order: sortOrder })
      .select()
      .single();

    if (error) { console.error('Error adding class:', error); return; }
    if (!data) return;

    const updated = [...classes, data].sort((a, b) => a.sort_order - b.sort_order);
    setClasses(updated);

    // Set primary casting class to first class if not already set
    if (classes.length === 0) {
      await supabase
        .from('characters')
        .update({ primary_casting_class: className })
        .eq('id', characterId);
    }

    await syncDerived(updated);
  }

  /** Migrate from single-class to multiclass: inserts existing class + a new blank class in one go */
  async function migrateToMulticlass(existingClassName: string, existingLevel: number) {
    if (!characterId) return;
    if (existingLevel >= 20) return;

    const rows = [
      { character_id: characterId, class_name: existingClassName, level: existingLevel, sort_order: 0 },
      { character_id: characterId, class_name: '', level: 1, sort_order: 1 },
    ];

    const { data, error } = await supabase
      .from('character_classes')
      .insert(rows)
      .select();

    if (error) { console.error('Error migrating to multiclass:', error); return; }
    if (!data || data.length === 0) return;

    const updated = data.sort((a, b) => a.sort_order - b.sort_order);
    setClasses(updated);

    await supabase
      .from('characters')
      .update({ primary_casting_class: existingClassName })
      .eq('id', characterId);

    await syncDerived(updated);
  }

  async function updateClassLevel(classId: string, newLevel: number) {
    if (!characterId) return;
    const clamped = Math.max(1, Math.min(20, newLevel));

    // Check total wouldn't exceed 20
    const otherTotal = classes.filter((c) => c.id !== classId).reduce((s, c) => s + c.level, 0);
    if (otherTotal + clamped > 20) return;

    // Optimistic update
    const updated = classes.map((c) => c.id === classId ? { ...c, level: clamped } : c);
    setClasses(updated);

    const { error } = await supabase
      .from('character_classes')
      .update({ level: clamped })
      .eq('id', classId);

    if (error) {
      console.error('Error updating class level:', error);
      setClasses(classes); // Revert
      return;
    }

    await syncDerived(updated);
  }

  async function removeClass(classId: string) {
    if (!characterId) return;

    const updated = classes.filter((c) => c.id !== classId);
    setClasses(updated);

    const { error } = await supabase
      .from('character_classes')
      .delete()
      .eq('id', classId);

    if (error) {
      console.error('Error removing class:', error);
      setClasses(classes); // Revert
      return;
    }

    await syncDerived(updated);
  }

  async function updateClassName(classId: string, newName: string) {
    if (!characterId) return;

    const updated = classes.map((c) => c.id === classId ? { ...c, class_name: newName } : c);
    setClasses(updated);

    const { error } = await supabase
      .from('character_classes')
      .update({ class_name: newName })
      .eq('id', classId);

    if (error) {
      console.error('Error updating class name:', error);
      setClasses(classes); // Revert
      return;
    }

    await syncDerived(updated);
  }

  return {
    classes,
    loading,
    addClass,
    migrateToMulticlass,
    updateClassLevel,
    updateClassName,
    removeClass,
  };
}

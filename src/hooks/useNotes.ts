import { useState, useEffect, useRef } from 'react';
import type { CharacterNotes } from '../types/database';
import { supabase } from '../lib/supabase';

export function useNotes(characterId: string | null) {
  const [notes, setNotes] = useState<CharacterNotes | null>(null);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let active = true;
    if (!characterId) {
      Promise.resolve().then(() => {
        if (active) { setNotes(null); setLoading(false); }
      });
      return () => { active = false; };
    }
    supabase
      .from('notes')
      .select('*')
      .eq('character_id', characterId)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error('Error fetching notes:', error);
        else setNotes(data);
        setLoading(false);
      });
    return () => { active = false; };
  }, [characterId]);

  function updateContent(content: string) {
    if (!characterId || !notes) return;
    const targetCharId = characterId;
    setNotes((prev) => (prev ? { ...prev, content } : prev));

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('notes')
        .update({ content })
        .eq('character_id', targetCharId);
      if (error) console.error('Error saving notes:', error);
    }, 500);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [characterId]);

  return { notes, loading, updateContent };
}

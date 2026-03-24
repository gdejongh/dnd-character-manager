import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { CharacterShare } from '../types/database';

export function useCharacterShares(userId: string | undefined) {
  const [shares, setShares] = useState<CharacterShare[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!userId) {
      Promise.resolve().then(() => {
        if (active) { setShares([]); setLoading(false); }
      });
      return () => { active = false; };
    }
    supabase
      .from('character_shares')
      .select('*')
      .eq('sender_id', userId)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error('Error fetching shares:', error);
        else setShares(data ?? []);
        setLoading(false);
      });
    return () => { active = false; };
  }, [userId]);

  async function shareCharacter(characterId: string, recipientEmail: string) {
    const { error } = await supabase.rpc('share_character', {
      p_character_id: characterId,
      p_recipient_email: recipientEmail,
    });
    if (error) throw new Error(error.message);

    // Refetch shares
    const { data: updated } = await supabase
      .from('character_shares')
      .select('*')
      .eq('sender_id', userId!);
    setShares(updated ?? []);
  }

  async function revokeShare(shareId: string) {
    setShares((prev) => prev.filter((s) => s.id !== shareId));
    const { error } = await supabase
      .from('character_shares')
      .delete()
      .eq('id', shareId);
    if (error) {
      console.error('Error revoking share:', error);
      const { data } = await supabase
        .from('character_shares')
        .select('*')
        .eq('sender_id', userId!);
      setShares(data ?? []);
    }
  }

  function getSharesForCharacter(characterId: string) {
    return shares.filter((s) => s.character_id === characterId);
  }

  return { shares, loading, shareCharacter, revokeShare, getSharesForCharacter };
}

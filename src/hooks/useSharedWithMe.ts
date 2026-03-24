import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { CharacterShare, Character } from '../types/database';

export interface SharedCharacterInfo {
  share: CharacterShare;
  character: Pick<Character, 'id' | 'name' | 'race' | 'class' | 'level' | 'current_hp' | 'max_hp' | 'image_url' | 'image_position'>;
}

export function useSharedWithMe(userId: string | undefined) {
  const [pendingShares, setPendingShares] = useState<SharedCharacterInfo[]>([]);
  const [acceptedShares, setAcceptedShares] = useState<SharedCharacterInfo[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchShares(uid: string) {
    const { data, error } = await supabase
      .from('character_shares')
      .select(`
        *,
        characters (
          id, name, race, class, level, current_hp, max_hp, image_url, image_position
        )
      `)
      .eq('recipient_id', uid)
      .in('status', ['pending', 'accepted']);

    if (error) {
      console.error('Error fetching shared characters:', error);
      setLoading(false);
      return;
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const items: SharedCharacterInfo[] = (data ?? [])
      .filter((row: any) => row.characters)
      .map((row: any) => ({
        share: {
          id: row.id,
          character_id: row.character_id,
          sender_id: row.sender_id,
          sender_email: row.sender_email,
          sender_username: row.sender_username,
          recipient_email: row.recipient_email,
          recipient_id: row.recipient_id,
          status: row.status,
          created_at: row.created_at,
        },
        character: row.characters,
      }));
    /* eslint-enable @typescript-eslint/no-explicit-any */

    setPendingShares(items.filter((i) => i.share.status === 'pending'));
    setAcceptedShares(items.filter((i) => i.share.status === 'accepted'));
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    if (!userId) {
      Promise.resolve().then(() => {
        if (active) { setPendingShares([]); setAcceptedShares([]); setLoading(false); }
      });
      return () => { active = false; };
    }
    supabase
      .from('character_shares')
      .select(`
        *,
        characters (
          id, name, race, class, level, current_hp, max_hp, image_url, image_position
        )
      `)
      .eq('recipient_id', userId)
      .in('status', ['pending', 'accepted'])
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('Error fetching shared characters:', error);
          setLoading(false);
          return;
        }
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const items: SharedCharacterInfo[] = (data ?? [])
          .filter((row: any) => row.characters)
          .map((row: any) => ({
            share: {
              id: row.id,
              character_id: row.character_id,
              sender_id: row.sender_id,
              sender_email: row.sender_email,
              sender_username: row.sender_username,
              recipient_email: row.recipient_email,
              recipient_id: row.recipient_id,
              status: row.status,
              created_at: row.created_at,
            },
            character: row.characters,
          }));
        /* eslint-enable @typescript-eslint/no-explicit-any */
        setPendingShares(items.filter((i) => i.share.status === 'pending'));
        setAcceptedShares(items.filter((i) => i.share.status === 'accepted'));
        setLoading(false);
      });
    return () => { active = false; };
  }, [userId]);

  async function acceptShare(shareId: string) {
    const { error } = await supabase
      .from('character_shares')
      .update({ status: 'accepted' })
      .eq('id', shareId);
    if (error) console.error('Error accepting share:', error);
    if (userId) await fetchShares(userId);
  }

  async function declineShare(shareId: string) {
    const { error } = await supabase
      .from('character_shares')
      .update({ status: 'declined' })
      .eq('id', shareId);
    if (error) console.error('Error declining share:', error);
    setPendingShares((prev) => prev.filter((s) => s.share.id !== shareId));
  }

  async function copyCharacter(shareId: string): Promise<string> {
    const { data, error } = await supabase.rpc('copy_shared_character', {
      p_share_id: shareId,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  return { pendingShares, acceptedShares, loading, acceptShare, declineShare, copyCharacter };
}

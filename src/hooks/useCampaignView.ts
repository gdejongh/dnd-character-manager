import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import type { Campaign, CampaignCharacter, CampaignCharacterRole, Character } from '../types/database';

export interface CampaignCharacterWithDetails extends CampaignCharacter {
  character: Pick<Character, 'id' | 'name' | 'race' | 'class' | 'level' | 'current_hp' | 'max_hp' | 'image_url' | 'image_position'>;
}

export function useCampaignView(campaignId: string | null) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [members, setMembers] = useState<{ user_id: string; joined_at: string }[]>([]);
  const [campaignCharacters, setCampaignCharacters] = useState<CampaignCharacterWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!campaignId) {
      setCampaign(null);
      setMembers([]);
      setCampaignCharacters([]);
      setLoading(false);
      return;
    }

    // Fetch campaign details
    const { data: campaignData } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    // Fetch members
    const { data: memberData } = await supabase
      .from('campaign_members')
      .select('user_id, joined_at')
      .eq('campaign_id', campaignId);

    // Fetch campaign characters with character details
    const { data: ccData } = await supabase
      .from('campaign_characters')
      .select('*')
      .eq('campaign_id', campaignId);

    let withDetails: CampaignCharacterWithDetails[] = [];
    if (ccData && ccData.length > 0) {
      const charIds = ccData.map((cc) => cc.character_id);
      const { data: charData } = await supabase
        .from('characters')
        .select('id, name, race, class, level, current_hp, max_hp, image_url, image_position')
        .in('id', charIds);

      const charMap = new Map((charData ?? []).map((c) => [c.id, c]));
      withDetails = ccData
        .filter((cc) => charMap.has(cc.character_id))
        .map((cc) => ({
          ...cc,
          character: charMap.get(cc.character_id)!,
        }));
    }

    setCampaign(campaignData);
    setMembers(memberData ?? []);
    setCampaignCharacters(withDetails);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => {
    let active = true;
    fetchAll().then(() => {
      if (!active) return;
    });
    return () => { active = false; };
  }, [fetchAll]);

  const partyCharacters = campaignCharacters.filter((cc) => cc.role === 'party');
  const allyCharacters = campaignCharacters.filter((cc) => cc.role === 'ally');
  const enemyCharacters = campaignCharacters.filter((cc) => cc.role === 'enemy');
  const npcCharacters = campaignCharacters.filter((cc) => cc.role === 'npc');

  const addCharacterToCampaign = useCallback(async (
    characterId: string,
    role: CampaignCharacterRole,
    userId: string,
  ) => {
    if (!campaignId) return;

    const { data, error } = await supabase
      .from('campaign_characters')
      .insert({ campaign_id: campaignId, character_id: characterId, role, added_by: userId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        showToast('Character is already in this campaign');
      } else {
        console.error('Failed to add character:', error);
        showToast('Failed to add character');
      }
      return;
    }

    // Fetch the character details for the new entry
    const { data: charData } = await supabase
      .from('characters')
      .select('id, name, race, class, level, current_hp, max_hp, image_url, image_position')
      .eq('id', characterId)
      .single();

    if (data && charData) {
      setCampaignCharacters((prev) => [...prev, { ...data, character: charData }]);
      showToast(`Added ${charData.name} to campaign`);
    }
  }, [campaignId]);

  const removeCharacterFromCampaign = useCallback(async (campaignCharacterId: string) => {
    const removed = campaignCharacters.find((cc) => cc.id === campaignCharacterId);
    setCampaignCharacters((prev) => prev.filter((cc) => cc.id !== campaignCharacterId));

    const { error } = await supabase
      .from('campaign_characters')
      .delete()
      .eq('id', campaignCharacterId);

    if (error) {
      console.error('Failed to remove character:', error);
      showToast('Failed to remove character');
      fetchAll();
    } else {
      showToast(`Removed ${removed?.character.name ?? 'character'} from campaign`);
    }
  }, [campaignCharacters, fetchAll]);

  return {
    campaign,
    members,
    campaignCharacters,
    partyCharacters,
    allyCharacters,
    enemyCharacters,
    npcCharacters,
    loading,
    addCharacterToCampaign,
    removeCharacterFromCampaign,
    refreshCampaignView: fetchAll,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { generateRoomCode } from '../constants/combatSession';
import { showToast } from '../lib/toast';
import type { Campaign } from '../types/database';

interface CampaignWithRole extends Campaign {
  role: 'dm' | 'member';
}

export function useCampaigns(userId: string | undefined) {
  const [dmCampaigns, setDmCampaigns] = useState<Campaign[]>([]);
  const [memberCampaigns, setMemberCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    if (!userId) { setLoading(false); return; }

    // Fetch campaigns where user is DM
    const { data: dmData } = await supabase
      .from('campaigns')
      .select('*')
      .eq('dm_user_id', userId)
      .order('created_at', { ascending: false });

    // Fetch campaigns where user is a member (not DM)
    const { data: membershipData } = await supabase
      .from('campaign_members')
      .select('campaign_id')
      .eq('user_id', userId);

    const memberCampaignIds = (membershipData ?? []).map((m) => m.campaign_id);

    let memberData: Campaign[] = [];
    if (memberCampaignIds.length > 0) {
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .in('id', memberCampaignIds)
        .order('created_at', { ascending: false });
      memberData = data ?? [];
    }

    setDmCampaigns(dmData ?? []);
    setMemberCampaigns(memberData);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    let active = true;
    fetchCampaigns().then(() => {
      if (!active) return;
    });
    return () => { active = false; };
  }, [fetchCampaigns]);

  const createCampaign = useCallback(async (name: string): Promise<Campaign | null> => {
    if (!userId) return null;

    const MAX_RETRIES = 5;
    for (let i = 0; i < MAX_RETRIES; i++) {
      const joinCode = generateRoomCode();
      const { data, error } = await supabase
        .from('campaigns')
        .insert({ name, dm_user_id: userId, join_code: joinCode })
        .select()
        .single();

      if (data && !error) {
        setDmCampaigns((prev) => [data, ...prev]);
        showToast(`Campaign "${name}" created!`);
        return data;
      }
      if (error && error.code === '23505') continue; // unique violation on join_code
      if (error) {
        console.error('Failed to create campaign:', error);
        showToast('Failed to create campaign');
        return null;
      }
    }
    showToast('Could not generate unique join code');
    return null;
  }, [userId]);

  const deleteCampaign = useCallback(async (campaignId: string) => {
    setDmCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);
    if (error) {
      console.error('Failed to delete campaign:', error);
      showToast('Failed to delete campaign');
      fetchCampaigns();
    } else {
      showToast('Campaign deleted');
    }
  }, [fetchCampaigns]);

  const joinCampaign = useCallback(async (joinCode: string): Promise<boolean> => {
    if (!userId) return false;

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('join_code', joinCode.toUpperCase().trim())
      .maybeSingle();

    if (!campaign) {
      showToast('Campaign not found. Check the code and try again.');
      return false;
    }

    if (campaign.dm_user_id === userId) {
      showToast('You are the DM of this campaign!');
      return false;
    }

    const { error } = await supabase
      .from('campaign_members')
      .insert({ campaign_id: campaign.id, user_id: userId });

    if (error) {
      if (error.code === '23505') {
        showToast('You already joined this campaign!');
      } else {
        console.error('Failed to join campaign:', error);
        showToast('Failed to join campaign');
      }
      return false;
    }

    setMemberCampaigns((prev) => [campaign, ...prev]);
    showToast(`Joined "${campaign.name}"!`);
    return true;
  }, [userId]);

  const leaveCampaign = useCallback(async (campaignId: string) => {
    if (!userId) return;

    setMemberCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    const { error } = await supabase
      .from('campaign_members')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to leave campaign:', error);
      showToast('Failed to leave campaign');
      fetchCampaigns();
    } else {
      showToast('Left campaign');
    }
  }, [userId, fetchCampaigns]);

  return {
    dmCampaigns,
    memberCampaigns,
    loading,
    createCampaign,
    deleteCampaign,
    joinCampaign,
    leaveCampaign,
    refreshCampaigns: fetchCampaigns,
  };
}

export type { CampaignWithRole };

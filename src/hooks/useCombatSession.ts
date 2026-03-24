import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { generateRoomCode } from '../constants/combatSession';
import type {
  CombatSession,
  SessionParticipant,
  Combatant,
} from '../types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseCombatSessionReturn {
  session: CombatSession | null;
  participants: SessionParticipant[];
  combatants: Combatant[];
  loading: boolean;

  addEnemy: (name: string, initiative: number, hp: number) => Promise<void>;
  addCombatantFromCharacter: (characterId: string, name: string, hp: number, maxHp: number, type: 'enemy' | 'ally') => Promise<void>;
  removeEnemy: (id: string) => Promise<void>;
  updateCombatantInitiative: (id: string, initiative: number) => Promise<void>;
  beginCombat: () => Promise<void>;
  nextTurn: () => Promise<void>;
  updateEnemyHp: (id: string, delta: number) => Promise<void>;
  updateMyHp: (newHp: number) => Promise<void>;
  applyCombatantHpDelta: (combatantId: string, delta: number) => Promise<void>;
  endSession: () => Promise<void>;
}

export async function createCombatSession(userId: string): Promise<string> {
  const MAX_RETRIES = 5;
  for (let i = 0; i < MAX_RETRIES; i++) {
    const roomCode = generateRoomCode();
    const { data, error } = await supabase
      .from('combat_sessions')
      .insert({
        room_code: roomCode,
        dm_user_id: userId,
        status: 'lobby',
        current_turn_index: 0,
        round_number: 1,
      })
      .select('id')
      .single();

    if (data && !error) return data.id;
    if (error && error.code === '23505') continue; // unique violation, retry
    if (error) throw error;
  }
  throw new Error('Could not generate unique room code after retries');
}

export interface ActiveSessionInfo {
  sessionId: string;
  roomCode: string;
  role: 'dm' | 'player';
  status: 'lobby' | 'active';
}

/** Check if the user is already in an active (lobby/active) combat session. */
export async function findActiveSession(
  userId: string,
): Promise<ActiveSessionInfo | null> {
  // Check if user is DM of an active session
  const { data: dmSession } = await supabase
    .from('combat_sessions')
    .select('id, room_code, status')
    .eq('dm_user_id', userId)
    .in('status', ['lobby', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dmSession) {
    return {
      sessionId: dmSession.id,
      roomCode: dmSession.room_code,
      role: 'dm',
      status: dmSession.status as 'lobby' | 'active',
    };
  }

  // Check if user is a participant in an active session
  const { data: participation } = await supabase
    .from('session_participants')
    .select('session_id, combat_sessions(id, room_code, status)')
    .eq('user_id', userId)
    .limit(10);

  if (participation) {
    for (const p of participation) {
      const session = p.combat_sessions as unknown as {
        id: string;
        room_code: string;
        status: string;
      } | null;
      if (session && (session.status === 'lobby' || session.status === 'active')) {
        return {
          sessionId: session.id,
          roomCode: session.room_code,
          role: 'player',
          status: session.status as 'lobby' | 'active',
        };
      }
    }
  }

  return null;
}

export async function lookupSession(
  roomCode: string,
): Promise<CombatSession | null> {
  const { data } = await supabase
    .from('combat_sessions')
    .select('*')
    .eq('room_code', roomCode.toUpperCase().trim())
    .in('status', ['lobby', 'active'])
    .single();
  return data as CombatSession | null;
}

export async function joinCombatSession(
  sessionId: string,
  userId: string,
  characterId: string,
  characterName: string,
  characterClass: string,
  currentHp: number,
  maxHp: number,
  imageUrl: string | null = null,
  imagePosition: number = 50,
): Promise<string> {
  // Check if already joined
  const { data: existing } = await supabase
    .from('session_participants')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: participant, error: pError } = await supabase
    .from('session_participants')
    .insert({
      session_id: sessionId,
      user_id: userId,
      character_id: characterId,
      character_name: characterName,
      character_class: characterClass,
      current_hp: currentHp,
      max_hp: maxHp,
    })
    .select('id')
    .single();

  if (pError) throw pError;
  const participantId = participant!.id;

  // Also create a combatant row for initiative tracking
  const { data: maxOrder } = await supabase
    .from('combatants')
    .select('sort_order')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxOrder?.sort_order ?? 0) + 1;

  await supabase.from('combatants').insert({
    session_id: sessionId,
    name: characterName,
    combatant_type: 'player',
    initiative: 0,
    participant_id: participantId,
    character_id: characterId,
    current_hp: currentHp,
    max_hp: maxHp,
    image_url: imageUrl,
    image_position: imagePosition,
    sort_order: nextOrder,
  });

  return participantId;
}

export function useCombatSession(
  sessionId: string | null,
  userId: string | undefined,
): UseCombatSessionReturn {
  const [session, setSession] = useState<CombatSession | null>(null);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!sessionId) {
        setLoading(false);
        return;
      }
      const [sRes, pRes, cRes] = await Promise.all([
        supabase
          .from('combat_sessions')
          .select('*')
          .eq('id', sessionId)
          .single(),
        supabase
          .from('session_participants')
          .select('*')
          .eq('session_id', sessionId)
          .order('joined_at', { ascending: true }),
        supabase
          .from('combatants')
          .select('*')
          .eq('session_id', sessionId)
          .order('initiative', { ascending: false })
          .order('sort_order', { ascending: true }),
      ]);

      if (cancelled) return;
      if (sRes.data) setSession(sRes.data as CombatSession);
      if (pRes.data) setParticipants(pRes.data as SessionParticipant[]);
      if (cRes.data) setCombatants(cRes.data as Combatant[]);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [sessionId]);

  // Realtime subscription
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`combat-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'combat_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setSession(payload.new as CombatSession);
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setParticipants((prev) => [
              ...prev,
              payload.new as SessionParticipant,
            ]);
          } else if (payload.eventType === 'UPDATE') {
            setParticipants((prev) =>
              prev.map((p) =>
                p.id === (payload.new as SessionParticipant).id
                  ? (payload.new as SessionParticipant)
                  : p,
              ),
            );
          } else if (payload.eventType === 'DELETE') {
            setParticipants((prev) =>
              prev.filter(
                (p) => p.id !== (payload.old as { id: string }).id,
              ),
            );
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'combatants',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCombatants((prev) =>
              [...prev, payload.new as Combatant].sort(
                (a, b) =>
                  b.initiative - a.initiative || a.sort_order - b.sort_order,
              ),
            );
          } else if (payload.eventType === 'UPDATE') {
            setCombatants((prev) =>
              prev
                .map((c) =>
                  c.id === (payload.new as Combatant).id
                    ? (payload.new as Combatant)
                    : c,
                )
                .sort(
                  (a, b) =>
                    b.initiative - a.initiative || a.sort_order - b.sort_order,
                ),
            );
          } else if (payload.eventType === 'DELETE') {
            setCombatants((prev) =>
              prev.filter(
                (c) => c.id !== (payload.old as { id: string }).id,
              ),
            );
          }
        },
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId]);

  async function addEnemy(name: string, initiative: number, hp: number) {
    if (!sessionId) return;
    const nextOrder =
      combatants.length > 0
        ? Math.max(...combatants.map((c) => c.sort_order)) + 1
        : 1;

    await supabase.from('combatants').insert({
      session_id: sessionId,
      name,
      combatant_type: 'enemy',
      initiative,
      participant_id: null,
      current_hp: hp,
      max_hp: hp,
      sort_order: nextOrder,
    });
  }

  async function addCombatantFromCharacter(
    characterId: string,
    name: string,
    hp: number,
    maxHp: number,
    type: 'enemy' | 'ally',
  ) {
    if (!sessionId) return;

    // Fetch character image data
    const { data: character } = await supabase
      .from('characters')
      .select('image_url, image_position')
      .eq('id', characterId)
      .single();

    const nextOrder =
      combatants.length > 0
        ? Math.max(...combatants.map((c) => c.sort_order)) + 1
        : 1;

    await supabase.from('combatants').insert({
      session_id: sessionId,
      name,
      combatant_type: type,
      initiative: 0,
      participant_id: null,
      character_id: characterId,
      current_hp: hp,
      max_hp: maxHp,
      image_url: character?.image_url ?? null,
      image_position: character?.image_position ?? 50,
      sort_order: nextOrder,
    });
  }

  async function removeEnemy(id: string) {
    await supabase.from('combatants').delete().eq('id', id);
  }

  async function updateCombatantInitiative(id: string, initiative: number) {
    await supabase.from('combatants').update({ initiative }).eq('id', id);
  }

  async function beginCombat() {
    if (!sessionId) return;
    await supabase
      .from('combat_sessions')
      .update({ status: 'active', current_turn_index: 0, round_number: 1 })
      .eq('id', sessionId);
  }

  async function nextTurn() {
    if (!session) return;
    const total = combatants.length;
    if (total === 0) return;
    const nextIndex = (session.current_turn_index + 1) % total;
    const nextRound =
      nextIndex === 0 ? session.round_number + 1 : session.round_number;
    await supabase
      .from('combat_sessions')
      .update({ current_turn_index: nextIndex, round_number: nextRound })
      .eq('id', session.id);
  }

  async function updateEnemyHp(id: string, delta: number) {
    const enemy = combatants.find((c) => c.id === id);
    if (!enemy) return;
    const newHp = Math.max(0, Math.min(enemy.max_hp, enemy.current_hp + delta));
    // Optimistic local update
    setCombatants((prev) =>
      prev.map((c) => (c.id === id ? { ...c, current_hp: newHp } : c)),
    );
    await supabase.from('combatants').update({ current_hp: newHp }).eq('id', id);
  }

  async function updateMyHp(newHp: number) {
    if (!sessionId || !userId) return;
    // Update participant
    const myP = participants.find((p) => p.user_id === userId);
    if (myP) {
      await supabase
        .from('session_participants')
        .update({ current_hp: newHp })
        .eq('id', myP.id);

      // Also update the combatant row for DM display
      const myCombatant = combatants.find(
        (c) => c.participant_id === myP.id,
      );
      if (myCombatant) {
        await supabase
          .from('combatants')
          .update({ current_hp: newHp })
          .eq('id', myCombatant.id);
      }

      // Also persist back to the characters table
      await supabase
        .from('characters')
        .update({ current_hp: newHp })
        .eq('id', myP.character_id);
    }
  }

  /** Apply an HP delta to any combatant, syncing all related tables */
  async function applyCombatantHpDelta(combatantId: string, delta: number) {
    const combatant = combatants.find((c) => c.id === combatantId);
    if (!combatant) {
      console.warn('[applyCombatantHpDelta] combatant not found:', combatantId);
      return;
    }

    const newHp = Math.max(0, Math.min(combatant.max_hp, combatant.current_hp + delta));

    // Optimistic local update for immediate UI feedback
    setCombatants((prev) =>
      prev.map((c) => (c.id === combatantId ? { ...c, current_hp: newHp } : c)),
    );

    // Always update the combatant row
    const { error } = await supabase.from('combatants').update({ current_hp: newHp }).eq('id', combatantId);
    if (error) console.error('[applyCombatantHpDelta] combatant update error:', error);

    // If linked to a participant (player), also update participant + character
    if (combatant.participant_id) {
      const participant = participants.find((p) => p.id === combatant.participant_id);
      if (participant) {
        const { error: pErr } = await supabase.from('session_participants').update({ current_hp: newHp }).eq('id', participant.id);
        if (pErr) console.error('[applyCombatantHpDelta] participant update error:', pErr);
        const { error: cErr } = await supabase.from('characters').update({ current_hp: newHp }).eq('id', participant.character_id);
        if (cErr) console.error('[applyCombatantHpDelta] character update error:', cErr);
      }
    }

    // If DM character (enemy/ally with character_id), also update character table
    if (combatant.character_id && !combatant.participant_id) {
      const { error: cErr } = await supabase.from('characters').update({ current_hp: newHp }).eq('id', combatant.character_id);
      if (cErr) console.error('[applyCombatantHpDelta] DM character update error:', cErr);
    }
  }

  async function endSession() {
    if (!session) return;
    const { error } = await supabase
      .from('combat_sessions')
      .update({ status: 'ended' })
      .eq('id', session.id);
    if (error) throw error;
  }

  return {
    session,
    participants,
    combatants,
    loading,
    addEnemy,
    addCombatantFromCharacter,
    removeEnemy,
    updateCombatantInitiative,
    beginCombat,
    nextTurn,
    updateEnemyHp,
    updateMyHp,
    applyCombatantHpDelta,
    endSession,
  };
}

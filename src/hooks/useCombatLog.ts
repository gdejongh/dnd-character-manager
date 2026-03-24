import { useRef, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Combatant } from '../types/database';

/* ── Event Types ─────────────────────────────────────────────────────────── */

export interface CombatEvent {
  senderId: string;
  actorId: string;
  actorName: string;
  targetIds: string[];
  effectType: 'damage' | 'healing' | 'none';
  amount: number;
  actionKind: 'spell' | 'weapon' | 'feature' | 'manual_hp';
  actionName: string;
}

/* ── Report Types ────────────────────────────────────────────────────────── */

export interface CombatantReport {
  id: string;
  name: string;
  combatantType: string;
  imageUrl?: string;
  imagePosition?: number;
  damageDealt: number;
  damageReceived: number;
  healingDone: number;
  healingReceived: number;
  spellsCast: number;
  abilitiesUsed: number;
  weaponAttacks: number;
}

export interface CombatSummary {
  combatants: CombatantReport[];
  totalRounds: number;
  totalDamage: number;
  totalHealing: number;
  durationSeconds: number;
}

/* ── Hook ────────────────────────────────────────────────────────────────── */

export function useCombatLog(sessionId: string, userId: string) {
  const events = useRef<CombatEvent[]>([]);
  const startTime = useRef<number>(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Set start time once on mount
  useEffect(() => {
    startTime.current = Date.now();
  }, []);

  // Subscribe to broadcast channel for cross-client event sharing
  useEffect(() => {
    const channel = supabase.channel(`combat-log-${sessionId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'combat-event' }, ({ payload }) => {
        if (payload) events.current.push(payload as CombatEvent);
      })
      .on('broadcast', { event: 'undo-event' }, ({ payload }) => {
        if (payload?.senderId) {
          // Remove last action event from this sender (skip manual_hp)
          for (let i = events.current.length - 1; i >= 0; i--) {
            const e = events.current[i];
            if (e.senderId === payload.senderId && e.actionKind !== 'manual_hp') {
              events.current.splice(i, 1);
              break;
            }
          }
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId]);

  const logAction = useCallback(
    (event: Omit<CombatEvent, 'senderId'>) => {
      const full: CombatEvent = { ...event, senderId: userId };
      events.current.push(full);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'combat-event',
        payload: full,
      });
    },
    [userId],
  );

  const undoLastAction = useCallback(() => {
    for (let i = events.current.length - 1; i >= 0; i--) {
      const e = events.current[i];
      if (e.senderId === userId && e.actionKind !== 'manual_hp') {
        events.current.splice(i, 1);
        break;
      }
    }
    channelRef.current?.send({
      type: 'broadcast',
      event: 'undo-event',
      payload: { senderId: userId },
    });
  }, [userId]);

  const logHpAdjust = useCallback(
    (combatantId: string, _combatantName: string, delta: number) => {
      const full: CombatEvent = {
        senderId: userId,
        actorId: '',
        actorName: '',
        targetIds: [combatantId],
        effectType: delta < 0 ? 'damage' : 'healing',
        amount: Math.abs(delta),
        actionKind: 'manual_hp',
        actionName: 'HP Adjustment',
      };
      events.current.push(full);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'combat-event',
        payload: full,
      });
    },
    [userId],
  );

  const generateReport = useCallback(
    (combatants: Combatant[], totalRounds: number): CombatSummary => {
      const statsMap = new Map<string, CombatantReport>();

      for (const c of combatants) {
        statsMap.set(c.id, {
          id: c.id,
          name: c.name,
          combatantType: c.combatant_type,
          imageUrl: c.image_url ?? undefined,
          imagePosition: c.image_position ?? undefined,
          damageDealt: 0,
          damageReceived: 0,
          healingDone: 0,
          healingReceived: 0,
          spellsCast: 0,
          abilitiesUsed: 0,
          weaponAttacks: 0,
        });
      }

      for (const event of events.current) {
        // Actor stats (only for tracked actions, not manual adjustments)
        const actor = event.actorId ? statsMap.get(event.actorId) : null;
        if (actor && event.actionKind !== 'manual_hp') {
          if (event.actionKind === 'spell') actor.spellsCast++;
          else if (event.actionKind === 'feature') actor.abilitiesUsed++;
          else if (event.actionKind === 'weapon') actor.weaponAttacks++;

          // Each target receives the full amount
          if (event.effectType === 'damage') {
            actor.damageDealt += event.amount * event.targetIds.length;
          } else if (event.effectType === 'healing') {
            actor.healingDone += event.amount * event.targetIds.length;
          }
        }

        // Target stats
        for (const targetId of event.targetIds) {
          const target = statsMap.get(targetId);
          if (target) {
            if (event.effectType === 'damage') {
              target.damageReceived += event.amount;
            } else if (event.effectType === 'healing') {
              target.healingReceived += event.amount;
            }
          }
        }
      }

      const allStats = [...statsMap.values()];
      const totalDamage = allStats.reduce((sum, c) => sum + c.damageDealt, 0);
      const totalHealing = allStats.reduce((sum, c) => sum + c.healingDone, 0);

      // Sort by damage dealt descending, then damage received descending
      allStats.sort((a, b) => b.damageDealt - a.damageDealt || b.damageReceived - a.damageReceived);

      return {
        combatants: allStats,
        totalRounds,
        totalDamage,
        totalHealing,
        durationSeconds: Math.floor((Date.now() - startTime.current) / 1000),
      };
    },
    [],
  );

  return { logAction, undoLastAction, logHpAdjust, generateReport };
}

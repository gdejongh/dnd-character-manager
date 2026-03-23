import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { FormEvent } from 'react';
import type { Character, Combatant, SessionParticipant, Spell, Feature, ActionType } from '../types/database';
import { useCombatSession } from '../hooks/useCombatSession';
import { CombatSheetLoader } from './CombatSheetLoader';
import type { ResourceConsumers } from './CombatSheetLoader';
import { TurnActionFlow } from './TurnActionFlow';
import type { TurnActionResult } from './TurnActionFlow';
import { NumericInput } from './NumericInput';
import {
  Skull,
  Shield,
  ChevronRight,
  Trash2,
  Plus,
  Minus,
  X,
  Swords,
  Crown,
  ScrollText,
  ChevronDown,
  Flag,
} from 'lucide-react';

interface LiveCombatProps {
  sessionId: string;
  userId: string;
  role: 'dm' | 'player';
  characters: Character[];
  onLeave: () => void;
}

type ActiveView = 'initiative' | 'sheet';

const darkBg = 'linear-gradient(180deg, #0a0910 0%, #0d0b14 50%, #0a0910 100%)';

/* ─── Active View Tab Bar ─── */
function ActiveViewTabs({ active, onChange }: { active: ActiveView; onChange: (v: ActiveView) => void }) {
  const tabs: { key: ActiveView; label: string; icon: typeof Swords }[] = [
    { key: 'initiative', label: 'Initiative', icon: Swords },
    { key: 'sheet', label: 'Combat Sheet', icon: ScrollText },
  ];
  return (
    <div
      className="flex"
      style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.5)' }}
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className="flex-1 flex items-center justify-center gap-2 py-3 cursor-pointer transition-colors duration-200"
            style={{
              background: isActive ? 'rgba(201,168,76,0.08)' : 'transparent',
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              color: isActive ? 'var(--accent)' : 'var(--text)',
              fontFamily: 'var(--heading)',
              fontSize: '0.75rem',
              letterSpacing: '1px',
              border: 'none',
              borderRadius: 0,
            }}
          >
            <Icon size={14} style={{ flexShrink: 0 }} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── HP Bar ─── */
function HpBar({ current, max, showNumber }: { current: number; max: number; showNumber: boolean }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const barColor = pct > 60 ? 'var(--hp-green)' : pct > 30 ? 'var(--hp-yellow)' : 'var(--hp-red)';
  return (
    <div className="flex items-center gap-2 w-full">
      <div
        className="flex-1 h-3 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      {showNumber && (
        <span className="text-xs shrink-0" style={{ color: barColor, fontFamily: 'var(--mono)', minWidth: '3rem', textAlign: 'right' }}>
          {current}/{max}
        </span>
      )}
    </div>
  );
}

/* ─── Initiative Row ─── */
function InitiativeRow({
  combatant,
  index,
  isActive,
  role,
  participant,
  userId,
  onRemove,
  onHpDelta,
  onInitiativeChange,
  onMyHpChange,
}: {
  combatant: Combatant;
  index: number;
  isActive: boolean;
  role: 'dm' | 'player';
  participant: SessionParticipant | undefined;
  userId: string;
  onRemove?: () => void;
  onHpDelta?: (delta: number) => void;
  onInitiativeChange?: (val: number) => void;
  onMyHpChange?: (newHp: number) => void;
}) {
  const isEnemy = combatant.combatant_type === 'enemy';
  const isAlly = combatant.combatant_type === 'ally';
  const isDmControlled = isEnemy || isAlly;
  const isMe = participant?.user_id === userId;

  const leftBorder = isEnemy ? '#7f1d1d' : isAlly ? '#1e40af' : 'var(--accent)';

  return (
    <div
      className="rounded-lg p-3 transition-all duration-300"
      style={{
        background: isActive
          ? 'rgba(201,168,76,0.08)'
          : 'rgba(255,255,255,0.02)',
        borderLeft: `4px solid ${leftBorder}`,
        border: isActive ? '1px solid rgba(201,168,76,0.4)' : '1px solid var(--border)',
        borderLeftWidth: '4px',
        borderLeftColor: leftBorder,
        animation: isActive ? 'activeTurnGlow 2s ease-in-out infinite' : undefined,
        boxShadow: isActive
          ? '0 0 20px rgba(201,168,76,0.15), inset 0 0 15px rgba(201,168,76,0.03)'
          : undefined,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Turn indicator */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{
            background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
            color: isActive ? '#0a0910' : 'var(--text)',
            fontFamily: 'var(--mono)',
          }}
        >
          {index + 1}
        </div>

        {/* Icon */}
        {isEnemy ? (
          <Skull size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
        ) : isAlly ? (
          <Shield size={16} style={{ color: '#60a5fa', flexShrink: 0 }} />
        ) : (
          <Shield size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        )}

        {/* Name + info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="font-semibold truncate"
              style={{
                color: isActive ? 'var(--accent)' : 'var(--text-h)',
                fontFamily: 'var(--heading)',
                fontSize: '0.85rem',
              }}
            >
              {combatant.name}
            </span>
            {isMe && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
              >
                YOU
              </span>
            )}
            {isAlly && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }}
              >
                ALLY
              </span>
            )}
          </div>
          {/* Show class for player combatants */}
          {!isEnemy && participant && (
            <span className="text-xs" style={{ color: 'var(--text)' }}>
              {participant.character_class}
            </span>
          )}
        </div>

        {/* Initiative badge */}
        <div className="flex flex-col items-center shrink-0">
          <span className="text-[9px] uppercase" style={{ color: 'var(--text)', letterSpacing: '0.5px' }}>
            Init
          </span>
          {role === 'dm' ? (
            <NumericInput
              value={combatant.initiative}
              onChange={(v) => onInitiativeChange?.(v)}
              min={-10}
              max={40}
              className="w-10 text-center text-sm font-bold py-0.5 rounded"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-h)',
                border: '1px solid var(--border)',
                fontFamily: 'var(--mono)',
              }}
            />
          ) : (
            <span
              className="text-sm font-bold"
              style={{ color: 'var(--text-h)', fontFamily: 'var(--mono)' }}
            >
              {combatant.initiative}
            </span>
          )}
        </div>
      </div>

      {/* HP section — different per role/type */}
      {role === 'dm' && isDmControlled && (
        <div className="flex items-center gap-2 mt-2 ml-10">
          <button
            onClick={() => onHpDelta?.(-1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ background: 'rgba(185,28,28,0.2)', color: 'var(--hp-red)', border: '1px solid rgba(185,28,28,0.3)' }}
          >
            <Minus size={14} />
          </button>
          <HpBar current={combatant.current_hp} max={combatant.max_hp} showNumber={true} />
          <button
            onClick={() => onHpDelta?.(1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--hp-green)', border: '1px solid rgba(74,222,128,0.2)' }}
          >
            <Plus size={14} />
          </button>
        </div>
      )}

      {role === 'dm' && !isDmControlled && participant && (
        <div className="mt-2 ml-10">
          <HpBar current={combatant.current_hp} max={combatant.max_hp} showNumber={true} />
        </div>
      )}

      {role === 'player' && isAlly && (
        <div className="mt-2 ml-10">
          <HpBar current={combatant.current_hp} max={combatant.max_hp} showNumber={false} />
        </div>
      )}

      {role === 'player' && !isEnemy && !isAlly && participant && !isMe && (
        <div className="mt-2 ml-10">
          <HpBar current={combatant.current_hp} max={combatant.max_hp} showNumber={false} />
        </div>
      )}

      {role === 'player' && isMe && participant && (
        <div className="flex items-center gap-2 mt-2 ml-10">
          <button
            onClick={() => onMyHpChange?.(Math.max(0, combatant.current_hp - 1))}
            className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ background: 'rgba(185,28,28,0.2)', color: 'var(--hp-red)', border: '1px solid rgba(185,28,28,0.3)' }}
          >
            <Minus size={18} />
          </button>
          <HpBar current={combatant.current_hp} max={combatant.max_hp} showNumber={true} />
          <button
            onClick={() => onMyHpChange?.(Math.min(combatant.max_hp, combatant.current_hp + 1))}
            className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--hp-green)', border: '1px solid rgba(74,222,128,0.2)' }}
          >
            <Plus size={18} />
          </button>
        </div>
      )}

      {/* DM: remove enemy/ally button */}
      {role === 'dm' && isDmControlled && onRemove && (
        <button
          onClick={onRemove}
          className="mt-2 ml-10 text-xs flex items-center gap-1 cursor-pointer bg-transparent"
          style={{ color: 'var(--text)', border: 'none', padding: 0 }}
        >
          <Trash2 size={11} /> Remove
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   LOBBY — DM
   ═══════════════════════════════════════════════════ */
function DMLobby({
  roomCode,
  participants,
  combatants,
  characters,
  onAddEnemy,
  onAddCharacterCombatant,
  onRemoveEnemy,
  onInitiativeChange,
  onBeginCombat,
  onLeave,
}: {
  roomCode: string;
  participants: SessionParticipant[];
  combatants: Combatant[];
  characters: Character[];
  onAddEnemy: (name: string, initiative: number, hp: number) => Promise<void>;
  onAddCharacterCombatant: (characterId: string, name: string, hp: number, maxHp: number, type: 'enemy' | 'ally') => Promise<void>;
  onRemoveEnemy: (id: string) => Promise<void>;
  onInitiativeChange: (id: string, init: number) => Promise<void>;
  onBeginCombat: () => Promise<void>;
  onLeave: () => void;
}) {
  const [enemyName, setEnemyName] = useState('');
  const [enemyInit, setEnemyInit] = useState(10);
  const [enemyHp, setEnemyHp] = useState(10);
  const [starting, setStarting] = useState(false);
  const [showCharPicker, setShowCharPicker] = useState(false);

  async function handleAddEnemy(e: FormEvent) {
    e.preventDefault();
    if (!enemyName.trim()) return;
    await onAddEnemy(enemyName.trim(), enemyInit, enemyHp);
    setEnemyName('');
    setEnemyInit(10);
    setEnemyHp(10);
  }

  const playerCount = participants.length;
  const canStart = playerCount > 0;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: darkBg }}>
      {/* Header */}
      <header
        className="p-4 text-center"
        style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onLeave}
            className="p-2 rounded-lg cursor-pointer flex items-center gap-1"
            style={{ color: 'var(--text)', background: 'transparent', border: '1px solid var(--border)', fontSize: '12px' }}
          >
            <X size={14} /> Leave
          </button>
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
          >
            <Crown size={10} className="inline mr-1" style={{ verticalAlign: '-1px' }} />
            Dungeon Master
          </span>
        </div>
        <p className="text-xs mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}>
          ROOM CODE
        </p>
        <p
          className="text-4xl font-bold m-0 tracking-widest"
          style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', letterSpacing: '4px' }}
        >
          {roomCode}
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--text)' }}>
          Share this code with your players
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Players joined */}
        <section>
          <h3
            className="text-sm mb-2"
            style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}
          >
            Players ({playerCount})
          </h3>
          {playerCount === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: 'var(--text)' }}>
              Waiting for players to join…
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-lg animate-fade-in"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderLeft: '3px solid var(--accent)',
                    border: '1px solid var(--border)',
                    borderLeftWidth: '3px',
                    borderLeftColor: 'var(--accent)',
                  }}
                >
                  <Shield size={16} style={{ color: 'var(--accent)' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', fontSize: '0.85rem' }}>
                      {p.character_name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text)' }}>{p.character_class}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Add Enemy */}
        <section>
          <h3
            className="text-sm mb-2"
            style={{ color: '#ef4444', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}
          >
            Add Enemy
          </h3>
          <form onSubmit={handleAddEnemy} className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Enemy name"
              value={enemyName}
              onChange={(e) => setEnemyName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)' }}
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] uppercase block mb-1" style={{ color: 'var(--text)', letterSpacing: '0.5px' }}>Initiative</label>
                <NumericInput
                  value={enemyInit}
                  onChange={setEnemyInit}
                  min={-10}
                  max={40}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)' }}
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase block mb-1" style={{ color: 'var(--text)', letterSpacing: '0.5px' }}>HP</label>
                <NumericInput
                  value={enemyHp}
                  onChange={setEnemyHp}
                  min={1}
                  max={9999}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)' }}
                />
              </div>
              <button
                type="submit"
                disabled={!enemyName.trim()}
                className="self-end px-4 py-2.5 rounded-lg cursor-pointer disabled:opacity-30 shrink-0"
                style={{ background: 'rgba(185,28,28,0.2)', color: '#ef4444', border: '1px solid rgba(185,28,28,0.3)', fontFamily: 'var(--heading)', fontSize: '0.8rem' }}
              >
                <Plus size={16} />
              </button>
            </div>
          </form>
        </section>

        {/* Add from Your Characters */}
        <section>
          <button
            onClick={() => setShowCharPicker(!showCharPicker)}
            className="text-sm flex items-center gap-2 cursor-pointer bg-transparent mb-2"
            style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '0.5px', border: 'none', padding: 0 }}
          >
            <Shield size={14} />
            {showCharPicker ? 'Hide Characters' : 'Add from Your Characters'}
          </button>
          {showCharPicker && (
            <div className="flex flex-col gap-2 animate-fade-in">
              {characters.length === 0 ? (
                <p className="text-xs py-2" style={{ color: 'var(--text)' }}>No saved characters</p>
              ) : (
                characters.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 p-2.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', fontSize: '0.8rem' }}>
                        {c.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text)' }}>
                        {[c.race, c.class].filter(Boolean).join(' · ')} · {c.current_hp}/{c.max_hp} HP
                      </p>
                    </div>
                    <button
                      onClick={() => onAddCharacterCombatant(c.id, c.name, c.current_hp, c.max_hp, 'enemy')}
                      className="px-2.5 py-1.5 rounded text-xs cursor-pointer"
                      style={{ background: 'rgba(185,28,28,0.15)', color: '#ef4444', border: '1px solid rgba(185,28,28,0.3)', fontFamily: 'var(--heading)', fontSize: '0.7rem' }}
                    >
                      Enemy
                    </button>
                    <button
                      onClick={() => onAddCharacterCombatant(c.id, c.name, c.current_hp, c.max_hp, 'ally')}
                      className="px-2.5 py-1.5 rounded text-xs cursor-pointer"
                      style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', fontFamily: 'var(--heading)', fontSize: '0.7rem' }}
                    >
                      Ally
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* Initiative Order */}
        {combatants.length > 0 && (
          <section>
            <h3
              className="text-sm mb-2"
              style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}
            >
              Initiative Order
            </h3>
            <div className="flex flex-col gap-2">
              {combatants.map((c, i) => (
                <InitiativeRow
                  key={c.id}
                  combatant={c}
                  index={i}
                  isActive={false}
                  role="dm"
                  participant={participants.find((p) => p.id === c.participant_id)}
                  userId=""
                  onRemove={c.combatant_type !== 'player' ? () => onRemoveEnemy(c.id) : undefined}
                  onInitiativeChange={(val) => onInitiativeChange(c.id, val)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Begin Combat */}
      <div className="p-4" style={{ borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}>
        <button
          onClick={async () => {
            setStarting(true);
            await onBeginCombat();
            setStarting(false);
          }}
          disabled={!canStart || starting}
          className="w-full py-4 rounded-xl font-bold text-base cursor-pointer disabled:opacity-30 flex items-center justify-center gap-2"
          style={{
            background: canStart
              ? 'linear-gradient(135deg, #7f1d1d, #991b1b, #b91c1c)'
              : 'rgba(255,255,255,0.05)',
            color: canStart ? '#fff' : 'var(--text)',
            border: canStart ? '2px solid rgba(239,68,68,0.5)' : '1px solid var(--border)',
            fontFamily: 'var(--heading)',
            letterSpacing: '2px',
            boxShadow: canStart ? '0 0 30px rgba(185,28,28,0.3)' : 'none',
          }}
        >
          <Swords size={20} />
          {starting ? 'INITIATING…' : 'BEGIN COMBAT'}
        </button>
        {!canStart && (
          <p className="text-xs text-center mt-2" style={{ color: 'var(--text)' }}>
            At least one player must join before combat can begin
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   LOBBY — Player
   ═══════════════════════════════════════════════════ */
function PlayerLobby({
  roomCode,
  myName,
  participants,
  onLeave,
}: {
  roomCode: string;
  myName: string;
  participants: SessionParticipant[];
  onLeave: () => void;
}) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: darkBg }}>
      <header
        className="p-4 text-center"
        style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onLeave}
            className="p-2 rounded-lg cursor-pointer flex items-center gap-1"
            style={{ color: 'var(--text)', background: 'transparent', border: '1px solid var(--border)', fontSize: '12px' }}
          >
            <X size={14} /> Leave
          </button>
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
            <Shield size={10} className="inline mr-1" style={{ verticalAlign: '-1px' }} />
            {myName}
          </span>
        </div>
        <p className="text-xs mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}>
          ROOM CODE
        </p>
        <p
          className="text-4xl font-bold m-0 tracking-widest"
          style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', letterSpacing: '4px' }}
        >
          {roomCode}
        </p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        <div className="text-center">
          <div
            className="w-10 h-10 mx-auto mb-3 rounded-full"
            style={{
              border: '3px solid var(--border)',
              borderTopColor: 'var(--accent)',
              animation: 'diceRoll 1.5s linear infinite',
            }}
          />
          <p
            className="text-sm"
            style={{ color: 'var(--text)', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}
          >
            Waiting for DM to start combat…
          </p>
        </div>

        {participants.length > 1 && (
          <div className="w-full max-w-sm">
            <h3
              className="text-xs mb-2 text-center"
              style={{ color: 'var(--text)', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}
            >
              PLAYERS IN SESSION
            </h3>
            <div className="flex flex-col gap-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
                >
                  <Shield size={14} style={{ color: 'var(--accent)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', fontSize: '0.8rem' }}>
                    {p.character_name}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text)' }}>{p.character_class}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ACTIVE COMBAT — DM
   ═══════════════════════════════════════════════════ */
function DMActive({
  session,
  combatants,
  participants,
  onNextTurn,
  onEnemyHpDelta,
  onRemoveEnemy,
  onInitiativeChange,
  onEndSession,
}: {
  session: { current_turn_index: number; round_number: number; room_code: string };
  combatants: Combatant[];
  participants: SessionParticipant[];
  onNextTurn: () => Promise<void>;
  onEnemyHpDelta: (id: string, delta: number) => Promise<void>;
  onRemoveEnemy: (id: string) => Promise<void>;
  onInitiativeChange: (id: string, init: number) => Promise<void>;
  onEndSession: () => Promise<void>;
}) {
  const [confirmEnd, setConfirmEnd] = useState(false);

  return (
    <div className="flex flex-col flex-1">
      {/* Top bar */}
      <header
        className="flex items-center justify-between p-3"
        style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.4)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', fontFamily: 'var(--mono)' }}>
            {session.room_code}
          </span>
          <span className="text-sm font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>
            Round {session.round_number}
          </span>
        </div>
        <Crown size={16} style={{ color: 'var(--accent)' }} />
      </header>

      {/* Initiative list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-2">
          {combatants.map((c, i) => (
            <InitiativeRow
              key={c.id}
              combatant={c}
              index={i}
              isActive={i === session.current_turn_index}
              role="dm"
              participant={participants.find((p) => p.id === c.participant_id)}
              userId=""
              onRemove={c.combatant_type !== 'player' ? () => onRemoveEnemy(c.id) : undefined}
              onHpDelta={c.combatant_type !== 'player' ? (d) => onEnemyHpDelta(c.id, d) : undefined}
              onInitiativeChange={(val) => onInitiativeChange(c.id, val)}
            />
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="p-4 flex gap-3" style={{ borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.4)' }}>
        {confirmEnd ? (
          <>
            <button
              onClick={() => setConfirmEnd(false)}
              className="flex-1 py-3 rounded-xl cursor-pointer"
              style={{ color: 'var(--text)', background: 'transparent', border: '1px solid var(--border)', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}
            >
              Cancel
            </button>
            <button
              onClick={onEndSession}
              className="flex-1 py-3 rounded-xl cursor-pointer"
              style={{ background: 'rgba(185,28,28,0.3)', color: '#ef4444', border: '1px solid rgba(185,28,28,0.5)', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}
            >
              Confirm End
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setConfirmEnd(true)}
              className="px-4 py-3 rounded-xl cursor-pointer"
              style={{ color: 'var(--text)', background: 'transparent', border: '1px solid var(--border)', fontFamily: 'var(--heading)', fontSize: '0.8rem' }}
            >
              End
            </button>
            <button
              onClick={onNextTurn}
              className="flex-1 py-3 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
                color: '#0a0910',
                border: 'none',
                fontFamily: 'var(--heading)',
                letterSpacing: '1.5px',
                fontSize: '1rem',
              }}
            >
              Next Turn <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ACTIVE COMBAT — Player
   ═══════════════════════════════════════════════════ */
function PlayerActive({
  session,
  combatants,
  participants,
  userId,
  onMyHpChange,
}: {
  session: { current_turn_index: number; round_number: number; room_code: string };
  combatants: Combatant[];
  participants: SessionParticipant[];
  userId: string;
  onMyHpChange: (newHp: number) => Promise<void>;
}) {
  const myParticipant = participants.find((p) => p.user_id === userId);
  const myCombatant = combatants.find((c) => c.participant_id === myParticipant?.id);
  const myCombatantIndex = combatants.findIndex((c) => c.participant_id === myParticipant?.id);
  const isMyTurn = myCombatantIndex === session.current_turn_index;
  const prevTurnRef = useRef(isMyTurn);

  // Vibrate + sound on turn change to me
  useEffect(() => {
    if (isMyTurn && !prevTurnRef.current) {
      try { navigator.vibrate?.(200); } catch { /* unsupported */ }
    }
    prevTurnRef.current = isMyTurn;
  }, [isMyTurn]);

  return (
    <div className="flex flex-col flex-1">
      {/* YOUR TURN banner */}
      {isMyTurn && (
        <div
          className="py-3 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(240,192,64,0.15))',
            borderBottom: '2px solid var(--accent)',
            animation: 'yourTurnFlash 1.5s ease-in-out infinite',
          }}
        >
          <span
            className="text-lg font-bold"
            style={{ color: 'var(--accent-bright)', fontFamily: 'var(--heading)', letterSpacing: '3px' }}
          >
            ⚔️ YOUR TURN
          </span>
        </div>
      )}

      {/* Top bar */}
      <header
        className="flex items-center justify-between p-3"
        style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.4)' }}
      >
        <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', fontFamily: 'var(--mono)' }}>
          {session.room_code}
        </span>
        <span className="text-sm font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>
          Round {session.round_number}
        </span>
        {myParticipant && (
          <span className="text-xs" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}>
            {myParticipant.character_name}
          </span>
        )}
      </header>

      {/* My HP — large */}
      {myParticipant && myCombatant && (
        <div
          className="p-4 flex items-center justify-center gap-4"
          style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}
        >
          <button
            onClick={() => onMyHpChange(Math.max(0, myCombatant.current_hp - 1))}
            className="w-14 h-14 rounded-xl flex items-center justify-center cursor-pointer"
            style={{ background: 'rgba(185,28,28,0.2)', color: 'var(--hp-red)', border: '2px solid rgba(185,28,28,0.4)', fontSize: '1.5rem' }}
          >
            <Minus size={24} />
          </button>
          <div className="text-center min-w-[6rem]">
            <p className="text-3xl font-bold m-0" style={{ color: 'var(--hp-crimson)', fontFamily: 'var(--mono)' }}>
              {myCombatant.current_hp}
            </p>
            <p className="text-xs m-0" style={{ color: 'var(--text)' }}>/ {myCombatant.max_hp} HP</p>
          </div>
          <button
            onClick={() => onMyHpChange(Math.min(myCombatant.max_hp, myCombatant.current_hp + 1))}
            className="w-14 h-14 rounded-xl flex items-center justify-center cursor-pointer"
            style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--hp-green)', border: '2px solid rgba(74,222,128,0.3)', fontSize: '1.5rem' }}
          >
            <Plus size={24} />
          </button>
        </div>
      )}

      {/* Initiative list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-2">
          {combatants.map((c, i) => (
            <InitiativeRow
              key={c.id}
              combatant={c}
              index={i}
              isActive={i === session.current_turn_index}
              role="player"
              participant={participants.find((p) => p.id === c.participant_id)}
              userId={userId}
              onMyHpChange={onMyHpChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN LiveCombat Component
   ═══════════════════════════════════════════════════ */
export function LiveCombat({
  sessionId,
  userId,
  role,
  characters,
  onLeave,
}: LiveCombatProps) {
  const {
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
  } = useCombatSession(sessionId, userId);

  const myParticipant = participants.find((p) => p.user_id === userId);
  const myCombatant = combatants.find((c) => c.participant_id === myParticipant?.id);
  const myCombatantIndex = combatants.findIndex((c) => c.participant_id === myParticipant?.id);

  // Tab switching between initiative order and combat sheet
  const [activeView, setActiveView] = useState<ActiveView>('initiative');
  const [dmSheetCharId, setDmSheetCharId] = useState<string | null>(null);

  // Ref to the active CombatSheetLoader's resource consumption functions
  const resourceConsumersRef = useRef<ResourceConsumers | null>(null);

  // Turn-based action flow state — consolidated to avoid useEffect setState
  const [turnState, setTurnState] = useState<{
    forTurnIndex: number | null;
    usedTypes: Set<string>;
    action: { spell?: Spell; feature?: Feature; actionType: ActionType } | null;
    warning: { spell?: Spell; feature?: Feature; actionType: ActionType } | null;
  }>({ forTurnIndex: null, usedTypes: new Set(), action: null, warning: null });

  const currentTurnIndex = session?.current_turn_index ?? null;
  const isSameTurn = currentTurnIndex !== null && currentTurnIndex === turnState.forTurnIndex;

  // Derived values — auto-reset when turn changes
  const usedActionTypes = useMemo(
    () => (isSameTurn ? turnState.usedTypes : new Set<string>()),
    [isSameTurn, turnState.usedTypes],
  );
  const turnAction = isSameTurn ? turnState.action : null;
  const actionWarning = isSameTurn ? turnState.warning : null;

  // DM's characters that are in this combat session (have character_id set)
  const dmCharacterCombatants = useMemo(
    () => combatants.filter((c) => c.character_id && c.combatant_type !== 'player'),
    [combatants],
  );

  // For player: find their character_id from participants
  const myCharacterId = myParticipant?.character_id ?? null;

  // Effective DM sheet character: user selection or first available
  const effectiveDmSheetCharId = dmSheetCharId
    ?? (dmCharacterCombatants.length > 0 ? dmCharacterCombatants[0].character_id : null);

  // Determine if it's the current user's turn
  const isMyTurnAsPlayer = role === 'player' && myCombatantIndex === session?.current_turn_index;
  const activeCombatant = session ? combatants[session.current_turn_index] : null;
  const isMyTurnAsDm = role === 'dm' && activeCombatant && activeCombatant.combatant_type !== 'player' && !!activeCombatant.character_id;
  const isMyTurn = isMyTurnAsPlayer || isMyTurnAsDm;

  // The combatant whose turn it is for the current user's action flow
  const actionFlowCombatantId = isMyTurnAsPlayer
    ? (myCombatant?.id ?? null)
    : isMyTurnAsDm ? (activeCombatant?.id ?? null) : null;

  // Handle action initiated from combat sheet
  const handleActionInitiated = useCallback((action: { spell?: Spell; feature?: Feature; actionType: ActionType }) => {
    if (usedActionTypes.has(action.actionType)) {
      setTurnState(prev => ({ ...prev, forTurnIndex: currentTurnIndex, warning: action }));
    } else {
      setTurnState(prev => ({ ...prev, forTurnIndex: currentTurnIndex, action }));
      setActiveView('initiative'); // will show TurnActionFlow overlay
    }
  }, [usedActionTypes, currentTurnIndex]);

  // Handle confirming a duplicate action warning
  function confirmActionWarning() {
    if (actionWarning) {
      setTurnState(prev => ({ ...prev, action: actionWarning, warning: null }));
      setActiveView('initiative');
    }
  }

  // Handle action flow completion — apply damage, consume resources
  const handleActionComplete = useCallback(async (result: TurnActionResult) => {
    if (!turnAction) return;

    // Apply HP changes to targets
    if (result.effectType !== 'none' && result.amount > 0) {
      const delta = result.effectType === 'damage' ? -result.amount : result.amount;
      await Promise.all(
        result.targets.map((combatantId) => applyCombatantHpDelta(combatantId, delta)),
      );
    }

    // Consume spell slot for leveled spells
    if (turnAction.spell && turnAction.spell.level > 0 && resourceConsumersRef.current) {
      await resourceConsumersRef.current.consumeSpellSlot(turnAction.spell.level);
    }

    // Consume feature use for abilities with limited uses
    if (turnAction.feature && resourceConsumersRef.current) {
      await resourceConsumersRef.current.consumeFeatureUse(turnAction.feature.id);
    }

    // Mark action type as used and clear action flow
    setTurnState(prev => ({
      ...prev,
      forTurnIndex: currentTurnIndex,
      usedTypes: new Set([...(prev.forTurnIndex === currentTurnIndex ? prev.usedTypes : []), turnAction.actionType]),
      action: null,
    }));
  }, [turnAction, applyCombatantHpDelta, currentTurnIndex]);

  // Auto-leave when session ends
  useEffect(() => {
    if (session?.status === 'ended') {
      const t = setTimeout(onLeave, 2000);
      return () => clearTimeout(t);
    }
  }, [session?.status, onLeave]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: darkBg }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full"
            style={{ border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'diceRoll 1s linear infinite' }}
          />
          <p style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>Loading session…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: darkBg }}>
        <div className="text-center p-6">
          <p className="mb-4" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>Session not found</p>
          <button
            onClick={onLeave}
            className="px-6 py-3 rounded-lg cursor-pointer"
            style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', fontFamily: 'var(--heading)' }}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (session.status === 'ended') {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: darkBg }}>
        <div className="text-center p-6 animate-fade-in">
          <Swords size={48} style={{ color: 'var(--text)', margin: '0 auto 1rem' }} />
          <p className="text-xl mb-2" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', letterSpacing: '2px' }}>
            COMBAT ENDED
          </p>
          <p className="text-sm" style={{ color: 'var(--text)' }}>Returning to home screen…</p>
        </div>
      </div>
    );
  }

  // Lobby
  if (session.status === 'lobby') {
    if (role === 'dm') {
      return (
        <DMLobby
          roomCode={session.room_code}
          participants={participants}
          combatants={combatants}
          characters={characters}
          onAddEnemy={addEnemy}
          onAddCharacterCombatant={addCombatantFromCharacter}
          onRemoveEnemy={removeEnemy}
          onInitiativeChange={updateCombatantInitiative}
          onBeginCombat={beginCombat}
          onLeave={onLeave}
        />
      );
    }
    return (
      <PlayerLobby
        roomCode={session.room_code}
        myName={myParticipant?.character_name ?? 'Unknown'}
        participants={participants}
        onLeave={onLeave}
      />
    );
  }

  // ── Shared UI pieces for active combat ──

  // Action warning modal (duplicate action type)
  const actionWarningModal = actionWarning && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.8)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--accent-border)' }}
      >
        <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}>
          ACTION ALREADY USED
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text)', lineHeight: '1.5' }}>
          You&apos;ve already used your <strong style={{ color: 'var(--text-h)' }}>{actionWarning.actionType === 'bonus_action' ? 'Bonus Action' : actionWarning.actionType.charAt(0).toUpperCase() + actionWarning.actionType.slice(1)}</strong> this turn. Continue anyway?
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setTurnState(prev => ({ ...prev, warning: null }))}
            className="flex-1 py-2.5 rounded-xl cursor-pointer"
            style={{ color: 'var(--text)', background: 'transparent', border: '1px solid var(--border)', fontFamily: 'var(--heading)', fontSize: '0.8rem' }}
          >
            Cancel
          </button>
          <button
            onClick={confirmActionWarning}
            className="flex-1 py-2.5 rounded-xl cursor-pointer"
            style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', fontFamily: 'var(--heading)', fontSize: '0.8rem' }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );

  // TurnActionFlow overlay element (rendered on top of content, not replacing it)
  const turnActionOverlay = turnAction && session ? (
    <div className="fixed inset-0 z-50">
      <TurnActionFlow
        actionName={turnAction.spell?.name ?? turnAction.feature?.title ?? 'Action'}
        actionDescription={turnAction.spell?.description ?? turnAction.feature?.description}
        actionType={turnAction.actionType}
        combatants={combatants}
        participants={participants}
        myCombatantId={actionFlowCombatantId}
        onComplete={handleActionComplete}
        onCancel={() => setTurnState(prev => ({ ...prev, action: null }))}
      />
    </div>
  ) : null;

  // End Turn button for players
  const endTurnButton = isMyTurn && (
    <div className="p-3" style={{ borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.4)' }}>
      {/* Action economy indicators */}
      {usedActionTypes.size > 0 && (
        <div className="flex items-center gap-2 mb-2 justify-center">
          <span className="text-xs" style={{ color: 'var(--text)', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}>Used:</span>
          {Array.from(usedActionTypes).map((at) => (
            <span
              key={at}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontFamily: 'var(--heading)', fontSize: '0.6rem', letterSpacing: '0.5px' }}
            >
              {at === 'bonus_action' ? 'Bonus Action' : at.charAt(0).toUpperCase() + at.slice(1)}
            </span>
          ))}
        </div>
      )}
      <button
        onClick={nextTurn}
        className="w-full py-3 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-2"
        style={{
          background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
          color: '#0a0910',
          border: 'none',
          fontFamily: 'var(--heading)',
          letterSpacing: '1.5px',
          fontSize: '0.9rem',
        }}
      >
        <Flag size={16} />
        End Turn
      </button>
    </div>
  );

  // Active combat — DM
  if (role === 'dm') {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: darkBg }}>
        {actionWarningModal}
        {turnActionOverlay}
        <ActiveViewTabs active={activeView} onChange={setActiveView} />

        {/* DM turn notification for their characters */}
        {isMyTurnAsDm && activeCombatant && activeView === 'initiative' && (
          <div
            className="py-2.5 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(240,192,64,0.1))',
              borderBottom: '2px solid var(--accent)',
              animation: 'yourTurnFlash 1.5s ease-in-out infinite',
            }}
          >
            <span className="text-sm font-bold" style={{ color: 'var(--accent-bright)', fontFamily: 'var(--heading)', letterSpacing: '2px' }}>
              ⚔️ {activeCombatant.name}&apos;s TURN
            </span>
            <button
              onClick={() => {
                const dmChar = dmCharacterCombatants.find((c) => c.id === activeCombatant.id);
                if (dmChar?.character_id) {
                  setDmSheetCharId(dmChar.character_id);
                  setActiveView('sheet');
                }
              }}
              className="ml-3 px-2 py-0.5 rounded text-xs cursor-pointer"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', fontFamily: 'var(--heading)', fontSize: '0.6rem' }}
            >
              Open Sheet →
            </button>
          </div>
        )}

        {activeView === 'initiative' ? (
          <DMActive
            session={session}
            combatants={combatants}
            participants={participants}
            onNextTurn={nextTurn}
            onEnemyHpDelta={updateEnemyHp}
            onRemoveEnemy={removeEnemy}
            onInitiativeChange={updateCombatantInitiative}
            onEndSession={endSession}
          />
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* DM character selector dropdown */}
            {dmCharacterCombatants.length > 0 ? (
              <>
                <div className="p-3" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}>
                  <div className="relative">
                    <select
                      value={effectiveDmSheetCharId ?? ''}
                      onChange={(e) => setDmSheetCharId(e.target.value || null)}
                      className="w-full appearance-none py-2.5 px-3 pr-10 rounded-lg text-sm cursor-pointer"
                      style={{
                        background: 'var(--bg-surface)',
                        color: 'var(--text-h)',
                        border: '1px solid var(--border)',
                        fontFamily: 'var(--heading)',
                        fontSize: '0.85rem',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {dmCharacterCombatants.map((c) => (
                        <option key={c.id} value={c.character_id ?? ''}>
                          {c.name} ({c.combatant_type === 'ally' ? 'Ally' : 'Enemy'})
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text)' }}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {effectiveDmSheetCharId && (
                    <CombatSheetLoader
                      characterId={effectiveDmSheetCharId}
                      onCombatHpSync={(newHp) => {
                        const combatant = combatants.find((c) => c.character_id === effectiveDmSheetCharId);
                        if (combatant) {
                          const delta = newHp - combatant.current_hp;
                          if (delta !== 0) updateEnemyHp(combatant.id, delta);
                        }
                      }}
                      onActionInitiated={isMyTurnAsDm && activeCombatant?.character_id === effectiveDmSheetCharId ? handleActionInitiated : undefined}
                      usedActionTypes={isMyTurnAsDm && activeCombatant?.character_id === effectiveDmSheetCharId ? usedActionTypes : undefined}
                      resourceConsumersRef={isMyTurnAsDm && activeCombatant?.character_id === effectiveDmSheetCharId ? resourceConsumersRef : undefined}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <ScrollText size={32} style={{ color: 'var(--text)', margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p className="text-sm mb-1" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>
                    No Character Sheets Available
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text)', maxWidth: '16rem', margin: '0 auto' }}>
                    Add characters from your collection in the lobby to view their combat sheets here.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Active combat — Player
  return (
    <div className="flex flex-col min-h-screen" style={{ background: darkBg }}>
      {actionWarningModal}
      {turnActionOverlay}
      <ActiveViewTabs active={activeView} onChange={setActiveView} />
      {activeView === 'initiative' ? (
        <>
          <PlayerActive
            session={session}
            combatants={combatants}
            participants={participants}
            userId={userId}
            onMyHpChange={updateMyHp}
          />
          {endTurnButton}
        </>
      ) : myCharacterId ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <CombatSheetLoader
              characterId={myCharacterId}
              onCombatHpSync={updateMyHp}
              onActionInitiated={isMyTurnAsPlayer ? handleActionInitiated : undefined}
              usedActionTypes={isMyTurnAsPlayer ? usedActionTypes : undefined}
              resourceConsumersRef={isMyTurnAsPlayer ? resourceConsumersRef : undefined}
            />
          </div>
          {endTurnButton}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
            Character not linked to this session.
          </p>
        </div>
      )}
    </div>
  );
}

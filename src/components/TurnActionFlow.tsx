import { useState } from 'react';
import type { Combatant, SessionParticipant, ActionType } from '../types/database';
import { ActionTypeBadge } from './ActionType';
import {
  Target,
  Skull,
  Shield,
  User,
  Swords,
  Heart,
  Zap,
  Check,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

/* ── Types ─── */

export interface TurnActionResult {
  targets: string[];
  effectType: 'damage' | 'healing' | 'none';
  amount: number;
}

interface TurnActionFlowProps {
  actionName: string;
  actionDescription?: string;
  actionType: ActionType;
  combatants: Combatant[];
  participants: SessionParticipant[];
  /** The current user's combatant ID (for "Self" option) */
  myCombatantId: string | null;
  onComplete: (result: TurnActionResult) => void;
  onCancel: () => void;
}

/* ── Helpers ─── */

type EffectType = 'damage' | 'healing' | 'none';

const darkBg = 'linear-gradient(180deg, #08070d 0%, #0d0b14 50%, #08070d 100%)';

function combatantIcon(type: Combatant['combatant_type']) {
  switch (type) {
    case 'enemy':
      return <Skull size={16} style={{ color: '#ef4444', flexShrink: 0 }} />;
    case 'ally':
      return <Shield size={16} style={{ color: '#60a5fa', flexShrink: 0 }} />;
    case 'player':
      return <Shield size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />;
  }
}

function borderColor(type: Combatant['combatant_type']) {
  switch (type) {
    case 'enemy': return '#ef4444';
    case 'ally': return '#60a5fa';
    case 'player': return 'var(--accent)';
  }
}

/* ═══════════════════════════════════════════════════
   TARGET SELECTION PHASE
   ═══════════════════════════════════════════════════ */

function TargetRow({
  name,
  subtitle,
  icon,
  border,
  selected,
  onToggle,
  isSelf,
}: {
  name: string;
  subtitle?: string;
  icon: React.ReactNode;
  border: string;
  selected: boolean;
  onToggle: () => void;
  isSelf?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98]"
      style={{
        background: selected ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.02)',
        border: selected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
        borderLeft: `4px solid ${border}`,
      }}
    >
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all"
        style={{
          background: selected ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
          border: selected ? 'none' : '1px solid var(--border)',
        }}
      >
        {selected && <Check size={14} style={{ color: '#0a0910' }} />}
      </div>
      {icon}
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-semibold truncate m-0" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', fontSize: '0.8rem' }}>
          {name}
          {isSelf && (
            <span className="ml-2 text-xs" style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>(You)</span>
          )}
        </p>
        {subtitle && (
          <p className="text-xs truncate m-0" style={{ color: 'var(--text)' }}>{subtitle}</p>
        )}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */

export function TurnActionFlow({
  actionName,
  actionDescription,
  actionType,
  combatants,
  participants,
  myCombatantId,
  onComplete,
  onCancel,
}: TurnActionFlowProps) {
  const [phase, setPhase] = useState<'targeting' | 'effect'>('targeting');
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [effectType, setEffectType] = useState<EffectType>('damage');
  const [amount, setAmount] = useState('');

  // Separate combatants into groups
  const enemies = combatants.filter((c) => c.combatant_type === 'enemy');
  const allies = combatants.filter((c) => c.combatant_type === 'ally');
  const players = combatants.filter((c) => c.combatant_type === 'player' && c.id !== myCombatantId);
  const self = combatants.find((c) => c.id === myCombatantId);

  function toggleTarget(id: string) {
    setSelectedTargets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllInGroup(group: Combatant[]) {
    setSelectedTargets((prev) => {
      const next = new Set(prev);
      const allSelected = group.every((c) => next.has(c.id));
      if (allSelected) {
        group.forEach((c) => next.delete(c.id));
      } else {
        group.forEach((c) => next.add(c.id));
      }
      return next;
    });
  }

  function handleContinue() {
    if (selectedTargets.size === 0) return;
    setPhase('effect');
  }

  function handleApply() {
    if (effectType === 'none') {
      onComplete({ targets: Array.from(selectedTargets), effectType: 'none', amount: 0 });
      return;
    }
    const parsed = parseInt(amount, 10);
    if (isNaN(parsed) || parsed <= 0) return;
    onComplete({ targets: Array.from(selectedTargets), effectType, amount: parsed });
  }

  /* ── TARGETING PHASE ── */
  if (phase === 'targeting') {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: darkBg }}>
        {/* Header */}
        <header className="p-4" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.4)' }}>
          <button
            onClick={onCancel}
            className="flex items-center gap-1 mb-3 cursor-pointer"
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontFamily: 'var(--heading)', fontSize: '0.75rem', letterSpacing: '0.5px' }}
          >
            <ChevronLeft size={14} /> Cancel
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} style={{ color: 'var(--accent-bright)' }} />
            <h2 className="text-lg font-bold m-0" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}>
              {actionName}
            </h2>
            <ActionTypeBadge type={actionType} small />
          </div>
          {actionDescription && (
            <p className="text-xs mt-1 mb-0 line-clamp-2" style={{ color: 'var(--text)', lineHeight: '1.5' }}>
              {actionDescription}
            </p>
          )}
        </header>

        {/* Target list */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target size={14} style={{ color: 'var(--accent)' }} />
            <h3
              className="text-xs font-bold m-0"
              style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}
            >
              SELECT TARGETS
            </h3>
            <span className="text-xs ml-auto" style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
              {selectedTargets.size} selected
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {/* Self */}
            {self && (
              <TargetRow
                name={self.name}
                subtitle="Self"
                icon={<User size={16} style={{ color: 'var(--accent-bright)', flexShrink: 0 }} />}
                border="var(--accent-bright)"
                selected={selectedTargets.has(self.id)}
                onToggle={() => toggleTarget(self.id)}
                isSelf
              />
            )}

            {/* Enemies */}
            {enemies.length > 0 && (
              <>
                <button
                  onClick={() => selectAllInGroup(enemies)}
                  className="flex items-center gap-2 mt-3 mb-1 cursor-pointer"
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontFamily: 'var(--heading)', fontSize: '0.65rem', letterSpacing: '1px' }}
                >
                  <Skull size={12} />
                  ENEMIES ({enemies.length})
                  <span className="text-xs opacity-60" style={{ fontFamily: 'var(--mono)' }}>
                    — tap to {enemies.every((c) => selectedTargets.has(c.id)) ? 'deselect' : 'select'} all
                  </span>
                </button>
                {enemies.map((c) => (
                  <TargetRow
                    key={c.id}
                    name={c.name}
                    subtitle={`${c.current_hp}/${c.max_hp} HP`}
                    icon={combatantIcon('enemy')}
                    border={borderColor('enemy')}
                    selected={selectedTargets.has(c.id)}
                    onToggle={() => toggleTarget(c.id)}
                  />
                ))}
              </>
            )}

            {/* Players (excluding self) */}
            {players.length > 0 && (
              <>
                <button
                  onClick={() => selectAllInGroup(players)}
                  className="flex items-center gap-2 mt-3 mb-1 cursor-pointer"
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontFamily: 'var(--heading)', fontSize: '0.65rem', letterSpacing: '1px' }}
                >
                  <Shield size={12} />
                  PLAYERS ({players.length})
                  <span className="text-xs opacity-60" style={{ fontFamily: 'var(--mono)' }}>
                    — tap to {players.every((c) => selectedTargets.has(c.id)) ? 'deselect' : 'select'} all
                  </span>
                </button>
                {players.map((c) => {
                  const p = participants.find((pp) => pp.id === c.participant_id);
                  return (
                    <TargetRow
                      key={c.id}
                      name={c.name}
                      subtitle={p ? `${p.character_class}` : undefined}
                      icon={combatantIcon('player')}
                      border={borderColor('player')}
                      selected={selectedTargets.has(c.id)}
                      onToggle={() => toggleTarget(c.id)}
                    />
                  );
                })}
              </>
            )}

            {/* Allies */}
            {allies.length > 0 && (
              <>
                <button
                  onClick={() => selectAllInGroup(allies)}
                  className="flex items-center gap-2 mt-3 mb-1 cursor-pointer"
                  style={{ background: 'none', border: 'none', color: '#60a5fa', fontFamily: 'var(--heading)', fontSize: '0.65rem', letterSpacing: '1px' }}
                >
                  <Shield size={12} />
                  ALLIES ({allies.length})
                  <span className="text-xs opacity-60" style={{ fontFamily: 'var(--mono)' }}>
                    — tap to {allies.every((c) => selectedTargets.has(c.id)) ? 'deselect' : 'select'} all
                  </span>
                </button>
                {allies.map((c) => (
                  <TargetRow
                    key={c.id}
                    name={c.name}
                    subtitle={`${c.current_hp}/${c.max_hp} HP`}
                    icon={combatantIcon('ally')}
                    border={borderColor('ally')}
                    selected={selectedTargets.has(c.id)}
                    onToggle={() => toggleTarget(c.id)}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.4)' }}>
          <button
            onClick={handleContinue}
            disabled={selectedTargets.size === 0}
            className="w-full py-3.5 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-2 transition-opacity"
            style={{
              background: selectedTargets.size > 0
                ? 'linear-gradient(135deg, var(--accent), var(--accent-bright))'
                : 'var(--border)',
              color: selectedTargets.size > 0 ? '#0a0910' : 'var(--text)',
              border: 'none',
              fontFamily: 'var(--heading)',
              letterSpacing: '1.5px',
              fontSize: '0.9rem',
              opacity: selectedTargets.size > 0 ? 1 : 0.5,
            }}
          >
            Continue — {selectedTargets.size} Target{selectedTargets.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    );
  }

  /* ── EFFECT & DAMAGE PHASE ── */
  const selectedCombatants = combatants.filter((c) => selectedTargets.has(c.id));

  return (
    <div className="flex flex-col min-h-screen" style={{ background: darkBg }}>
      {/* Header */}
      <header className="p-4" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.4)' }}>
        <button
          onClick={() => setPhase('targeting')}
          className="flex items-center gap-1 mb-3 cursor-pointer"
          style={{ background: 'none', border: 'none', color: 'var(--accent)', fontFamily: 'var(--heading)', fontSize: '0.75rem', letterSpacing: '0.5px' }}
        >
          <ChevronLeft size={14} /> Back to Targets
        </button>
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: 'var(--accent-bright)' }} />
          <h2 className="text-lg font-bold m-0" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}>
            {actionName}
          </h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Targets summary */}
        <div className="mb-5">
          <h3 className="text-xs font-bold mb-2" style={{ color: 'var(--text)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}>
            TARGETS
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedCombatants.map((c) => (
              <span
                key={c.id}
                className="px-2.5 py-1 rounded-lg text-xs"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${borderColor(c.combatant_type)}`,
                  color: 'var(--text-h)',
                  fontFamily: 'var(--heading)',
                  fontSize: '0.7rem',
                }}
              >
                {c.id === myCombatantId ? `${c.name} (Self)` : c.name}
              </span>
            ))}
          </div>
        </div>

        {/* Effect type selection */}
        <div className="mb-5">
          <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--text)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}>
            EFFECT TYPE
          </h3>
          <div className="flex gap-2">
            {([
              { type: 'damage' as EffectType, label: 'Damage', icon: Swords, color: '#ef4444', bg: 'rgba(185,28,28,0.15)', borderC: 'rgba(185,28,28,0.4)' },
              { type: 'healing' as EffectType, label: 'Healing', icon: Heart, color: '#4ade80', bg: 'rgba(74,222,128,0.1)', borderC: 'rgba(74,222,128,0.3)' },
              { type: 'none' as EffectType, label: 'No Effect', icon: Zap, color: 'var(--accent)', bg: 'var(--accent-bg)', borderC: 'var(--accent-border)' },
            ]).map((opt) => {
              const Icon = opt.icon;
              const isActive = effectType === opt.type;
              return (
                <button
                  key={opt.type}
                  onClick={() => setEffectType(opt.type)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: isActive ? opt.bg : 'rgba(255,255,255,0.02)',
                    border: isActive ? `1.5px solid ${opt.borderC}` : '1px solid var(--border)',
                    color: isActive ? opt.color : 'var(--text)',
                    fontFamily: 'var(--heading)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.5px',
                  }}
                >
                  <Icon size={14} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Damage/Healing amount input */}
        {effectType !== 'none' && (
          <div className="mb-5">
            <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--text)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}>
              {effectType === 'damage' ? 'DAMAGE' : 'HEALING'} AMOUNT
            </h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text)', opacity: 0.7 }}>
              Roll your dice, then enter the total {effectType === 'damage' ? 'damage' : 'healing'} here.
              This will be applied to {selectedTargets.size > 1 ? 'each' : 'the'} target.
            </p>
            <div className="flex items-center justify-center">
              <div className="w-40">
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  autoFocus
                  className="outline-none"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    background: 'var(--bg-surface)',
                    color: effectType === 'damage' ? '#ef4444' : '#4ade80',
                    border: effectType === 'damage'
                      ? '2px solid rgba(185,28,28,0.4)'
                      : '2px solid rgba(74,222,128,0.3)',
                    borderRadius: '0.75rem',
                    fontFamily: 'var(--mono)',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Apply button */}
      <div className="p-4" style={{ borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.4)' }}>
        <button
          onClick={handleApply}
          disabled={effectType !== 'none' && (!amount || parseInt(amount, 10) <= 0)}
          className="w-full py-3.5 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-2 transition-opacity"
          style={{
            background: effectType === 'damage'
              ? 'linear-gradient(135deg, #b91c1c, #ef4444)'
              : effectType === 'healing'
                ? 'linear-gradient(135deg, #15803d, #4ade80)'
                : 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
            color: effectType === 'healing' ? '#0a0910' : '#fff',
            border: 'none',
            fontFamily: 'var(--heading)',
            letterSpacing: '1.5px',
            fontSize: '0.9rem',
            opacity: effectType === 'none' || (amount && parseInt(amount, 10) > 0) ? 1 : 0.5,
          }}
        >
          {effectType === 'damage' && (
            <>
              <Swords size={18} />
              Deal {amount || '0'} Damage
            </>
          )}
          {effectType === 'healing' && (
            <>
              <Heart size={18} />
              Heal {amount || '0'} HP
            </>
          )}
          {effectType === 'none' && (
            <>
              <Check size={18} />
              Confirm — No Effect
            </>
          )}
        </button>
      </div>
    </div>
  );
}

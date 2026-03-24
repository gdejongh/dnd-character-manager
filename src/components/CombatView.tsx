import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Character, AbilityScore, SpellSlot, Spell, Feature, Weapon, Ability, ActionType } from '../types/database';
import {
  getModifier,
  getProficiencyBonus,
  formatModifier,
  getSpellSaveDC,
  getSpellAttackBonus,
  getSpellcastingAbility,
  getWeaponAttackBonus,
  formatWeaponDamage,
  ABILITY_NAMES,
} from '../constants/dnd';
import { ActionTypeBadge, ActionTypeFilterBar } from './ActionType';
import type { ActionTypeFilter } from '../constants/actionTypes';
import { Heart, Shield, Zap, FlameKindling, ChevronDown, Sparkles, Swords } from 'lucide-react';

/* ── Types ───────────────────────────────────────────────────────────────── */

interface CombatViewProps {
  character: Character;
  scores: AbilityScore[];
  slots: SpellSlot[];
  spells: Spell[];
  weapons: Weapon[];
  features: Feature[];
  onUpdateCharacter: (updates: Partial<Pick<Character, 'current_hp' | 'max_hp' | 'temp_hp'>>) => void;
  onSetSlotUsed: (level: number, used: number) => void;
  onUpdateFeature: (id: string, updates: Partial<Pick<Feature, 'used_uses'>>) => void;
  /** When provided, Cast/Use/Attack buttons trigger this instead of internal animation handlers */
  onActionInitiated?: (action: {
    spell?: Spell;
    feature?: Feature;
    weapon?: Weapon;
    actionType: ActionType;
    spellSlotLevel?: number;
  }) => void;
  /** Action types already used this turn — shows warning badge on those buttons */
  usedActionTypes?: ReadonlySet<string>;
  /** When true, user is in a combat session but it's not their turn — only reactions allowed */
  offTurn?: boolean;
}

const ORD: Record<number, string> = {
  0: 'Cantrip', 1: '1st', 2: '2nd', 3: '3rd', 4: '4th',
  5: '5th', 6: '6th', 7: '7th', 8: '8th', 9: '9th',
};

/* ── Animated number hook ────────────────────────────────────────────────── */

function useAnimatedNumber(target: number, duration = 300) {
  const [display, setDisplay] = useState(target);
  const [pulsing, setPulsing] = useState(false);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = display;
    const diff = target - start;
    if (diff === 0) return;
    setPulsing(true);
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setPulsing(false);
      }
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return { display, pulsing };
}

/* ── Arcane Explosion Overlay ────────────────────────────────────────────── */

function ArcaneExplosion({ spellName, onDone }: { spellName: string; onDone: () => void }) {
  const [phase, setPhase] = useState<'explode' | 'name' | 'fade'>('explode');

  // Pre-compute random particle data once on mount
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * 360;
      const dist = 80 + (((i * 7 + 3) % 11) / 11) * 60;
      const size = 4 + (((i * 5 + 2) % 9) / 9) * 4;
      const dx = Math.cos((angle * Math.PI) / 180) * dist;
      const dy = Math.sin((angle * Math.PI) / 180) * dist;
      return { dx, dy, size, colorIdx: i % 3 };
    }), []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('name'), 400);
    const t2 = setTimeout(() => setPhase('fade'), 1600);
    const t3 = setTimeout(onDone, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{ opacity: phase === 'fade' ? 0 : 1, transition: 'opacity 0.4s ease-out' }}
    >
      {/* Background flash */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.15) 40%, transparent 70%)',
          animation: phase === 'explode' ? 'fadeIn 0.2s ease-out' : undefined,
        }}
      />

      {/* Central burst */}
      <div
        className="absolute rounded-full"
        style={{
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(139,92,246,0.8) 30%, rgba(99,102,241,0.4) 60%, transparent 100%)',
          animation: 'arcaneExplosion 0.8s ease-out forwards',
        }}
      />

      {/* Expanding rings */}
      {[0, 150, 300].map((delay) => (
        <div
          key={delay}
          className="absolute rounded-full"
          style={{
            width: '100px',
            height: '100px',
            border: '3px solid rgba(139,92,246,0.7)',
            animation: `arcaneRing 0.9s ease-out ${delay}ms forwards`,
          }}
        />
      ))}

      {/* Particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.colorIdx === 0
              ? 'var(--accent-bright)'
              : p.colorIdx === 1
                ? 'var(--spell-violet)'
                : '#fff',
            animation: `arcaneParticle 0.7s ease-out ${100 + i * 40}ms forwards`,
            transform: `translate(${p.dx}px, ${p.dy}px)`,
            opacity: 0,
            animationFillMode: 'backwards',
          }}
        />
      ))}

      {/* Spell name */}
      {(phase === 'name' || phase === 'fade') && (
        <div
          className="absolute text-center px-6"
          style={{
            animation: 'diceReveal 0.5s ease-out both',
          }}
        >
          <div
            className="text-2xl font-bold animate-shimmer"
            style={{
              fontFamily: 'var(--heading)',
              letterSpacing: '2px',
              textShadow: '0 0 30px rgba(139,92,246,0.6), 0 0 60px rgba(99,102,241,0.3)',
            }}
          >
            {spellName}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Ability Use Burst ───────────────────────────────────────────────────── */

function AbilityBurst({ name, onDone }: { name: string; onDone: () => void }) {
  const [phase, setPhase] = useState<'burst' | 'name' | 'fade'>('burst');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('name'), 300);
    const t2 = setTimeout(() => setPhase('fade'), 1300);
    const t3 = setTimeout(onDone, 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{ opacity: phase === 'fade' ? 0 : 1, transition: 'opacity 0.3s ease-out' }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle, rgba(201,168,76,0.25) 0%, rgba(240,192,64,0.1) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '80px',
          height: '80px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(201,168,76,0.6) 40%, transparent 100%)',
          animation: 'arcaneExplosion 0.6s ease-out forwards',
        }}
      />
      {[0, 120].map((delay) => (
        <div
          key={delay}
          className="absolute rounded-full"
          style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(201,168,76,0.6)',
            animation: `arcaneRing 0.7s ease-out ${delay}ms forwards`,
          }}
        />
      ))}
      {(phase === 'name' || phase === 'fade') && (
        <div style={{ animation: 'diceReveal 0.4s ease-out both' }}>
          <div
            className="text-xl font-bold"
            style={{
              fontFamily: 'var(--heading)',
              color: 'var(--accent-bright)',
              letterSpacing: '1.5px',
              textShadow: '0 0 20px rgba(201,168,76,0.5)',
            }}
          >
            {name}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                          */
/* ══════════════════════════════════════════════════════════════════════════ */

export function CombatView({
  character,
  scores,
  slots,
  spells,
  weapons,
  features,
  onUpdateCharacter,
  onSetSlotUsed,
  onUpdateFeature,
  onActionInitiated,
  usedActionTypes,
  offTurn,
}: CombatViewProps) {
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [castingSpell, setCastingSpell] = useState<string | null>(null);
  const [usingAbility, setUsingAbility] = useState<string | null>(null);
  const [attackingWeapon, setAttackingWeapon] = useState<string | null>(null);
  const [upcastSelection, setUpcastSelection] = useState<{ spell: Spell; availableSlotLevels: number[] } | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionTypeFilter>('all');

  const { display: animatedHp, pulsing } = useAnimatedNumber(character.current_hp);

  const abilityScoreMap = Object.fromEntries(
    (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const).map((a) => [
      a,
      scores.find((s) => s.ability === a)?.score ?? 10,
    ]),
  ) as Record<Ability, number>;

  const spellSaveDC = getSpellSaveDC(character.class, character.level, abilityScoreMap);
  const spellAtkBonus = getSpellAttackBonus(character.class, character.level, abilityScoreMap);
  const castingAbility = getSpellcastingAbility(character.class);
  const profBonus = getProficiencyBonus(character.level);

  // Prepared spells grouped by level, with action filter applied
  const preparedSpells = spells.filter((s) => {
    if (!s.prepared && s.level !== 0) return false;
    if (actionFilter !== 'all' && (s.action_type ?? 'action') !== actionFilter) return false;
    return true;
  });
  const spellsByLevel = new Map<number, Spell[]>();
  for (const spell of preparedSpells) {
    const list = spellsByLevel.get(spell.level) ?? [];
    list.push(spell);
    spellsByLevel.set(spell.level, list);
  }
  const sortedLevels = [...spellsByLevel.keys()].sort((a, b) => a - b);

  // All prepared spells (unfiltered) for counts
  const allPreparedSpells = spells.filter((s) => s.prepared || s.level === 0);

  // Filtered features
  const filteredFeatures = features.filter((f) => {
    if (actionFilter === 'all') return true;
    return (f.action_type ?? 'other') === actionFilter;
  });

  // Filtered weapons
  const filteredWeapons = weapons.filter((w) => {
    if (actionFilter === 'all') return true;
    return (w.action_type ?? 'action') === actionFilter;
  });

  // HP helpers
  function adjustHp(amount: number) {
    if (amount < 0) {
      let remaining = Math.abs(amount);
      let newTemp = character.temp_hp;
      let newCurrent = character.current_hp;
      if (newTemp > 0) {
        if (remaining <= newTemp) { newTemp -= remaining; remaining = 0; }
        else { remaining -= newTemp; newTemp = 0; }
      }
      newCurrent = Math.max(0, newCurrent - remaining);
      onUpdateCharacter({ current_hp: newCurrent, temp_hp: newTemp });
    } else {
      const newHp = Math.min(character.max_hp, character.current_hp + amount);
      onUpdateCharacter({ current_hp: newHp });
    }
  }

  function handleCustomAction(heal: boolean) {
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    adjustHp(heal ? amount : -amount);
    setCustomAmount('');
  }

  const getAvailableSlotLevels = useCallback((spellLevel: number) => {
    return slots
      .filter((s) => s.level >= spellLevel && s.used < s.total)
      .map((s) => s.level)
      .sort((a, b) => a - b);
  }, [slots]);

  // Cast spell handler
  const handleCastSpell = useCallback((spell: Spell, slotLevel?: number) => {
    if (spell.level > 0) {
      const levelToUse = slotLevel ?? spell.level;
      const slot = slots.find((s) => s.level === levelToUse);
      if (!slot || slot.used >= slot.total) return;
      onSetSlotUsed(levelToUse, slot.used + 1);
    }
    setCastingSpell(spell.name);
  }, [slots, onSetSlotUsed]);

  const castSpellAction = useCallback((spell: Spell, slotLevel?: number) => {
    if (onActionInitiated) {
      onActionInitiated({
        spell,
        actionType: spell.action_type ?? 'action',
        spellSlotLevel: slotLevel,
      });
    } else {
      handleCastSpell(spell, slotLevel);
    }
  }, [onActionInitiated, handleCastSpell]);

  const handleUseAbility = useCallback((feature: Feature) => {
    // Decrement usage if feature has limited uses
    if (feature.max_uses !== null && feature.max_uses > 0) {
      if (feature.used_uses >= feature.max_uses) return;
      onUpdateFeature(feature.id, { used_uses: feature.used_uses + 1 });
    }
    setUsingAbility(feature.title);
  }, [onUpdateFeature]);

  const handleWeaponAttack = useCallback((_weapon: Weapon) => {
    setAttackingWeapon(_weapon.name);
  }, []);

  const hpPercent = character.max_hp > 0 ? (character.current_hp / character.max_hp) * 100 : 0;
  const hpColor = hpPercent > 50 ? 'var(--hp-green)' : hpPercent > 25 ? 'var(--hp-yellow)' : 'var(--hp-crimson)';
  const barGradient = hpPercent > 50
    ? 'linear-gradient(90deg, #22c55e, #4ade80)'
    : hpPercent > 25
      ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
      : 'linear-gradient(90deg, #991b1b, #dc2626)';

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 combat-entrance">
      {/* Explosion overlays */}
      {castingSpell && (
        <ArcaneExplosion spellName={castingSpell} onDone={() => setCastingSpell(null)} />
      )}
      {upcastSelection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.8)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--spell-border)' }}
          >
            <h3
              className="text-sm font-bold mb-2"
              style={{ color: 'var(--spell-indigo)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}
            >
              CAST WITH WHICH SLOT?
            </h3>
            <p className="text-sm mb-3" style={{ color: 'var(--text)', lineHeight: '1.5' }}>
              <strong style={{ color: 'var(--text-h)' }}>{upcastSelection.spell.name}</strong> is level {upcastSelection.spell.level}.
              Choose a spell slot level to cast it.
            </p>
            <div className="flex flex-col gap-2 mb-3">
              {upcastSelection.availableSlotLevels.map((slotLevel) => (
                <button
                  key={slotLevel}
                  onClick={() => {
                    castSpellAction(upcastSelection.spell, slotLevel);
                    setUpcastSelection(null);
                  }}
                  className="w-full py-2.5 rounded-xl cursor-pointer"
                  style={{
                    background: 'var(--spell-bg)',
                    color: 'var(--spell-indigo)',
                    border: '1px solid var(--spell-border)',
                    fontFamily: 'var(--heading)',
                    letterSpacing: '0.5px',
                  }}
                >
                  Use {ORD[slotLevel]} Level Slot
                </button>
              ))}
            </div>
            <button
              onClick={() => setUpcastSelection(null)}
              className="w-full py-2.5 rounded-xl cursor-pointer"
              style={{
                color: 'var(--text)',
                background: 'transparent',
                border: '1px solid var(--border)',
                fontFamily: 'var(--heading)',
                fontSize: '0.8rem',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {usingAbility && (
        <AbilityBurst name={usingAbility} onDone={() => setUsingAbility(null)} />
      )}
      {attackingWeapon && (
        <AbilityBurst name={attackingWeapon} onDone={() => setAttackingWeapon(null)} />
      )}

      {/* ── Combat Header ──────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 mb-1"
        style={{ color: 'var(--hp-crimson)' }}
      >
        <FlameKindling size={18} />
        <h3
          className="text-xs uppercase tracking-widest m-0"
          style={{ fontFamily: 'var(--heading)', letterSpacing: '2px', color: 'var(--hp-crimson)' }}
        >
          Combat
        </h3>
      </div>

      {/* ── HP Section ─────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-4 combat-pulse"
        style={{
          background: 'linear-gradient(135deg, rgba(220,38,38,0.08), rgba(185,27,27,0.04))',
          border: '1px solid rgba(220,38,38,0.3)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Heart size={14} fill="var(--hp-crimson)" style={{ color: 'var(--hp-crimson)' }} />
            <span
              className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: 'var(--hp-crimson)', fontFamily: 'var(--heading)' }}
            >
              Hit Points
            </span>
          </div>
          {character.temp_hp > 0 && (
            <span className="text-xs" style={{ color: 'var(--spell-indigo)' }}>
              <Shield size={11} className="inline -mt-px" /> {character.temp_hp} temp
            </span>
          )}
        </div>

        {/* HP display */}
        <div className="flex items-baseline gap-1.5 mb-2">
          <span
            className="font-bold"
            style={{
              color: hpColor,
              fontFamily: 'var(--mono)',
              fontSize: '48px',
              lineHeight: 1,
              animation: pulsing ? 'hpPulse 0.3s ease-out' : 'none',
              textShadow: `0 0 16px ${hpColor}40`,
            }}
          >
            {animatedHp}
          </span>
          <span className="text-xl" style={{ color: 'var(--border-light)' }}>/</span>
          <span className="text-xl font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--mono)' }}>
            {character.max_hp}
          </span>
        </div>

        {/* HP Bar */}
        <div
          className="w-full h-2.5 rounded-full overflow-hidden mb-3"
          style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, hpPercent)}%`, background: barGradient }}
          />
        </div>

        {/* Quick buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { amt: -5, bg: 'linear-gradient(135deg, #7f1d1d, #991b1b)', label: '-5' },
            { amt: -1, bg: 'linear-gradient(135deg, #991b1b, #b91c1c)', label: '-1' },
            { amt: 1, bg: 'linear-gradient(135deg, #166534, #15803d)', label: '+1' },
            { amt: 5, bg: 'linear-gradient(135deg, #15803d, #22c55e)', label: '+5' },
          ].map(({ amt, bg, label }) => (
            <button
              key={amt}
              className="flex items-center justify-center rounded-lg font-bold text-base cursor-pointer active:scale-95 transition-transform text-white"
              style={{ background: bg, border: 'none', minHeight: '44px' }}
              onClick={() => adjustHp(amt)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="flex gap-2 mt-2">
          <input
            type="number"
            placeholder="Amt"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            min={1}
            className="flex-1 px-3 py-2 rounded-lg text-center text-sm outline-none"
            style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)' }}
          />
          <button
            className="px-4 py-2 rounded-lg font-semibold text-sm text-white cursor-pointer active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #991b1b, #b91c1c)', border: 'none' }}
            onClick={() => handleCustomAction(false)}
          >
            Damage
          </button>
          <button
            className="px-4 py-2 rounded-lg font-semibold text-sm text-white cursor-pointer active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)', border: 'none' }}
            onClick={() => handleCustomAction(true)}
          >
            Heal
          </button>
        </div>
      </div>

      {/* ── Combat Stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox
          label="Prof. Bonus"
          value={formatModifier(profBonus)}
          color="var(--accent)"
        />
        {spellSaveDC !== null && (
          <StatBox label="Spell Save DC" value={String(spellSaveDC)} color="var(--spell-indigo)" />
        )}
        {spellAtkBonus !== null && (
          <StatBox
            label="Spell Atk"
            value={formatModifier(spellAtkBonus)}
            color="var(--spell-violet)"
            subtitle={castingAbility ? ABILITY_NAMES[castingAbility] : undefined}
          />
        )}
        {spellSaveDC === null && (
          <StatBox
            label="AC"
            value={String(10 + getModifier(abilityScoreMap.DEX))}
            color="var(--accent)"
            subtitle="Base"
          />
        )}
      </div>

      {/* ── Ability Scores Quick Ref ───────────────────────────────────── */}
      <div className="grid grid-cols-6 gap-1.5">
        {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const).map((ab) => {
          const mod = getModifier(abilityScoreMap[ab]);
          const isCasting = ab === castingAbility;
          return (
            <div
              key={ab}
              className="flex flex-col items-center py-1.5 rounded-lg"
              style={{
                background: isCasting ? 'var(--spell-bg)' : 'var(--bg-surface)',
                border: `1px solid ${isCasting ? 'var(--spell-border)' : 'var(--border)'}`,
              }}
            >
              <span className="text-[9px] font-bold" style={{ color: isCasting ? 'var(--spell-indigo)' : 'var(--accent)', fontFamily: 'var(--heading)' }}>
                {ab}
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>
                {formatModifier(mod)}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Action Type Filter ──────────────────────────────────────────── */}
      <ActionTypeFilterBar
        value={actionFilter}
        onChange={setActionFilter}
        counts={{
          all: allPreparedSpells.length + weapons.length + features.length,
          action: allPreparedSpells.filter((s) => (s.action_type ?? 'action') === 'action').length
            + weapons.filter((w) => (w.action_type ?? 'action') === 'action').length
            + features.filter((f) => f.action_type === 'action').length,
          bonus_action: allPreparedSpells.filter((s) => s.action_type === 'bonus_action').length
            + weapons.filter((w) => w.action_type === 'bonus_action').length
            + features.filter((f) => f.action_type === 'bonus_action').length,
          reaction: allPreparedSpells.filter((s) => s.action_type === 'reaction').length
            + weapons.filter((w) => w.action_type === 'reaction').length
            + features.filter((f) => f.action_type === 'reaction').length,
          other: allPreparedSpells.filter((s) => (!s.action_type || s.action_type === 'other')).length
            + weapons.filter((w) => (!w.action_type || w.action_type === 'other')).length
            + features.filter((f) => (!f.action_type || f.action_type === 'other')).length,
        }}
      />

      {/* ── Prepared Spells ────────────────────────────────────────────── */}
      {preparedSpells.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 mt-1">
            <Sparkles size={14} style={{ color: 'var(--spell-indigo)' }} />
            <h3
              className="text-xs uppercase tracking-widest m-0"
              style={{ color: 'var(--spell-indigo)', fontFamily: 'var(--heading)', letterSpacing: '2px' }}
            >
              Prepared Spells
            </h3>
          </div>

          {sortedLevels.map((level) => {
            const levelSpells = spellsByLevel.get(level)!;
            const slot = slots.find((s) => s.level === level);
            const availableSlotLevels = level === 0 ? [] : getAvailableSlotLevels(level);
            const slotsAvailable = level === 0 ? Infinity : availableSlotLevels.length;
            const sameLevelAvailable = slot ? (slot.total - slot.used) : 0;
            const hasOnlyHigherSlots = level > 0 && slotsAvailable > 0 && sameLevelAvailable <= 0;

            return (
              <div key={level} className="mb-3">
                {/* Level header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--spell-violet)', fontFamily: 'var(--heading)' }}
                  >
                    {level === 0 ? 'Cantrips' : `${ORD[level]} Level`}
                  </span>
                  {level > 0 && slot && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: slot.total }).map((_, i) => (
                        <div
                          key={i}
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            background: i < slot.total - slot.used
                              ? 'var(--spell-indigo)'
                              : 'var(--border)',
                            boxShadow: i < slot.total - slot.used
                              ? '0 0 4px rgba(99,102,241,0.5)'
                              : 'none',
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {hasOnlyHigherSlots && (
                    <span className="text-[10px]" style={{ color: 'var(--spell-indigo)', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}>
                      Upcast available
                    </span>
                  )}
                </div>

                {/* Spell cards */}
                {levelSpells.map((spell) => {
                  const isExpanded = expandedSpell === spell.id;
                  const isReaction = spell.action_type === 'reaction';
                  const blockedOffTurn = offTurn && !isReaction;
                  const canCast = !blockedOffTurn && (level === 0 || slotsAvailable > 0);

                  return (
                    <div
                      key={spell.id}
                      className="mb-1.5 rounded-lg overflow-hidden"
                      style={{
                        border: `1px solid ${canCast ? 'var(--spell-border)' : 'var(--border)'}`,
                        background: 'var(--bg-surface)',
                        opacity: canCast ? 1 : 0.5,
                      }}
                    >
                      {/* Spell header - tap to expand */}
                      <div
                        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
                        onClick={() => setExpandedSpell(isExpanded ? null : spell.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setExpandedSpell(isExpanded ? null : spell.id)}
                      >
                        <ChevronDown
                          size={14}
                          style={{
                            color: 'var(--spell-indigo)',
                            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                            transition: 'transform 0.2s',
                          }}
                        />
                        <span
                          className="flex-1 text-sm font-semibold"
                          style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', letterSpacing: '0.3px' }}
                        >
                          {spell.name}
                        </span>
                        <ActionTypeBadge type={spell.action_type ?? 'action'} small />
                        {usedActionTypes?.has(spell.action_type ?? 'action') && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.6rem', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}
                          >
                            USED
                          </span>
                        )}
                        {/* Cast button */}
                        <button
                          className="px-3 py-1 rounded-lg text-xs font-bold cursor-pointer active:scale-90 transition-transform shrink-0"
                          style={{
                            background: canCast
                              ? 'linear-gradient(135deg, var(--spell-indigo), var(--spell-violet))'
                              : 'var(--border)',
                            color: canCast ? '#fff' : 'var(--text)',
                            border: 'none',
                            fontFamily: 'var(--heading)',
                            letterSpacing: '0.5px',
                          }}
                          disabled={!canCast && level > 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canCast) {
                              if (level > 0 && availableSlotLevels.length > 1) {
                                setUpcastSelection({ spell, availableSlotLevels });
                                return;
                              }

                              const chosenSlotLevel = level > 0
                                ? (availableSlotLevels[0] ?? spell.level)
                                : undefined;
                              castSpellAction(spell, chosenSlotLevel);
                            }
                          }}
                        >
                          {level === 0 ? 'Cast' : (hasOnlyHigherSlots ? 'Cast (Upcast)' : 'Cast')}
                        </button>
                      </div>

                      {/* Expanded description */}
                      {isExpanded && (
                        <div
                          className="px-3 pb-3 combat-slide-down"
                          style={{ borderTop: '1px solid var(--border)' }}
                        >
                          <p
                            className="text-sm whitespace-pre-wrap m-0 pt-2"
                            style={{ color: 'var(--text)', lineHeight: '1.6', userSelect: 'text' }}
                          >
                            {spell.description || 'No description.'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Combat Abilities ───────────────────────────────────────────── */}
      {filteredWeapons.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 mt-1">
            <Swords size={14} style={{ color: 'var(--hp-crimson)' }} />
            <h3
              className="text-xs uppercase tracking-widest m-0"
              style={{ color: 'var(--hp-crimson)', fontFamily: 'var(--heading)', letterSpacing: '2px' }}
            >
              Weapons
            </h3>
          </div>

          {filteredWeapons.map((weapon) => {
            const atkBonus = getWeaponAttackBonus(character.level, abilityScoreMap, weapon.ability_mod, weapon.proficient);
            const dmgStr = formatWeaponDamage(weapon.damage_dice, abilityScoreMap, weapon.ability_mod, weapon.damage_type);
            const isReaction = weapon.action_type === 'reaction';
            const blockedOffTurn = offTurn && !isReaction;

            return (
              <div
                key={weapon.id}
                className="mb-1.5 rounded-lg overflow-hidden"
                style={{
                  border: '1px solid rgba(220,38,38,0.3)',
                  background: 'var(--bg-surface)',
                  opacity: blockedOffTurn ? 0.5 : 1,
                }}
              >
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <span
                    className="flex-1 text-sm font-semibold"
                    style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', letterSpacing: '0.3px' }}
                  >
                    {weapon.name}
                  </span>
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--text)' }}>
                    <span style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}>ATK </span>
                    <span style={{ color: 'var(--text-h)', fontFamily: 'var(--mono)', fontWeight: 700 }}>
                      {formatModifier(atkBonus)}
                    </span>
                  </span>
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--text)' }}>
                    <span style={{ color: 'var(--hp-crimson)', fontFamily: 'var(--heading)' }}>DMG </span>
                    <span style={{ color: 'var(--text-h)', fontFamily: 'var(--mono)', fontWeight: 700 }}>
                      {dmgStr}
                    </span>
                  </span>
                  <ActionTypeBadge type={weapon.action_type ?? 'action'} small />
                  {usedActionTypes?.has(weapon.action_type ?? 'action') && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.6rem', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}
                    >
                      USED
                    </span>
                  )}
                  <button
                    className="px-3 py-1 rounded-lg text-xs font-bold cursor-pointer active:scale-90 transition-transform shrink-0"
                    style={{
                      background: blockedOffTurn
                        ? 'var(--border)'
                        : 'linear-gradient(135deg, #991b1b, #dc2626)',
                      color: blockedOffTurn ? 'var(--text)' : '#fff',
                      border: 'none',
                      fontFamily: 'var(--heading)',
                      letterSpacing: '0.5px',
                    }}
                    disabled={blockedOffTurn}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!blockedOffTurn) {
                        if (onActionInitiated) {
                          onActionInitiated({ weapon, actionType: weapon.action_type ?? 'action' });
                        } else {
                          handleWeaponAttack(weapon);
                        }
                      }
                    }}
                  >
                    Attack
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Features & Traits ──────────────────────────────────────────── */}
      {filteredFeatures.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 mt-1">
            <Zap size={14} style={{ color: 'var(--accent)' }} />
            <h3
              className="text-xs uppercase tracking-widest m-0"
              style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '2px' }}
            >
              Abilities
            </h3>
          </div>

          {filteredFeatures.map((feature) => {
            const isExpanded = expandedFeature === feature.id;
            const hasUses = feature.max_uses !== null && feature.max_uses > 0;
            const remaining = hasUses ? feature.max_uses! - feature.used_uses : Infinity;
            const isReaction = feature.action_type === 'reaction';
            const blockedOffTurn = offTurn && !isReaction;
            const depleted = blockedOffTurn || (hasUses && remaining <= 0);

            return (
              <div
                key={feature.id}
                className="mb-1.5 rounded-lg overflow-hidden"
                style={{
                  border: '1px solid var(--accent-border)',
                  background: 'var(--bg-surface)',
                  opacity: depleted ? 0.5 : 1,
                }}
              >
                <div
                  className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
                  onClick={() => setExpandedFeature(isExpanded ? null : feature.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setExpandedFeature(isExpanded ? null : feature.id)}
                >
                  <ChevronDown
                    size={14}
                    style={{
                      color: 'var(--accent)',
                      transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                  <span
                    className="flex-1 text-sm font-semibold"
                    style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', letterSpacing: '0.3px' }}
                  >
                    {feature.title}
                  </span>
                  <ActionTypeBadge type={feature.action_type ?? 'other'} small />
                  {usedActionTypes?.has(feature.action_type ?? 'other') && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.6rem', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}
                    >
                      USED
                    </span>
                  )}
                  {hasUses && (
                    <div className="flex items-center gap-1 shrink-0">
                      {Array.from({ length: feature.max_uses! }).map((_, i) => (
                        <div
                          key={i}
                          className="w-2.5 h-2.5 rounded-full transition-all"
                          style={{
                            background: i < remaining
                              ? 'var(--accent)'
                              : 'var(--border)',
                            boxShadow: i < remaining
                              ? '0 0 4px rgba(201,168,76,0.5)'
                              : 'none',
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {feature.source && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ color: 'var(--accent)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}
                    >
                      {feature.source}
                    </span>
                  )}
                  <button
                    className="px-3 py-1 rounded-lg text-xs font-bold cursor-pointer active:scale-90 transition-transform shrink-0"
                    style={{
                      background: depleted
                        ? 'var(--border)'
                        : 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
                      color: depleted ? 'var(--text)' : '#0f0e13',
                      border: 'none',
                      fontFamily: 'var(--heading)',
                      letterSpacing: '0.5px',
                    }}
                    disabled={depleted}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!depleted) {
                        if (onActionInitiated) {
                          onActionInitiated({ feature, actionType: feature.action_type ?? 'other' });
                        } else {
                          handleUseAbility(feature);
                        }
                      }
                    }}
                  >
                    Use
                  </button>
                </div>

                {isExpanded && (
                  <div
                    className="px-3 pb-3 combat-slide-down"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <p
                      className="text-sm whitespace-pre-wrap m-0 pt-2"
                      style={{ color: 'var(--text)', lineHeight: '1.6', userSelect: 'text' }}
                    >
                      {feature.description || 'No description.'}
                    </p>
                    {hasUses && (
                      <p className="text-xs mt-2 m-0" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}>
                        {remaining}/{feature.max_uses} uses remaining
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {preparedSpells.length === 0 && filteredWeapons.length === 0 && filteredFeatures.length === 0 && (
        <div className="text-center py-8" style={{ color: 'var(--text)' }}>
          <p className="text-sm">
            {actionFilter !== 'all'
              ? 'No spells, weapons, or abilities match this filter.'
              : 'No prepared spells, weapons, or abilities.'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text)' }}>
            {actionFilter !== 'all'
              ? 'Try a different action type filter.'
              : 'Prepare spells in the Spells tab, add weapons in the Arms tab, and add features in the Traits tab.'}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Stat Box ────────────────────────────────────────────────────────────── */

function StatBox({ label, value, color, subtitle }: { label: string; value: string; color: string; subtitle?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-3 rounded-xl"
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${color}33`,
      }}
    >
      <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color, fontFamily: 'var(--heading)' }}>
        {label}
      </span>
      <span className="text-xl font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--mono)' }}>
        {value}
      </span>
      {subtitle && (
        <span className="text-[9px]" style={{ color: 'var(--text)' }}>{subtitle}</span>
      )}
    </div>
  );
}

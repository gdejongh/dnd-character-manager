import type { CombatSummary, CombatantReport } from '../hooks/useCombatLog';
import { Swords, Heart, Shield, Sparkles, Clock, Skull, ArrowLeft } from 'lucide-react';

interface CombatReportProps {
  summary: CombatSummary;
  onLeave: () => void;
}

export function CombatReport({ summary, onLeave }: CombatReportProps) {
  const mvp = summary.combatants.find((c) => c.damageDealt > 0);

  function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div
      className="flex flex-col h-dvh overflow-hidden animate-fade-in"
      style={{ background: 'linear-gradient(180deg, #0a0910 0%, #0d0b14 50%, #0a0910 100%)' }}
    >
      {/* Header */}
      <div className="p-4 text-center shrink-0" style={{ borderBottom: '1px solid var(--accent-border)' }}>
        <div className="flex items-center justify-center gap-2">
          <Swords size={18} style={{ color: 'var(--accent)' }} />
          <h1
            className="text-lg font-bold m-0"
            style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '2px' }}
          >
            COMBAT REPORT
          </h1>
          <Swords size={18} style={{ color: 'var(--accent)' }} />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <SummaryCard
            icon={<Swords size={14} />}
            label="Rounds"
            value={String(summary.totalRounds)}
            color="var(--accent)"
          />
          <SummaryCard
            icon={<Skull size={14} />}
            label="Damage"
            value={String(summary.totalDamage)}
            color="var(--hp-crimson)"
          />
          <SummaryCard
            icon={<Heart size={14} />}
            label="Healing"
            value={String(summary.totalHealing)}
            color="var(--hp-green)"
          />
          <SummaryCard
            icon={<Clock size={14} />}
            label="Duration"
            value={formatDuration(summary.durationSeconds)}
            color="var(--spell-indigo)"
          />
        </div>

        {/* MVP */}
        {mvp && mvp.damageDealt > 0 && (
          <div
            className="rounded-xl p-3 mb-4 text-center"
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid var(--accent-border)',
            }}
          >
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '1.5px' }}
            >
              🏆 MVP — {mvp.name}
            </span>
            <div className="text-sm mt-1" style={{ color: 'var(--text)' }}>
              {mvp.damageDealt} total damage dealt
            </div>
          </div>
        )}

        {/* Section heading */}
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} style={{ color: 'var(--accent)' }} />
          <h2
            className="text-xs uppercase tracking-widest m-0"
            style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '1.5px' }}
          >
            Combatant Breakdown
          </h2>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* Combatant cards */}
        <div className="flex flex-col gap-3">
          {summary.combatants.map((c) => (
            <CombatantCard key={c.id} stats={c} totalDamage={summary.totalDamage} />
          ))}
        </div>
      </div>

      {/* Leave button */}
      <div className="p-4 shrink-0" style={{ borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.4)' }}>
        <button
          onClick={onLeave}
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
          <ArrowLeft size={16} />
          Leave Combat
        </button>
      </div>
    </div>
  );
}

/* ── Summary Card ────────────────────────────────────────────────────────── */

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg p-2 text-center"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-center gap-1 mb-1" style={{ color }}>
        {icon}
      </div>
      <div className="text-lg font-bold" style={{ color, fontFamily: 'var(--mono)' }}>
        {value}
      </div>
      <div
        className="text-[9px] uppercase"
        style={{ color: 'var(--text)', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}
      >
        {label}
      </div>
    </div>
  );
}

/* ── Combatant Card ──────────────────────────────────────────────────────── */

function CombatantCard({ stats, totalDamage }: { stats: CombatantReport; totalDamage: number }) {
  const isEnemy = stats.combatantType === 'enemy';
  const isAlly = stats.combatantType === 'ally';
  const borderColor = isEnemy
    ? 'rgba(239,68,68,0.3)'
    : isAlly
      ? 'rgba(96,165,250,0.3)'
      : 'var(--accent-border)';
  const dmgPct = totalDamage > 0 ? (stats.damageDealt / totalDamage) * 100 : 0;

  const hasAnyStats =
    stats.damageDealt > 0 ||
    stats.damageReceived > 0 ||
    stats.healingDone > 0 ||
    stats.healingReceived > 0 ||
    stats.spellsCast > 0 ||
    stats.abilitiesUsed > 0 ||
    stats.weaponAttacks > 0;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${borderColor}`, background: 'rgba(255,255,255,0.02)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3" style={{ borderBottom: '1px solid var(--border)' }}>
        {stats.imageUrl ? (
          <div
            className="w-10 h-10 rounded-full overflow-hidden shrink-0"
            style={{ border: `1.5px solid ${borderColor}` }}
          >
            <img
              src={stats.imageUrl}
              alt={stats.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: `center ${stats.imagePosition ?? 50}%` }}
            />
          </div>
        ) : isEnemy ? (
          <Skull size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
        ) : (
          <Shield size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        )}
        <div className="flex-1 min-w-0">
          <span
            className="font-semibold text-sm truncate block"
            style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}
          >
            {stats.name}
          </span>
          <span
            className="text-[10px] uppercase"
            style={{
              color: isEnemy ? '#ef4444' : isAlly ? '#60a5fa' : 'var(--accent)',
              fontFamily: 'var(--heading)',
              letterSpacing: '0.5px',
            }}
          >
            {stats.combatantType}
          </span>
        </div>
        {dmgPct > 0 && (
          <div className="flex flex-col items-end shrink-0">
            <span className="text-xs font-bold" style={{ color: 'var(--hp-crimson)', fontFamily: 'var(--mono)' }}>
              {Math.round(dmgPct)}%
            </span>
            <span className="text-[9px]" style={{ color: 'var(--text)' }}>
              of total dmg
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      {hasAnyStats ? (
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2 mb-2">
            {stats.damageDealt > 0 && <MiniStat label="DMG Dealt" value={stats.damageDealt} color="var(--hp-crimson)" />}
            {stats.damageReceived > 0 && <MiniStat label="DMG Taken" value={stats.damageReceived} color="#f59e0b" />}
            {stats.healingDone > 0 && <MiniStat label="Heal Done" value={stats.healingDone} color="var(--hp-green)" />}
            {stats.healingReceived > 0 && (
              <MiniStat label="Heal Recv" value={stats.healingReceived} color="var(--hp-green)" />
            )}
          </div>
          {(stats.spellsCast > 0 || stats.abilitiesUsed > 0 || stats.weaponAttacks > 0) && (
            <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              {stats.weaponAttacks > 0 && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text)' }}>
                  <Swords size={10} style={{ color: 'var(--hp-crimson)' }} /> {stats.weaponAttacks} Attacks
                </span>
              )}
              {stats.spellsCast > 0 && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text)' }}>
                  <Sparkles size={10} style={{ color: 'var(--spell-indigo)' }} /> {stats.spellsCast} Spells
                </span>
              )}
              {stats.abilitiesUsed > 0 && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text)' }}>
                  <Shield size={10} style={{ color: 'var(--accent)' }} /> {stats.abilitiesUsed} Abilities
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 text-center">
          <span className="text-xs" style={{ color: 'var(--text)' }}>
            No combat actions recorded
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Mini Stat ───────────────────────────────────────────────────────────── */

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="flex items-center justify-between px-2 py-1 rounded"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <span
        className="text-[10px] uppercase"
        style={{ color: 'var(--text)', fontFamily: 'var(--heading)', letterSpacing: '0.3px' }}
      >
        {label}
      </span>
      <span className="text-sm font-bold" style={{ color, fontFamily: 'var(--mono)' }}>
        {value}
      </span>
    </div>
  );
}

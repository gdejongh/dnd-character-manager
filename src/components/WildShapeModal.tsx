import { useState, useMemo } from 'react';
import { X, Search, Plus, Trash2 } from 'lucide-react';
import { BEASTS, formatCR } from '../constants/beasts';
import type { Beast } from '../constants/beasts';
import type { CustomBeast } from '../types/database';
import { getWildShapeLimits } from '../constants/dnd';
import { NumericInput } from './NumericInput';

interface WildShapeModalProps {
  druidLevel: number;
  customBeasts: CustomBeast[];
  onSelect: (beast: Beast) => void;
  onAddCustomBeast: (beast: Beast) => void;
  onDeleteCustomBeast: (id: string) => void;
  onClose: () => void;
}

/** Convert a CustomBeast DB row into the shared Beast shape */
function customToBeast(cb: CustomBeast): Beast {
  return {
    name: cb.name,
    cr: cb.cr,
    hp: cb.hp,
    ac: cb.ac,
    str: cb.str,
    dex: cb.dex,
    con: cb.con,
    speed: cb.speed,
    swimSpeed: cb.swim_speed,
    flySpeed: cb.fly_speed,
    climbSpeed: cb.climb_speed,
    burrowSpeed: cb.burrow_speed,
    senses: cb.senses,
    attacks: cb.attacks,
    specialTraits: cb.special_traits,
  };
}

const CR_OPTIONS = [0, 0.125, 0.25, 0.5, 1];

export function WildShapeModal({
  druidLevel,
  customBeasts,
  onSelect,
  onAddCustomBeast,
  onDeleteCustomBeast,
  onClose,
}: WildShapeModalProps) {
  const [search, setSearch] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const limits = getWildShapeLimits(druidLevel);

  // Custom beast form state
  const [cbName, setCbName] = useState('');
  const [cbCR, setCbCR] = useState(0);
  const [cbHP, setCbHP] = useState(10);
  const [cbAC, setCbAC] = useState(10);
  const [cbSTR, setCbSTR] = useState(10);
  const [cbDEX, setCbDEX] = useState(10);
  const [cbCON, setCbCON] = useState(10);
  const [cbSpeed, setCbSpeed] = useState(30);
  const [cbSwim, setCbSwim] = useState(0);
  const [cbFly, setCbFly] = useState(0);
  const [cbClimb, setCbClimb] = useState(0);
  const [cbBurrow, setCbBurrow] = useState(0);

  function isBeastAllowed(beast: { cr: number; swimSpeed?: number | null; flySpeed?: number | null }) {
    if (beast.cr > limits.maxCR) return false;
    if (!limits.canSwim && beast.swimSpeed && beast.swimSpeed > 0) return false;
    if (!limits.canFly && beast.flySpeed && beast.flySpeed > 0) return false;
    return true;
  }

  const allBeasts = useMemo(() => {
    const converted = customBeasts.map(customToBeast);
    return [...BEASTS, ...converted];
  }, [customBeasts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allBeasts
      .filter((b) => b.name.toLowerCase().includes(q))
      .sort((a, b) => a.cr - b.cr || a.name.localeCompare(b.name));
  }, [allBeasts, search]);

  const customBeastNames = new Set(customBeasts.map((cb) => cb.name));

  function handleAddCustomBeast() {
    if (!cbName.trim()) return;
    const beast: Beast = {
      name: cbName.trim(),
      cr: cbCR,
      hp: cbHP,
      ac: cbAC,
      str: cbSTR, dex: cbDEX, con: cbCON,
      speed: cbSpeed,
      swimSpeed: cbSwim || null,
      flySpeed: cbFly || null,
      climbSpeed: cbClimb || null,
      burrowSpeed: cbBurrow || null,
      senses: '',
      attacks: [],
      specialTraits: [],
    };
    onAddCustomBeast(beast);
    setShowCustomForm(false);
    setCbName('');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl animate-fade-in flex flex-col"
        style={{
          background: 'linear-gradient(180deg, var(--bg-raised) 0%, var(--bg-surface) 100%)',
          border: '1px solid var(--accent-border)',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '85vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <h2
            className="text-sm uppercase tracking-widest font-bold"
            style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}
          >
            🐺 Wild Shape
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* CR limits info */}
        <div
          className="mx-4 mb-2 px-3 py-2 rounded-lg text-[10px]"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          Level {druidLevel} — Max CR {formatCR(limits.maxCR)}
          {!limits.canSwim && ' · No swim'}
          {!limits.canFly && ' · No fly'}
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search beasts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
          </div>
        </div>

        {/* Beast list */}
        <div className="flex-1 overflow-y-auto px-4 pb-2" style={{ minHeight: 0 }}>
          {filtered.map((beast) => {
            const allowed = isBeastAllowed(beast);
            const isCustom = customBeastNames.has(beast.name);
            const customId = isCustom ? customBeasts.find((cb) => cb.name === beast.name)?.id : null;
            return (
              <div
                key={`${beast.name}-${isCustom ? 'custom' : 'srd'}`}
                className="flex items-center gap-3 p-2.5 rounded-xl mb-1.5"
                style={{
                  background: allowed ? 'var(--bg)' : 'var(--bg)',
                  border: `1px solid ${allowed ? 'var(--border)' : 'var(--border)'}`,
                  opacity: allowed ? 1 : 0.4,
                  cursor: allowed ? 'pointer' : 'not-allowed',
                }}
                onClick={() => allowed && onSelect(beast)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-h)' }}>
                      {beast.name}
                    </span>
                    {isCustom && (
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold"
                        style={{ background: 'var(--spell-bg)', color: 'var(--spell-violet)', border: '1px solid var(--spell-border)' }}
                      >
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px]" style={{ color: 'var(--accent)' }}>
                      CR {formatCR(beast.cr)}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {beast.hp} HP · AC {beast.ac}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {beast.speed} ft
                      {beast.swimSpeed ? ` 🏊${beast.swimSpeed}` : ''}
                      {beast.flySpeed ? ` 🪽${beast.flySpeed}` : ''}
                      {beast.climbSpeed ? ` 🧗${beast.climbSpeed}` : ''}
                      {beast.burrowSpeed ? ` ⛏️${beast.burrowSpeed}` : ''}
                    </span>
                  </div>
                  {beast.attacks.length > 0 && (
                    <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {beast.attacks.map((a) => a.name).join(', ')}
                    </div>
                  )}
                </div>
                {isCustom && customId && (
                  <button
                    className="p-1.5 rounded-lg cursor-pointer shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCustomBeast(customId);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add custom beast */}
        <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          {showCustomForm ? (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--accent)' }}>
                New Custom Beast
              </span>
              <input
                type="text"
                placeholder="Beast name..."
                value={cbName}
                onChange={(e) => setCbName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                autoFocus
              />
              <div className="grid grid-cols-4 gap-2">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>CR</span>
                  <select
                    value={cbCR}
                    onChange={(e) => setCbCR(Number(e.target.value))}
                    className="w-full px-1 py-1 rounded text-xs text-center outline-none cursor-pointer"
                    style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  >
                    {CR_OPTIONS.map((cr) => (
                      <option key={cr} value={cr}>{formatCR(cr)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>HP</span>
                  <NumericInput min={1} max={200} value={cbHP} onChange={setCbHP}
                    className="w-full px-1 py-1 rounded text-xs text-center outline-none"
                    style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>AC</span>
                  <NumericInput min={1} max={30} value={cbAC} onChange={setCbAC}
                    className="w-full px-1 py-1 rounded text-xs text-center outline-none"
                    style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Speed</span>
                  <NumericInput min={0} max={120} value={cbSpeed} onChange={setCbSpeed}
                    className="w-full px-1 py-1 rounded text-xs text-center outline-none"
                    style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>STR</span>
                  <NumericInput min={1} max={30} value={cbSTR} onChange={setCbSTR}
                    className="w-full px-1 py-1 rounded text-xs text-center outline-none"
                    style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>DEX</span>
                  <NumericInput min={1} max={30} value={cbDEX} onChange={setCbDEX}
                    className="w-full px-1 py-1 rounded text-xs text-center outline-none"
                    style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>CON</span>
                  <NumericInput min={1} max={30} value={cbCON} onChange={setCbCON}
                    className="w-full px-1 py-1 rounded text-xs text-center outline-none"
                    style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '🏊 Swim', val: cbSwim, set: setCbSwim },
                  { label: '🪽 Fly', val: cbFly, set: setCbFly },
                  { label: '🧗 Climb', val: cbClimb, set: setCbClimb },
                  { label: '⛏️ Burrow', val: cbBurrow, set: setCbBurrow },
                ].map(({ label, val, set }) => (
                  <div key={label} className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <NumericInput min={0} max={120} value={val} onChange={set}
                      className="w-full px-1 py-1 rounded text-xs text-center outline-none"
                      style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  className="flex-1 py-1.5 rounded-lg text-xs cursor-pointer font-semibold"
                  style={{ background: 'var(--accent)', color: '#0f0e13', border: 'none' }}
                  onClick={handleAddCustomBeast}
                >
                  Save Beast
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                  style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                  onClick={() => setShowCustomForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs cursor-pointer font-semibold"
              style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
              onClick={() => setShowCustomForm(true)}
            >
              <Plus size={14} />
              Add Custom Beast
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

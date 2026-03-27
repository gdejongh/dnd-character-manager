import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Ability } from '../types/database';
import { ABILITIES, ABILITY_NAMES, getModifier, formatModifier, getHitDie } from '../constants/dnd';
import { Shield, Swords, ChevronRight, ChevronLeft, Sparkles, Plus, X } from 'lucide-react';
import { NumericInput } from './NumericInput';

export interface GuestClassEntry {
  className: string;
  level: number;
}

export interface GuestCharacterData {
  name: string;
  race: string;
  class: string;
  level: number;
  classes: GuestClassEntry[];
  max_hp: number;
  armor_class: number;
  speed: number;
}

export interface GuestScoreData {
  ability: Ability;
  score: number;
}

interface GuestCharacterBuilderProps {
  onComplete: (character: GuestCharacterData, scores: GuestScoreData[]) => void;
  onSignIn: () => void;
}

const inputStyle = {
  background: 'var(--code-bg)',
  color: 'var(--text-h)',
  border: '1px solid var(--border)',
};

const STEPS = ['Identity', 'Ability Scores', 'Class & Vitals'] as const;

export function GuestCharacterBuilder({ onComplete, onSignIn }: GuestCharacterBuilderProps) {
  const [step, setStep] = useState(0);

  // Step 1 — Identity
  const [name, setName] = useState('');
  const [race, setRace] = useState('');

  // Step 2 — Ability Scores
  const [scores, setScores] = useState<Record<Ability, number>>({
    STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10,
  });

  // Track raw input strings so users can select-all and retype
  const [rawScores, setRawScores] = useState<Record<Ability, string>>({
    STR: '10', DEX: '10', CON: '10', INT: '10', WIS: '10', CHA: '10',
  });

  // Step 3 — Classes & Vitals
  const [classes, setClasses] = useState<GuestClassEntry[]>([{ className: '', level: 1 }]);
  const [maxHp, setMaxHp] = useState(10);
  const [armorClass, setArmorClass] = useState(10);
  const [speed, setSpeed] = useState(30);

  const totalLevel = classes.reduce((sum, c) => sum + c.level, 0);

  function suggestHp() {
    const conMod = getModifier(scores.CON);
    if (classes.length === 0) return 10 + conMod;

    let hp = 0;
    classes.forEach((entry, idx) => {
      const die = getHitDie(entry.className);
      if (idx === 0) {
        // First class: max hit die at level 1, average for remaining levels
        hp += die + conMod;
        hp += (entry.level - 1) * (Math.ceil(die / 2) + 1 + conMod);
      } else {
        // Additional classes: average for all levels
        hp += entry.level * (Math.ceil(die / 2) + 1 + conMod);
      }
    });

    return Math.max(1, hp);
  }

  function updateClassName(index: number, value: string) {
    setClasses((prev) => prev.map((c, i) => i === index ? { ...c, className: value } : c));
  }

  function updateClassLevel(index: number, value: number) {
    setClasses((prev) => {
      const otherTotal = prev.reduce((sum, c, i) => i === index ? sum : sum + c.level, 0);
      const clamped = Math.max(1, Math.min(20 - otherTotal, value));
      return prev.map((c, i) => i === index ? { ...c, level: clamped } : c);
    });
  }

  function addClass() {
    if (totalLevel >= 20) return;
    setClasses((prev) => [...prev, { className: '', level: 1 }]);
  }

  function removeClass(index: number) {
    if (classes.length <= 1) return;
    setClasses((prev) => prev.filter((_, i) => i !== index));
  }

  function updateScore(ability: Ability, raw: string) {
    setRawScores((prev) => ({ ...prev, [ability]: raw }));
    const parsed = parseInt(raw);
    if (!isNaN(parsed)) {
      setScores((prev) => ({ ...prev, [ability]: Math.max(1, Math.min(30, parsed)) }));
    }
  }

  function commitScore(ability: Ability) {
    const clamped = Math.max(1, Math.min(30, scores[ability]));
    setScores((prev) => ({ ...prev, [ability]: clamped }));
    setRawScores((prev) => ({ ...prev, [ability]: String(clamped) }));
  }

  function buildClassDisplayString(): string {
    const filled = classes.filter((c) => c.className.trim());
    if (filled.length === 0) return '';
    if (filled.length === 1) return filled[0].className.trim();
    return filled.map((c) => `${c.className.trim()} ${c.level}`).join(' / ');
  }

  function handleFinish(e: FormEvent) {
    e.preventDefault();
    const scoreArray: GuestScoreData[] = ABILITIES.map((a) => ({ ability: a, score: scores[a] }));
    onComplete(
      {
        name: name.trim(),
        race: race.trim(),
        class: buildClassDisplayString(),
        level: totalLevel,
        classes: classes.map((c) => ({ className: c.className.trim(), level: c.level })),
        max_hp: maxHp,
        armor_class: armorClass,
        speed,
      },
      scoreArray,
    );
  }

  const canAdvance = step === 0 ? name.trim().length > 0 : true;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
      <div
        className="w-full max-w-lg p-6 sm:p-8 rounded-2xl animate-fade-in"
        style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Shield size={24} style={{ color: 'var(--accent)' }} />
          <div>
            <h1
              style={{ fontFamily: 'var(--heading)', fontSize: '1.4rem', letterSpacing: '0.5px', color: 'var(--accent)', margin: 0 }}
            >
              Create a Character
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
              No account needed — build first, save later.
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0"
                style={{
                  background: i <= step ? 'var(--accent)' : 'var(--bg-surface)',
                  color: i <= step ? '#0f0e13' : 'var(--text)',
                  border: `1px solid ${i <= step ? 'var(--accent)' : 'var(--border)'}`,
                  transition: 'all 0.2s',
                }}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-px"
                  style={{ background: i < step ? 'var(--accent)' : 'var(--border)' }}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={step === 2 ? handleFinish : (e) => { e.preventDefault(); setStep(step + 1); }}>
          {/* Step 1 — Identity */}
          {step === 0 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <h2 className="text-base font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>
                Who is your character?
              </h2>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text)', letterSpacing: '0.3px' }}>
                  Character Name <span style={{ color: 'var(--danger-bright)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Thorn Ironfist"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-lg text-base outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text)', letterSpacing: '0.3px' }}>Race</label>
                <input
                  type="text"
                  placeholder="e.g. Half-Elf"
                  value={race}
                  onChange={(e) => setRace(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-base outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* Step 2 — Ability Scores */}
          {step === 1 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <h2 className="text-base font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>
                <Sparkles size={16} className="inline mr-1" style={{ color: 'var(--accent)' }} />
                Ability Scores
              </h2>
              <p className="text-xs" style={{ color: 'var(--text)' }}>
                Set each ability score (1–30). Modifiers are shown automatically.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ABILITIES.map((ability) => {
                  const mod = getModifier(scores[ability]);
                  return (
                    <div
                      key={ability}
                      className="flex flex-col items-center p-3 rounded-xl"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                    >
                      <span className="text-xs font-bold mb-0.5" style={{ color: 'var(--accent)', letterSpacing: '1px' }}>
                        {ability}
                      </span>
                      <span className="text-[10px] mb-2" style={{ color: 'var(--text)' }}>
                        {ABILITY_NAMES[ability]}
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={rawScores[ability]}
                        onChange={(e) => updateScore(ability, e.target.value)}
                        onBlur={() => commitScore(ability)}
                        className="w-16 text-center px-2 py-1.5 rounded-lg text-lg font-bold outline-none"
                        style={inputStyle}
                      />
                      <span
                        className="text-sm font-bold mt-1.5"
                        style={{ color: mod >= 0 ? 'var(--hp-green)' : 'var(--danger-bright)' }}
                      >
                        {formatModifier(mod)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3 — Class & Vitals */}
          {step === 2 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <h2 className="text-base font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>
                <Swords size={16} className="inline mr-1" style={{ color: 'var(--accent)' }} />
                Class & Vitals
              </h2>

              {/* Multiclass picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase" style={{ color: 'var(--text)', letterSpacing: '1px' }}>
                    Classes
                  </label>
                  <span className="text-xs" style={{ color: totalLevel >= 20 ? 'var(--accent)' : 'var(--text)' }}>
                    Total Level: {totalLevel} / 20
                  </span>
                </div>
                <div
                  className="flex flex-col gap-2 p-3 rounded-xl"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  {classes.map((entry, index) => (
                    <div key={index} className="flex gap-1.5 items-center">
                      <input
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm outline-none"
                        style={inputStyle}
                        placeholder={index === 0 ? 'e.g. Wizard' : 'e.g. Druid'}
                        value={entry.className}
                        onChange={(e) => updateClassName(index, e.target.value)}
                        autoFocus={index === classes.length - 1 && classes.length > 1}
                      />
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] shrink-0" style={{ color: 'var(--text)' }}>Lvl</label>
                        <NumericInput
                          className="w-14 px-2 py-2 rounded-lg text-sm outline-none text-center"
                          style={inputStyle}
                          min={1}
                          max={20 - (totalLevel - entry.level)}
                          value={entry.level}
                          onChange={(val) => updateClassLevel(index, val)}
                        />
                      </div>
                      {classes.length > 1 && (
                        <button
                          type="button"
                          className="p-1 rounded cursor-pointer shrink-0"
                          style={{ background: 'transparent', border: 'none', color: 'var(--danger-bright)' }}
                          onClick={() => removeClass(index)}
                          title="Remove class"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  {totalLevel < 20 && (
                    <button
                      type="button"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer self-start"
                      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--accent)' }}
                      onClick={addClass}
                    >
                      <Plus size={12} /> Add Class
                    </button>
                  )}
                </div>
              </div>

              {/* Vitals */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="text-xs" style={{ color: 'var(--text)', letterSpacing: '0.3px' }}>Max HP</label>
                    <button
                      type="button"
                      onClick={() => setMaxHp(suggestHp())}
                      className="text-[10px] px-1.5 py-0.5 rounded cursor-pointer border-none"
                      style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
                    >
                      Suggest
                    </button>
                  </div>
                  <NumericInput
                    min={1}
                    value={maxHp}
                    onChange={setMaxHp}
                    className="w-full px-4 py-3 rounded-lg text-base outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--text)', letterSpacing: '0.3px' }}>Armor Class</label>
                  <NumericInput
                    min={1}
                    value={armorClass}
                    onChange={setArmorClass}
                    className="w-full px-4 py-3 rounded-lg text-base outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--text)', letterSpacing: '0.3px' }}>Speed (ft)</label>
                  <NumericInput
                    min={0}
                    step={5}
                    value={speed}
                    onChange={setSpeed}
                    className="w-full px-4 py-3 rounded-lg text-base outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6 gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 px-4 py-2.5 rounded-lg text-sm cursor-pointer"
                style={{ background: 'var(--bg-surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}
            <button
              type="submit"
              disabled={!canAdvance}
              className="flex items-center gap-1 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-40"
              style={{
                background: 'var(--accent)',
                color: '#0f0e13',
                border: 'none',
                fontFamily: 'var(--heading)',
                letterSpacing: '0.5px',
              }}
            >
              {step < 2 ? (
                <>Next <ChevronRight size={16} /></>
              ) : (
                'Preview Character'
              )}
            </button>
          </div>
        </form>

        {/* Sign-in link */}
        <div className="mt-5 pt-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onSignIn}
            className="text-sm bg-transparent border-none cursor-pointer"
            style={{ color: 'var(--text)' }}
          >
            Already have an account? <span style={{ color: 'var(--accent)' }}>Sign in</span>
          </button>
        </div>
      </div>
    </div>
  );
}

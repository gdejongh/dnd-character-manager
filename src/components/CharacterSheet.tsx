import { useState } from 'react';
import type { Character, AbilityScore, Ability } from '../types/database';
import {
  ABILITIES,
  ABILITY_NAMES,
  SKILLS,
  getModifier,
  getProficiencyBonus,
  formatModifier,
} from '../constants/dnd';

interface CharacterSheetProps {
  character: Character;
  scores: AbilityScore[];
  onUpdateCharacter: (
    updates: Partial<Pick<Character, 'name' | 'race' | 'class' | 'level' | 'skill_proficiencies'>>,
  ) => void;
  onUpdateScore: (ability: string, score: number) => void;
  onToggleSavingThrow: (ability: string) => void;
}

export function CharacterSheet({
  character,
  scores,
  onUpdateCharacter,
  onUpdateScore,
  onToggleSavingThrow,
}: CharacterSheetProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const profBonus = getProficiencyBonus(character.level);

  function getScore(ability: Ability): number {
    return scores.find((s) => s.ability === ability)?.score ?? 10;
  }

  function getSaveProficiency(ability: Ability): boolean {
    return scores.find((s) => s.ability === ability)?.saving_throw_proficiency ?? false;
  }

  function toggleSkillProficiency(skillName: string) {
    const current = character.skill_proficiencies ?? [];
    const updated = current.includes(skillName)
      ? current.filter((s) => s !== skillName)
      : [...current, skillName];
    onUpdateCharacter({ skill_proficiencies: updated });
  }

  const inputStyle = {
    background: 'var(--code-bg)',
    color: 'var(--text-h)',
    border: '1px solid var(--border)',
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      {/* Character Info Header */}
      <div className="flex flex-col gap-2">
        {editingField === 'name' ? (
          <input
            className="text-xl font-bold px-2 py-1 rounded-lg outline-none"
            style={inputStyle}
            value={character.name}
            onChange={(e) => onUpdateCharacter({ name: e.target.value })}
            onBlur={() => setEditingField(null)}
            autoFocus
          />
        ) : (
          <h2
            className="text-xl font-bold m-0 cursor-pointer"
            style={{ color: 'var(--text-h)', fontSize: '1.25rem' }}
            onClick={() => setEditingField('name')}
          >
            {character.name}
          </h2>
        )}

        {editingField === 'info' ? (
          <div className="flex gap-2 w-full flex-wrap">
            <input
              className="flex-1 min-w-0 px-2 py-1 rounded-lg text-sm outline-none"
              style={inputStyle}
              placeholder="Race"
              value={character.race}
              onChange={(e) => onUpdateCharacter({ race: e.target.value })}
            />
            <input
              className="flex-1 min-w-0 px-2 py-1 rounded-lg text-sm outline-none"
              style={inputStyle}
              placeholder="Class"
              value={character.class}
              onChange={(e) => onUpdateCharacter({ class: e.target.value })}
            />
            <input
              className="w-16 px-2 py-1 rounded-lg text-sm outline-none text-center"
              style={inputStyle}
              type="number"
              min={1}
              max={20}
              value={character.level}
              onChange={(e) =>
                onUpdateCharacter({
                  level: Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                })
              }
            />
            <button
              className="px-3 py-1 rounded-lg text-sm cursor-pointer"
              style={{ background: 'var(--accent)', color: 'white', border: 'none' }}
              onClick={() => setEditingField(null)}
            >
              Done
            </button>
          </div>
        ) : (
          <div
            className="flex gap-2 flex-wrap cursor-pointer"
            onClick={() => setEditingField('info')}
          >
            <span
              className="text-sm px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
            >
              {character.race || 'Race'}
            </span>
            <span
              className="text-sm px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
            >
              {character.class || 'Class'}
            </span>
            <span
              className="text-sm px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
            >
              Level {character.level}
            </span>
            <span
              className="text-sm px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
            >
              Prof. {formatModifier(profBonus)}
            </span>
          </div>
        )}
      </div>

      {/* Ability Scores */}
      <section>
        <h3
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--text)' }}
        >
          Ability Scores
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {ABILITIES.map((ability) => {
            const score = getScore(ability);
            const mod = getModifier(score);
            return (
              <div
                key={ability}
                className="flex flex-col items-center p-3 rounded-xl text-center"
                style={{ border: '1px solid var(--border)' }}
              >
                <span
                  className="text-xs font-bold tracking-wider"
                  style={{ color: 'var(--accent)' }}
                >
                  {ability}
                </span>
                <span className="text-2xl font-bold my-1" style={{ color: 'var(--text-h)' }}>
                  {formatModifier(mod)}
                </span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={score}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(30, Number(e.target.value) || 1));
                    onUpdateScore(ability, val);
                  }}
                  className="w-12 text-center text-sm px-1 py-0.5 rounded outline-none"
                  style={inputStyle}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Saving Throws */}
      <section>
        <h3
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--text)' }}
        >
          Saving Throws
        </h3>
        <div className="flex flex-col gap-1">
          {ABILITIES.map((ability) => {
            const mod = getModifier(getScore(ability));
            const proficient = getSaveProficiency(ability);
            const total = mod + (proficient ? profBonus : 0);
            return (
              <div
                key={ability}
                className="flex items-center gap-3 py-2 px-3 rounded-lg"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <button
                  onClick={() => onToggleSavingThrow(ability)}
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
                  style={{
                    background: proficient ? 'var(--accent)' : 'transparent',
                    border: proficient ? '2px solid var(--accent)' : '2px solid var(--border)',
                    color: proficient ? 'white' : 'transparent',
                    fontSize: '12px',
                  }}
                  aria-label={`Toggle ${ABILITY_NAMES[ability]} saving throw proficiency`}
                >
                  ✓
                </button>
                <span className="text-sm font-medium" style={{ color: 'var(--text-h)' }}>
                  {ABILITY_NAMES[ability]}
                </span>
                <span
                  className="ml-auto text-sm font-bold"
                  style={{
                    color: proficient ? 'var(--accent)' : 'var(--text)',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  {formatModifier(total)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Skills */}
      <section>
        <h3
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--text)' }}
        >
          Skills
        </h3>
        <div className="flex flex-col gap-1">
          {SKILLS.map((skill) => {
            const mod = getModifier(getScore(skill.ability));
            const proficient = (character.skill_proficiencies ?? []).includes(skill.name);
            const total = mod + (proficient ? profBonus : 0);
            return (
              <div
                key={skill.name}
                className="flex items-center gap-3 py-2 px-3 rounded-lg"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <button
                  onClick={() => toggleSkillProficiency(skill.name)}
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
                  style={{
                    background: proficient ? 'var(--accent)' : 'transparent',
                    border: proficient ? '2px solid var(--accent)' : '2px solid var(--border)',
                    color: proficient ? 'white' : 'transparent',
                    fontSize: '12px',
                  }}
                  aria-label={`Toggle ${skill.name} proficiency`}
                >
                  ✓
                </button>
                <div className="flex flex-col">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-h)' }}>
                    {skill.name}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text)' }}>
                    {skill.ability}
                  </span>
                </div>
                <span
                  className="ml-auto text-sm font-bold"
                  style={{
                    color: proficient ? 'var(--accent)' : 'var(--text)',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  {formatModifier(total)}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

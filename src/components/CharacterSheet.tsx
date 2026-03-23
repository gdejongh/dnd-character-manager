import { useState, useRef, useCallback } from 'react';
import type { Character, AbilityScore, Ability } from '../types/database';
import {
  ABILITIES,
  ABILITY_NAMES,
  SKILLS,
  getModifier,
  getProficiencyBonus,
  formatModifier,
} from '../constants/dnd';
import { NumericInput } from './NumericInput';
import { Camera, Trash2, Loader, Move, X } from 'lucide-react';

interface CharacterSheetProps {
  character: Character;
  scores: AbilityScore[];
  onUpdateCharacter: (
    updates: Partial<Pick<Character, 'name' | 'race' | 'class' | 'level' | 'skill_proficiencies' | 'image_url' | 'image_position'>>,
  ) => void;
  onUpdateScore: (ability: string, score: number) => void;
  onToggleSavingThrow: (ability: string) => void;
  imageUploading: boolean;
  imageError: string | null;
  onUploadImage: (file: File) => Promise<string | null>;
  onDeleteImage: () => Promise<void>;
}

export function CharacterSheet({
  character,
  scores,
  onUpdateCharacter,
  onUpdateScore,
  onToggleSavingThrow,
  imageUploading,
  imageError,
  onUploadImage,
  onDeleteImage,
}: CharacterSheetProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tappedAbility, setTappedAbility] = useState<Ability | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [repositioning, setRepositioning] = useState(false);
  const [adjustingNew, setAdjustingNew] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragStartRef = useRef<{ startY: number; startPos: number } | null>(null);
  const profBonus = getProficiencyBonus(character.level);

  const imagePosition = dragPos ?? character.image_position ?? 50;
  // When adjusting a new upload, show the new URL; the position starts at 50
  const adjustingPos = dragPos ?? 50;

  const handleDragStart = useCallback((clientY: number) => {
    const currentPos = adjustingNew ? adjustingPos : imagePosition;
    dragStartRef.current = { startY: clientY, startPos: currentPos };
  }, [imagePosition, adjustingNew, adjustingPos]);

  const handleDragMove = useCallback((clientY: number) => {
    if (!dragStartRef.current) return;
    const delta = dragStartRef.current.startY - clientY;
    const newPos = Math.max(0, Math.min(100, dragStartRef.current.startPos + delta * 0.5));
    setDragPos(newPos);
  }, []);

  const handleDragEnd = useCallback(() => {
    dragStartRef.current = null;
    // Don't clear dragPos or save yet — keep the position visible until user confirms
    if (!adjustingNew) {
      if (dragPos !== null) {
        onUpdateCharacter({ image_position: Math.round(dragPos) });
      }
      setDragPos(null);
      setRepositioning(false);
    }
  }, [dragPos, onUpdateCharacter, adjustingNew]);

  const confirmNewImagePosition = useCallback(() => {
    if (newImageUrl) {
      onUpdateCharacter({ image_url: newImageUrl, image_position: Math.round(dragPos ?? 50) } as never);
    }
    setAdjustingNew(false);
    setNewImageUrl(null);
    setDragPos(null);
  }, [newImageUrl, dragPos, onUpdateCharacter]);

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

  // Group skills by ability
  const skillsByAbility = ABILITIES.map((ability) => ({
    ability,
    skills: SKILLS.filter((s) => s.ability === ability),
  })).filter((g) => g.skills.length > 0);

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 animate-fade-in">
      {/* Adjust new image position modal */}
      {adjustingNew && newImageUrl && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.9)' }}
        >
          <p
            className="text-sm mb-4"
            style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}
          >
            DRAG TO ADJUST POSITION
          </p>
          <div
            className="relative w-32 h-32 rounded-full overflow-hidden"
            style={{
              border: '3px solid var(--accent)',
              boxShadow: '0 0 24px rgba(201,168,76,0.3)',
              touchAction: 'none',
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              handleDragStart(e.clientY);
              const onMove = (ev: MouseEvent) => handleDragMove(ev.clientY);
              const onUp = () => { handleDragEnd(); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
            onTouchMove={(e) => { e.preventDefault(); handleDragMove(e.touches[0].clientY); }}
            onTouchEnd={() => handleDragEnd()}
          >
            <img
              src={newImageUrl}
              alt="Position preview"
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
              style={{ objectPosition: `center ${adjustingPos}%` }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.15)' }}
            >
              <Move size={20} style={{ color: 'rgba(255,255,255,0.7)' }} />
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text)' }}>
            Drag up or down to center on your character
          </p>
          <button
            onClick={confirmNewImagePosition}
            className="mt-6 px-8 py-3 rounded-xl font-semibold cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
              color: '#0f0e13',
              border: 'none',
              fontFamily: 'var(--heading)',
              letterSpacing: '1px',
            }}
          >
            Done
          </button>
        </div>
      )}

      {/* Fullscreen image preview */}
      {showFullImage && character.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setShowFullImage(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-h)' }}
            onClick={() => setShowFullImage(false)}
          >
            <X size={24} />
          </button>
          <img
            src={character.image_url}
            alt={character.name}
            className="max-w-full max-h-full rounded-xl object-contain animate-fade-in"
            style={{ boxShadow: '0 0 40px rgba(0,0,0,0.6)' }}
          />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            const url = await onUploadImage(file);
            if (url) {
              setNewImageUrl(url);
              setDragPos(null);
              setAdjustingNew(true);
            }
          }
          e.target.value = '';
        }}
      />

      {/* Character Info Header */}
      <div className="flex gap-4">
        {/* Character Image */}
        <div className="shrink-0">
          <div
            className="relative w-20 h-20 rounded-full overflow-hidden cursor-pointer"
            style={{
              background: 'var(--bg-surface)',
              border: repositioning ? '2px solid var(--accent)' : '2px solid var(--accent-border)',
              boxShadow: repositioning
                ? '0 0 16px rgba(201,168,76,0.3)'
                : '0 0 12px rgba(201,168,76,0.1)',
              touchAction: repositioning ? 'none' : 'auto',
            }}
            onClick={() => {
              if (repositioning || imageUploading) return;
              if (character.image_url) {
                setShowFullImage(true);
              } else {
                fileInputRef.current?.click();
              }
            }}
            onMouseDown={(e) => {
              if (!repositioning) return;
              e.preventDefault();
              handleDragStart(e.clientY);
              const onMove = (ev: MouseEvent) => handleDragMove(ev.clientY);
              const onUp = () => { handleDragEnd(); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
            onTouchStart={(e) => {
              if (!repositioning) return;
              handleDragStart(e.touches[0].clientY);
            }}
            onTouchMove={(e) => {
              if (!repositioning) return;
              e.preventDefault();
              handleDragMove(e.touches[0].clientY);
            }}
            onTouchEnd={() => {
              if (!repositioning) return;
              handleDragEnd();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && !imageUploading && !repositioning && (character.image_url ? setShowFullImage(true) : fileInputRef.current?.click())}
          >
            {character.image_url ? (
              <img
                src={character.image_url}
                alt={character.name}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
                style={{ objectPosition: `center ${imagePosition}%` }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera size={24} style={{ color: 'var(--text)' }} />
              </div>
            )}
            {imageUploading && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.6)' }}
              >
                <Loader size={20} style={{ color: 'var(--accent)', animation: 'diceRoll 1s linear infinite' }} />
              </div>
            )}
            {repositioning && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.3)' }}
              >
                <Move size={16} style={{ color: '#fff' }} />
              </div>
            )}
          </div>
          {character.image_url && !imageUploading && (
            <div className="flex items-center justify-center gap-2 mt-1">
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="text-[10px] cursor-pointer bg-transparent"
                style={{ color: 'var(--accent)', border: 'none', padding: 0 }}
              >
                Change
              </button>
              <span style={{ color: 'var(--border-light)' }}>·</span>
              <button
                onClick={(e) => { e.stopPropagation(); setRepositioning(!repositioning); }}
                className="text-[10px] cursor-pointer bg-transparent"
                style={{ color: repositioning ? 'var(--accent-bright)' : 'var(--text)', border: 'none', padding: 0 }}
              >
                {repositioning ? 'Done' : 'Adjust'}
              </button>
              <span style={{ color: 'var(--border-light)' }}>·</span>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await onDeleteImage();
                  onUpdateCharacter({ image_url: null } as never);
                }}
                className="text-[10px] cursor-pointer bg-transparent flex items-center gap-0.5"
                style={{ color: 'var(--text)', border: 'none', padding: 0 }}
              >
                <Trash2 size={8} /> Del
              </button>
            </div>
          )}
          {imageError && (
            <p className="text-[10px] mt-1 text-center" style={{ color: 'var(--danger-bright)', maxWidth: '5rem' }}>
              {imageError}
            </p>
          )}
        </div>

        {/* Name / Race / Class / Level */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
        {editingField === 'name' ? (
          <input
            className="text-xl font-bold px-3 py-2 rounded-lg outline-none"
            style={{ ...inputStyle, fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}
            value={character.name}
            onChange={(e) => onUpdateCharacter({ name: e.target.value })}
            onBlur={() => setEditingField(null)}
            autoFocus
          />
        ) : (
          <h2
            className="text-xl m-0 cursor-pointer"
            style={{ color: 'var(--accent)', fontSize: '1.25rem' }}
            onClick={() => setEditingField('name')}
          >
            {character.name}
          </h2>
        )}

        {editingField === 'info' ? (
          <div className="flex gap-2 w-full flex-wrap">
            <input
              className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-sm outline-none"
              style={inputStyle}
              placeholder="Race"
              value={character.race}
              onChange={(e) => onUpdateCharacter({ race: e.target.value })}
            />
            <input
              className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-sm outline-none"
              style={inputStyle}
              placeholder="Class"
              value={character.class}
              onChange={(e) => onUpdateCharacter({ class: e.target.value })}
            />
            <NumericInput
              className="w-16 px-2 py-1.5 rounded-lg text-sm outline-none text-center"
              style={inputStyle}
              min={1}
              max={20}
              value={character.level}
              onChange={(val) => onUpdateCharacter({ level: val })}
            />
            <button
              className="px-3 py-1.5 rounded-lg text-sm cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
                color: '#0f0e13',
                border: 'none',
              }}
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
            {[
              character.race || 'Race',
              character.class || 'Class',
              `Level ${character.level}`,
              `Prof. ${formatModifier(profBonus)}`,
            ].map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: 'var(--accent-bg)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent-border)',
                  fontFamily: 'var(--heading)',
                  letterSpacing: '0.3px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Ability Scores — Shield shapes */}
      <section>
        <h3
          className="text-xs uppercase tracking-widest mb-3"
          style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '2px' }}
        >
          Ability Scores
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {ABILITIES.map((ability) => {
            const score = getScore(ability);
            const mod = getModifier(score);
            const isTapped = tappedAbility === ability;
            return (
              <div
                key={ability}
                className="flex flex-col items-center text-center stat-glow"
              >
                {/* Shield shape */}
                <div
                  className="stat-block w-full flex flex-col items-center justify-center cursor-pointer"
                  style={{
                    background: 'linear-gradient(180deg, var(--bg-raised) 0%, var(--bg-surface) 100%)',
                    border: '2px solid var(--border)',
                    aspectRatio: '1 / 1.15',
                    maxWidth: '110px',
                  }}
                  onClick={() => setTappedAbility(isTapped ? null : ability)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setTappedAbility(isTapped ? null : ability)}
                >
                  <span
                    className="text-[10px] font-bold tracking-widest"
                    style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}
                  >
                    {ability}
                  </span>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: 'var(--text-h)', fontFamily: 'var(--mono)', marginTop: '2px' }}
                  >
                    {formatModifier(mod)}
                  </span>
                  <NumericInput
                    min={1}
                    max={30}
                    value={score}
                    onChange={(val) => onUpdateScore(ability, val)}
                    className="w-10 text-center text-xs px-0.5 py-0.5 rounded outline-none mt-1"
                    style={{
                      ...inputStyle,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--border)',
                    }}
                  />
                </div>
                {/* Tap formula */}
                {isTapped && (
                  <div
                    className="text-[10px] mt-1 px-2 py-1 rounded animate-fade-in"
                    style={{
                      color: 'var(--accent)',
                      background: 'var(--accent-bg)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatModifier(mod)} = {score} {ABILITY_NAMES[ability]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Saving Throws */}
      <section>
        <h3
          className="text-xs uppercase tracking-widest mb-3"
          style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '2px' }}
        >
          Saving Throws
        </h3>
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          {ABILITIES.map((ability) => {
            const mod = getModifier(getScore(ability));
            const proficient = getSaveProficiency(ability);
            const total = mod + (proficient ? profBonus : 0);
            return (
              <div
                key={ability}
                className="flex items-center gap-3 py-3 px-4"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <button
                  onClick={() => onToggleSavingThrow(ability)}
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
                  style={{
                    background: proficient ? 'var(--accent)' : 'transparent',
                    border: proficient ? '2px solid var(--accent)' : '2px solid var(--border-light)',
                    color: proficient ? '#0f0e13' : 'transparent',
                    fontSize: '11px',
                    fontWeight: 'bold',
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

      {/* Skills — grouped by ability */}
      <section>
        <h3
          className="text-xs uppercase tracking-widest mb-3"
          style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '2px' }}
        >
          Skills
        </h3>
        <div className="flex flex-col gap-4">
          {skillsByAbility.map((group) => (
            <div key={group.ability}>
              <div
                className="text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 mb-1"
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--heading)',
                  letterSpacing: '1.5px',
                  background: 'var(--accent-bg)',
                  borderRadius: '6px',
                }}
              >
                {ABILITY_NAMES[group.ability]}
              </div>
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
              >
                {group.skills.map((skill) => {
                  const mod = getModifier(getScore(skill.ability));
                  const proficient = (character.skill_proficiencies ?? []).includes(skill.name);
                  const total = mod + (proficient ? profBonus : 0);
                  return (
                    <div
                      key={skill.name}
                      className="flex items-center gap-3 py-2.5 px-4"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <button
                        onClick={() => toggleSkillProficiency(skill.name)}
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
                        style={{
                          background: proficient ? 'var(--accent)' : 'transparent',
                          border: proficient ? '2px solid var(--accent)' : '2px solid var(--border-light)',
                          color: proficient ? '#0f0e13' : 'transparent',
                          fontSize: '9px',
                          fontWeight: 'bold',
                        }}
                        aria-label={`Toggle ${skill.name} proficiency`}
                      >
                        ✓
                      </button>
                      <span className="text-sm" style={{ color: 'var(--text-h)' }}>
                        {skill.name}
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
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

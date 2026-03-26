import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Character, AbilityScore, Ability, CharacterClass } from '../types/database';
import {
  ABILITIES,
  ABILITY_NAMES,
  SKILLS,
  SPEED_TYPES,
  EXTRA_SPEED_TYPES,
  isDruid,
  getModifier,
  getProficiencyBonus,
  formatModifier,
  getSpellcastingAbility,
} from '../constants/dnd';
import { NumericInput } from './NumericInput';
import { Camera, Trash2, Loader, Move, X, Pencil, Shield, Zap, Eye, RotateCcw, Plus } from 'lucide-react';

interface CharacterSheetProps {
  character: Character;
  scores: AbilityScore[];
  onUpdateCharacter: (
    updates: Partial<Pick<Character, 'name' | 'race' | 'class' | 'level' | 'armor_class' | 'speed' | 'swim_speed' | 'fly_speed' | 'climb_speed' | 'burrow_speed' | 'skill_proficiencies' | 'initiative_modifier' | 'passive_perception' | 'image_url' | 'image_position' | 'wild_shape_active' | 'wild_shape_current_hp' | 'wild_shape_max_hp' | 'wild_shape_beast_name'>>,
  ) => void;
  onUpdateScore: (ability: string, score: number) => void;
  onToggleSavingThrow: (ability: string) => void;
  imageUploading: boolean;
  imageError: string | null;
  onUploadImage: (file: File) => Promise<string | null>;
  onDeleteImage: () => Promise<void>;
  readOnly?: boolean;
  onOpenWildShapeModal?: () => void;
  characterClasses?: CharacterClass[];
  onAddClass?: (className: string, level?: number) => void;
  onUpdateClassLevel?: (classId: string, level: number) => void;
  onUpdateClassName?: (classId: string, name: string) => void;
  onRemoveClass?: (classId: string) => void;
  onMigrateToMulticlass?: (existingClassName: string, existingLevel: number) => void;
  onUpdatePrimaryCastingClass?: (className: string) => void;
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
  readOnly,
  onOpenWildShapeModal,
  characterClasses = [],
  onAddClass,
  onUpdateClassLevel,
  onUpdateClassName,
  onRemoveClass,
  onMigrateToMulticlass,
  onUpdatePrimaryCastingClass,
}: CharacterSheetProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tappedAbility, setTappedAbility] = useState<Ability | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [repositioning, setRepositioning] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [adjustingNew, setAdjustingNew] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragStartRef = useRef<{ startY: number; startPos: number } | null>(null);
  const profBonus = getProficiencyBonus(character.level);
  const useMulticlass = characterClasses.length > 0;
  const classEntries = characterClasses.map((c) => ({ className: c.class_name, level: c.level }));
  const totalLevel = useMulticlass ? classEntries.reduce((s, c) => s + c.level, 0) : character.level;

  // For the primary casting class selector, find which classes have spellcasting
  const spellcastingClasses = characterClasses.filter((c) => getSpellcastingAbility(c.class_name) !== null);

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
    // For inline repositioning, keep dragPos visible — user must confirm via menu
  }, []);

  const confirmReposition = useCallback(() => {
    if (dragPos !== null) {
      onUpdateCharacter({ image_position: Math.round(dragPos) });
    }
    setDragPos(null);
    setRepositioning(false);
  }, [dragPos, onUpdateCharacter]);

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

  const inBeastForm = character.wild_shape_active;
  const BEAST_ABILITIES = new Set<Ability>(['STR', 'DEX', 'CON']);
  const beastScoreMap: Partial<Record<Ability, number>> = inBeastForm ? {
    STR: character.wild_shape_beast_str ?? undefined,
    DEX: character.wild_shape_beast_dex ?? undefined,
    CON: character.wild_shape_beast_con ?? undefined,
  } : {};

  function getEffectiveScore(ability: Ability): number {
    if (inBeastForm && BEAST_ABILITIES.has(ability) && beastScoreMap[ability] != null) {
      return beastScoreMap[ability]!;
    }
    return getScore(ability);
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
    <div className="flex flex-col gap-6 md:gap-7 p-4 md:p-6 lg:p-8 animate-fade-in">
      {/* Adjust new image position modal */}
      {adjustingNew && newImageUrl && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[90] flex flex-col items-center justify-start p-4 md:justify-center md:p-6"
            style={{
              background: 'rgba(0,0,0,0.9)',
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
            }}
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
          </div>,
          document.body,
        )}

      {/* Fullscreen image preview */}
      {showFullImage && character.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 pb-6 px-6"
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
            className="max-w-full rounded-xl object-contain animate-fade-in"
            style={{ boxShadow: '0 0 40px rgba(0,0,0,0.6)', maxHeight: 'calc(100dvh - 6rem)' }}
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

      <div className="max-w-5xl mx-auto w-full flex flex-col gap-5 md:gap-6">
      {/* Character Info Header */}
      <div className="flex gap-4 md:gap-5 items-start">
        {/* Character Image */}
        <div className="shrink-0 relative">
          <div
            className="relative w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden cursor-pointer"
            style={{
              background: 'var(--bg-surface)',
              border: repositioning ? '2px solid var(--accent)' : '2px solid var(--accent-border)',
              boxShadow: repositioning
                ? '0 0 16px rgba(201,168,76,0.3)'
                : '0 0 12px rgba(201,168,76,0.1)',
              touchAction: repositioning ? 'none' : 'auto',
            }}
            onClick={() => {
              if (readOnly || repositioning || imageUploading) return;
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
                {readOnly ? (
                  <Shield size={24} style={{ color: 'var(--text)' }} />
                ) : (
                  <Camera size={24} style={{ color: 'var(--text)' }} />
                )}
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

          {/* Edit badge — pencil icon, or Done button during repositioning */}
          {character.image_url && !imageUploading && repositioning && (
            <button
              onClick={(e) => { e.stopPropagation(); confirmReposition(); }}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer whitespace-nowrap"
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
                color: '#0f0e13',
                border: '2px solid var(--bg)',
                fontFamily: 'var(--heading)',
                letterSpacing: '0.5px',
              }}
            >
              Done
            </button>
          )}
          {character.image_url && !imageUploading && !repositioning && !readOnly && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowImageMenu(!showImageMenu); }}
              className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: 'var(--accent)',
                border: '2px solid var(--bg)',
                color: '#0f0e13',
              }}
              aria-label="Edit character image"
            >
              <Pencil size={10} />
            </button>
          )}

          {/* Image action menu */}
          {showImageMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowImageMenu(false)}
              />
              <div
                className="absolute left-0 top-full mt-1 z-50 rounded-lg overflow-hidden animate-fade-in"
                style={{
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: '8rem',
                }}
              >
                <button
                  onClick={() => { setShowImageMenu(false); fileInputRef.current?.click(); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs cursor-pointer bg-transparent text-left"
                  style={{ color: 'var(--text-h)', border: 'none', borderBottom: '1px solid var(--border)' }}
                >
                  <Camera size={12} /> Change Photo
                </button>
                <button
                  onClick={() => { setShowImageMenu(false); setRepositioning(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs cursor-pointer bg-transparent text-left"
                  style={{ color: 'var(--text-h)', border: 'none', borderBottom: '1px solid var(--border)' }}
                >
                  <Move size={12} /> Adjust Position
                </button>
                <button
                  onClick={async () => {
                    setShowImageMenu(false);
                    await onDeleteImage();
                    onUpdateCharacter({ image_url: null } as never);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs cursor-pointer bg-transparent text-left"
                  style={{ color: 'var(--danger-bright)', border: 'none' }}
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </>
          )}

          {imageError && (
            <p className="text-[10px] mt-1 text-center" style={{ color: 'var(--danger-bright)', maxWidth: '5rem' }}>
              {imageError}
            </p>
          )}
        </div>

        {/* Name / Race / Class / Level */}
        <div className="flex flex-col gap-2.5 md:gap-3 flex-1 min-w-0">
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
          <div className="flex flex-col gap-2 w-full">
            <input
              className="w-full px-3 py-2 rounded-lg text-base outline-none"
              style={{ ...inputStyle, fontSize: '16px' }}
              placeholder="Race"
              value={character.race}
              onChange={(e) => onUpdateCharacter({ race: e.target.value })}
            />

            {/* Multiclass editor */}
            {useMulticlass && onAddClass ? (
              <div className="flex flex-col gap-1.5">
                {characterClasses.map((cc) => (
                  <div key={cc.id} className="flex gap-1.5 items-center">
                    <input
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-sm outline-none"
                      style={{ ...inputStyle }}
                      placeholder="Class"
                      value={cc.class_name}
                      onChange={(e) => onUpdateClassName?.(cc.id, e.target.value)}
                    />
                    <NumericInput
                      className="w-16 px-2 py-1.5 rounded-lg text-sm outline-none text-center"
                      style={inputStyle}
                      min={1}
                      max={20 - (totalLevel - cc.level)}
                      value={cc.level}
                      onChange={(val) => onUpdateClassLevel?.(cc.id, val)}
                    />
                    {characterClasses.length > 1 && (
                      <button
                        className="p-1 rounded cursor-pointer"
                        style={{ background: 'transparent', border: 'none', color: 'var(--hp-crimson)' }}
                        onClick={() => onRemoveClass?.(cc.id)}
                        title="Remove class"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {totalLevel < 20 && (
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs cursor-pointer self-start"
                    style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--accent)' }}
                    onClick={() => onAddClass?.('', 1)}
                  >
                    <Plus size={12} /> Add Class
                  </button>
                )}
                {/* Primary casting class selector */}
                {spellcastingClasses.length >= 2 && (
                  <div className="flex items-center gap-2 mt-1">
                    <label className="text-[10px]" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--heading)' }}>Primary Casting:</label>
                    <select
                      className="px-2 py-1 rounded-lg text-xs outline-none"
                      style={{ ...inputStyle, fontSize: '12px' }}
                      value={character.primary_casting_class ?? ''}
                      onChange={(e) => onUpdatePrimaryCastingClass?.(e.target.value)}
                    >
                      {spellcastingClasses.map((c) => (
                        <option key={c.id} value={c.class_name}>{c.class_name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              /* Single-class mode with Add Class shortcut */
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-2">
                  <input
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg text-base outline-none"
                    style={{ ...inputStyle, fontSize: '16px' }}
                    placeholder="Class"
                    value={character.class}
                    onChange={(e) => onUpdateCharacter({ class: e.target.value })}
                  />
                </div>
                {onMigrateToMulticlass && totalLevel < 20 && (
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs cursor-pointer self-start"
                    style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--accent)' }}
                    onClick={() => {
                      if (character.class) onMigrateToMulticlass(character.class, character.level);
                    }}
                  >
                    <Plus size={12} /> Add Class
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-2 items-center">
              {!useMulticlass && (
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--heading)', letterSpacing: '0.3px' }}>Level</label>
                  <NumericInput
                    className="w-20 px-3 py-2 rounded-lg text-base outline-none text-center"
                    style={{ ...inputStyle, fontSize: '16px' }}
                    min={1}
                    max={20}
                    value={character.level}
                    onChange={(val) => onUpdateCharacter({ level: val })}
                  />
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                <label className="text-xs" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--heading)', letterSpacing: '0.3px' }}>AC</label>
                <NumericInput
                  className="w-20 px-3 py-2 rounded-lg text-base outline-none text-center"
                  style={{ ...inputStyle, fontSize: '16px' }}
                  min={1}
                  max={30}
                  value={character.armor_class}
                  onChange={(val) => onUpdateCharacter({ armor_class: val })}
                />
              </div>
              <div className="flex-1" />
              <button
                className="px-4 py-2 rounded-lg text-sm cursor-pointer self-end"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
                  color: '#0f0e13',
                  border: 'none',
                }}
                onClick={() => {
                  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                  setTimeout(() => setEditingField(null), 0);
                }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div
            className="flex gap-2 flex-wrap cursor-pointer"
            onClick={() => setEditingField('info')}
          >
            {[
              character.race || 'Race',
              character.class || 'Class',
              `Level ${totalLevel}`,
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
            <span
              className="text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1"
              style={{
                background: 'rgba(160, 174, 192, 0.12)',
                color: 'var(--text-secondary, #a0aec0)',
                border: '1px solid rgba(160, 174, 192, 0.25)',
                fontFamily: 'var(--heading)',
                letterSpacing: '0.3px',
              }}
            >
              <Shield size={11} /> AC {character.armor_class}
            </span>
          </div>
        )}
        </div>
      </div>

      {/* Initiative, Passive Perception & Speed */}
      <div className="mt-1 md:mt-2 grid grid-cols-3 gap-3 md:gap-4">
        {/* Initiative */}
        {(() => {
          const dexMod = getModifier(getScore('DEX'));
          const autoInit = dexMod;
          const isOverride = character.initiative_modifier !== null && character.initiative_modifier !== undefined;
          const value = isOverride ? character.initiative_modifier! : autoInit;
          return (
            <div
              className="flex flex-col items-center gap-1 p-3 rounded-xl cursor-pointer relative"
              style={{
                background: 'var(--bg-surface)',
                border: `1px solid ${isOverride ? 'var(--spell-indigo)' : 'var(--border)'}`,
              }}
              onClick={() => {
                if (readOnly) return;
                if (editingField === 'initiative') return;
                setEditingField('initiative');
              }}
            >
              <div className="flex items-center gap-1.5">
                <Zap size={12} style={{ color: 'var(--accent)' }} />
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}>
                  Initiative
                </span>
                {isOverride && !readOnly && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateCharacter({ initiative_modifier: null }); setEditingField(null); }}
                    className="p-0.5 rounded cursor-pointer bg-transparent"
                    style={{ color: 'var(--text-muted)', border: 'none' }}
                    title="Reset to auto (DEX mod)"
                  >
                    <RotateCcw size={10} />
                  </button>
                )}
              </div>
              {editingField === 'initiative' ? (
                <div className="flex items-center gap-2">
                  <NumericInput
                    min={-10}
                    max={20}
                    value={value}
                    onChange={(val) => onUpdateCharacter({ initiative_modifier: val })}
                    className="w-16 px-2 py-1 rounded-lg text-center text-lg font-bold outline-none"
                    style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)', fontFamily: 'var(--mono)' }}
                    autoFocus
                  />
                  <button
                    className="px-2 py-1 rounded-lg text-[10px] cursor-pointer font-semibold"
                    style={{ background: 'var(--accent)', color: '#0f0e13', border: 'none' }}
                    onClick={(e) => { e.stopPropagation(); setEditingField(null); }}
                  >
                    OK
                  </button>
                </div>
              ) : (
                <span className="text-xl font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--mono)' }}>
                  {formatModifier(value)}
                </span>
              )}
              <span className="text-[9px]" style={{ color: isOverride ? 'var(--spell-indigo)' : 'var(--text-muted)' }}>
                {isOverride ? 'Override' : 'DEX mod'}
              </span>
            </div>
          );
        })()}

        {/* Passive Perception */}
        {(() => {
          const wisMod = getModifier(getScore('WIS'));
          const perceptionProf = (character.skill_proficiencies ?? []).includes('Perception');
          const autoPassive = 10 + wisMod + (perceptionProf ? profBonus : 0);
          const isOverride = character.passive_perception !== null && character.passive_perception !== undefined;
          const value = isOverride ? character.passive_perception! : autoPassive;
          return (
            <div
              className="flex flex-col items-center gap-1 p-3 rounded-xl cursor-pointer relative"
              style={{
                background: 'var(--bg-surface)',
                border: `1px solid ${isOverride ? 'var(--spell-indigo)' : 'var(--border)'}`,
              }}
              onClick={() => {
                if (readOnly) return;
                if (editingField === 'passive') return;
                setEditingField('passive');
              }}
            >
              <div className="flex items-center gap-1.5">
                <Eye size={12} style={{ color: 'var(--accent)' }} />
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}>
                  Passive Perc.
                </span>
                {isOverride && !readOnly && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateCharacter({ passive_perception: null }); setEditingField(null); }}
                    className="p-0.5 rounded cursor-pointer bg-transparent"
                    style={{ color: 'var(--text-muted)', border: 'none' }}
                    title="Reset to auto-calculated"
                  >
                    <RotateCcw size={10} />
                  </button>
                )}
              </div>
              {editingField === 'passive' ? (
                <div className="flex items-center gap-2">
                  <NumericInput
                    min={1}
                    max={30}
                    value={value}
                    onChange={(val) => onUpdateCharacter({ passive_perception: val })}
                    className="w-16 px-2 py-1 rounded-lg text-center text-lg font-bold outline-none"
                    style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)', fontFamily: 'var(--mono)' }}
                    autoFocus
                  />
                  <button
                    className="px-2 py-1 rounded-lg text-[10px] cursor-pointer font-semibold"
                    style={{ background: 'var(--accent)', color: '#0f0e13', border: 'none' }}
                    onClick={(e) => { e.stopPropagation(); setEditingField(null); }}
                  >
                    OK
                  </button>
                </div>
              ) : (
                <span className="text-xl font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--mono)' }}>
                  {value}
                </span>
              )}
              <span className="text-[9px]" style={{ color: isOverride ? 'var(--spell-indigo)' : 'var(--text-muted)' }}>
                {isOverride ? 'Override' : `10 + WIS${perceptionProf ? ' + Prof' : ''}`}
              </span>
            </div>
          );
        })()}

        {/* Speed */}
        <div
          className="flex flex-col items-center gap-1 p-3 rounded-xl cursor-pointer"
          style={{
            background: 'var(--bg-surface)',
            border: `1px solid var(--border)`,
          }}
          onClick={() => {
            if (readOnly) return;
            if (editingField === 'speed') return;
            setEditingField('speed');
          }}
        >
          <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}>
            Speed
          </span>
          {editingField === 'speed' ? (
            <div className="flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {SPEED_TYPES.map((st) => (
                <div key={st.key} className="flex items-center gap-2">
                  <span className="text-xs w-16 text-right" style={{ color: 'var(--text-muted)' }}>
                    {st.emoji} {st.label}
                  </span>
                  <NumericInput
                    min={0}
                    max={120}
                    value={st.key === 'speed' ? character.speed : (character[st.key] ?? 0)}
                    onChange={(val) => {
                      if (st.key === 'speed') {
                        onUpdateCharacter({ speed: val });
                      } else {
                        const update: Partial<Pick<Character, 'swim_speed' | 'fly_speed' | 'climb_speed' | 'burrow_speed'>> = {
                          [st.key]: val === 0 ? null : val,
                        };
                        onUpdateCharacter(update);
                      }
                    }}
                    className="w-16 px-2 py-1 rounded-lg text-center text-sm font-bold outline-none"
                    style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)', fontFamily: 'var(--mono)' }}
                  />
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>ft</span>
                </div>
              ))}
              <button
                className="px-3 py-1 rounded-lg text-[10px] cursor-pointer font-semibold mt-1"
                style={{ background: 'var(--accent)', color: '#0f0e13', border: 'none' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                  setTimeout(() => setEditingField(null), 0);
                }}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <span className="text-xl font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--mono)' }}>
                {character.speed} ft
              </span>
              <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                Walking
              </span>
              {EXTRA_SPEED_TYPES.filter((st) => character[st.key] != null && character[st.key]! > 0).length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-1">
                  {EXTRA_SPEED_TYPES.filter((st) => character[st.key] != null && character[st.key]! > 0).map((st) => (
                    <span
                      key={st.key}
                      className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ background: 'var(--bg-raised)', color: 'var(--text)', border: '1px solid var(--border)' }}
                      title={`${st.label}: ${character[st.key]} ft`}
                    >
                      {st.emoji} {character[st.key]} ft
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Wild Shape Beast Form Banner */}
      {inBeastForm && (
        <div
          className="rounded-xl p-3 animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))',
            border: '1px solid var(--spell-border)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '16px' }}>🐺</span>
              <span className="text-sm font-bold" style={{ color: 'var(--spell-violet)', fontFamily: 'var(--heading)' }}>
                {character.wild_shape_beast_name ?? 'Beast Form'}
              </span>
            </div>
            {!readOnly && (
              <button
                className="px-2.5 py-1 rounded-lg text-[10px] cursor-pointer font-semibold"
                style={{ background: 'var(--hp-crimson)', color: 'white', border: 'none' }}
                onClick={() => onUpdateCharacter({
                  wild_shape_active: false,
                  wild_shape_current_hp: null,
                  wild_shape_max_hp: null,
                  wild_shape_beast_name: null,
                })}
              >
                Revert
              </button>
            )}
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Physical stats (STR, DEX, CON) replaced by beast form. INT, WIS, CHA unchanged.
          </div>
        </div>
      )}
      {!inBeastForm && !readOnly && (useMulticlass ? isDruid(classEntries) : isDruid(character.class)) && onOpenWildShapeModal && (
        <button
          className="w-full py-2.5 rounded-xl cursor-pointer text-sm font-bold flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))',
            border: '1px solid var(--spell-border)',
            color: 'var(--spell-violet)',
            fontFamily: 'var(--heading)',
          }}
          onClick={onOpenWildShapeModal}
        >
          🐺 Wild Shape
        </button>
      )}

      <section className="pt-1">
        <h3
          className="text-xs uppercase tracking-widest mb-3"
          style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '2px' }}
        >
          Ability Scores
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-5">
          {ABILITIES.map((ability) => {
            const effectiveScore = getEffectiveScore(ability);
            const mod = getModifier(effectiveScore);
            const isTapped = tappedAbility === ability;
            const isBeastOverride = inBeastForm && BEAST_ABILITIES.has(ability);
            return (
              <div
                key={ability}
                className="flex flex-col items-center text-center stat-glow"
              >
                {/* Shield shape */}
                <div
                  className="stat-block w-full flex flex-col items-center justify-center cursor-pointer"
                  style={{
                    background: isBeastOverride
                      ? 'linear-gradient(180deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)'
                      : 'linear-gradient(180deg, var(--bg-raised) 0%, var(--bg-surface) 100%)',
                    border: isBeastOverride ? '2px solid var(--spell-border)' : '2px solid var(--border)',
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
                    style={{ color: isBeastOverride ? 'var(--spell-violet)' : 'var(--accent)', fontFamily: 'var(--heading)' }}
                  >
                    {ability}
                  </span>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: 'var(--text-h)', fontFamily: 'var(--mono)', marginTop: '2px' }}
                  >
                    {formatModifier(mod)}
                  </span>
                  {isBeastOverride ? (
                    <span
                      className="text-xs mt-1 px-1"
                      style={{ color: 'var(--spell-violet)', fontFamily: 'var(--mono)' }}
                    >
                      {effectiveScore}
                    </span>
                  ) : (
                    <NumericInput
                      min={1}
                      max={30}
                      value={effectiveScore}
                      onChange={(val) => onUpdateScore(ability, val)}
                      className="w-10 text-center text-xs px-0.5 py-0.5 rounded outline-none mt-1"
                      style={{
                        ...inputStyle,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--border)',
                      }}
                    />
                  )}
                </div>
                {/* Tap formula */}
                {isTapped && (
                  <div
                    className="text-[10px] mt-1 px-2 py-1 rounded animate-fade-in"
                    style={{
                      color: isBeastOverride ? 'var(--spell-violet)' : 'var(--accent)',
                      background: isBeastOverride ? 'rgba(139, 92, 246, 0.1)' : 'var(--accent-bg)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatModifier(mod)} = {effectiveScore} {ABILITY_NAMES[ability]}
                    {isBeastOverride && ' 🐺'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Saving Throws */}
      <section className="pt-1">
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
      <section className="pt-1">
        <h3
          className="text-xs uppercase tracking-widest mb-3"
          style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '2px' }}
        >
          Skills
        </h3>
        <div className="flex flex-col md:grid md:grid-cols-2 md:gap-x-6 gap-5">
          {skillsByAbility.map((group) => (
            <div key={group.ability}>
              <div
                className="text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 mb-2"
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
                      className="flex items-center gap-3 py-3 px-4"
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
                        aria-pressed={proficient}
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
    </div>
  );
}

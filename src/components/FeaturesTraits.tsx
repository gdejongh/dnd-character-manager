import { useState, useRef, useCallback } from 'react';
import type { FormEvent, TouchEvent as ReactTouchEvent } from 'react';
import type { Feature, ActionType } from '../types/database';
import { ActionTypePicker, ActionTypeBadge, ActionTypeFilterBar } from './ActionType';
import type { ActionTypeFilter } from '../constants/actionTypes';
import { Swords, Trash2, Pencil } from 'lucide-react';

interface FeaturesTraitsProps {
  features: Feature[];
  onAdd: (title: string, description: string, source: string, actionType: ActionType, maxUses: number | null) => void;
  onUpdate: (id: string, updates: Partial<Pick<Feature, 'title' | 'description' | 'source' | 'action_type' | 'max_uses' | 'used_uses'>>) => void;
  onDelete: (id: string) => void;
}

export function FeaturesTraits({ features, onAdd, onUpdate, onDelete }: FeaturesTraitsProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [actionType, setActionType] = useState<ActionType>('other');
  const [maxUses, setMaxUses] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<ActionTypeFilter>('all');

  const filteredFeatures = features.filter((f) => {
    if (actionFilter === 'all') return true;
    return (f.action_type ?? 'other') === actionFilter;
  });

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const parsedUses = maxUses.trim() ? parseInt(maxUses, 10) : null;
    onAdd(title.trim(), description.trim(), source.trim(), actionType, parsedUses && parsedUses > 0 ? parsedUses : null);
    setTitle('');
    setDescription('');
    setSource('');
    setActionType('other');
    setMaxUses('');
    setShowForm(false);
  }

  const inputStyle = {
    background: 'var(--code-bg)',
    color: 'var(--text-h)',
    border: '1px solid var(--border)',
  };

  return (
    <div className="flex flex-col gap-3 p-4 md:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <Swords size={16} style={{ color: 'var(--accent)' }} />
        <h3
          className="text-xs uppercase tracking-widest m-0"
          style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '2px' }}
        >
          Features &amp; Traits
        </h3>
      </div>

      {/* Action type filter */}
      <ActionTypeFilterBar
        value={actionFilter}
        onChange={setActionFilter}
        counts={{
          all: features.length,
          action: features.filter((f) => f.action_type === 'action').length,
          bonus_action: features.filter((f) => f.action_type === 'bonus_action').length,
          reaction: features.filter((f) => f.action_type === 'reaction').length,
          other: features.filter((f) => (!f.action_type || f.action_type === 'other')).length,
        }}
      />

      <div className="md:grid md:grid-cols-2 md:gap-3 flex flex-col gap-3">
      {filteredFeatures.map((feature) => (
        <FeatureCard
          key={feature.id}
          feature={feature}
          isExpanded={expandedId === feature.id}
          onToggle={() => setExpandedId(expandedId === feature.id ? null : feature.id)}
          onUpdate={(updates) => onUpdate(feature.id, updates)}
          onDelete={() => onDelete(feature.id)}
        />
      ))}
      </div>

      {filteredFeatures.length === 0 && !showForm && (
        <p className="text-center py-8" style={{ color: 'var(--text)' }}>
          {actionFilter === 'all' ? 'No features or traits yet.' : 'No features with this action type.'}
        </p>
      )}

      {showForm ? (
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 p-4 rounded-xl animate-fade-in"
          style={{ border: '1px solid var(--accent-border)', background: 'var(--bg-surface)' }}
        >
          <input
            className="w-full px-4 py-3 rounded-lg text-sm outline-none"
            style={inputStyle}
            placeholder="Feature title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
          <input
            className="w-full px-4 py-3 rounded-lg text-sm outline-none"
            style={inputStyle}
            placeholder="Source (e.g., Racial, Class, Background)"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          <textarea
            className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
            style={{ ...inputStyle, fontFamily: 'var(--sans)' }}
            placeholder="Description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
              Action Type
            </span>
            <ActionTypePicker value={actionType} onChange={setActionType} />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
              Uses per Rest (leave blank for unlimited)
            </span>
            <input
              type="number"
              className="w-24 px-3 py-2 rounded-lg text-sm outline-none text-center"
              style={inputStyle}
              placeholder="—"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              min={1}
              max={99}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-3 rounded-lg text-sm cursor-pointer"
              style={{ color: 'var(--text)', background: 'transparent', border: '1px solid var(--border)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-lg font-semibold text-sm cursor-pointer"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))', color: '#0f0e13', border: 'none' }}
            >
              Add Feature
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl font-semibold text-sm cursor-pointer"
          style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
        >
          + Add Feature
        </button>
      )}
      </div>
    </div>
  );
}

function FeatureCard({
  feature,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
}: {
  feature: Feature;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Pick<Feature, 'title' | 'description' | 'source' | 'action_type' | 'max_uses' | 'used_uses'>>) => void;
  onDelete: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const swipingRef = useRef(false);
  const [showDeleteBtn, setShowDeleteBtn] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(feature.title);
  const [editDescription, setEditDescription] = useState(feature.description);
  const [editSource, setEditSource] = useState(feature.source);
  const [editActionType, setEditActionType] = useState<ActionType>(feature.action_type ?? 'other');
  const [editMaxUses, setEditMaxUses] = useState(feature.max_uses !== null ? String(feature.max_uses) : '');

  function isInteractiveTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return !!target.closest('input, textarea, select, button, a, [contenteditable="true"], [role="button"]');
  }

  function startEdit() {
    setEditTitle(feature.title);
    setEditDescription(feature.description);
    setEditSource(feature.source);
    setEditActionType(feature.action_type ?? 'other');
    setEditMaxUses(feature.max_uses !== null ? String(feature.max_uses) : '');
    resetSwipe();
    setIsEditing(true);
  }

  function handleSave() {
    if (!editTitle.trim()) return;
    const parsedUses = editMaxUses.trim() ? parseInt(editMaxUses, 10) : null;
    onUpdate({
      title: editTitle.trim(),
      description: editDescription.trim(),
      source: editSource.trim(),
      action_type: editActionType,
      max_uses: parsedUses && parsedUses > 0 ? parsedUses : null,
    });
    setIsEditing(false);
  }

  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    if (isEditing || isInteractiveTarget(e.target) || e.touches.length !== 1) {
      swipingRef.current = false;
      return;
    }
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = startXRef.current;
    swipingRef.current = true;
  }, [isEditing]);

  const handleTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!swipingRef.current || isEditing) return;
    const el = cardRef.current;
    if (!el) return;
    currentXRef.current = e.touches[0].clientX;
    const dx = currentXRef.current - startXRef.current;
    if (dx < 0) {
      el.style.transform = `translateX(${Math.max(dx, -80)}px)`;
      el.style.transition = 'none';
    }
  }, [isEditing]);

  const handleTouchEnd = useCallback(() => {
    if (!swipingRef.current || isEditing) return;
    swipingRef.current = false;
    const el = cardRef.current;
    if (!el) return;
    const dx = currentXRef.current - startXRef.current;
    if (dx < -50) {
      el.style.transition = 'transform 0.2s ease-out';
      el.style.transform = 'translateX(-60px)';
      setShowDeleteBtn(true);
    } else {
      el.style.transition = 'transform 0.2s ease-out';
      el.style.transform = 'translateX(0)';
      setShowDeleteBtn(false);
    }
  }, [isEditing]);

  const resetSwipe = useCallback(() => {
    const el = cardRef.current;
    if (el) {
      el.style.transition = 'transform 0.2s ease-out';
      el.style.transform = 'translateX(0)';
    }
    setShowDeleteBtn(false);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ border: '1px solid var(--border)' }}>
      {/* Delete button behind */}
      {showDeleteBtn && (
        <div
          className="absolute right-0 top-0 bottom-0 w-[60px] flex items-center justify-center cursor-pointer"
          style={{ background: 'var(--danger)' }}
          onClick={() => { resetSwipe(); onDelete(); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onDelete()}
        >
          <Trash2 size={18} style={{ color: 'white' }} />
        </div>
      )}

      <div
        ref={cardRef}
        className="relative p-4 rounded-xl"
        style={{ background: 'var(--bg-surface)' }}
        onTouchStart={isEditing ? undefined : handleTouchStart}
        onTouchMove={isEditing ? undefined : handleTouchMove}
        onTouchEnd={isEditing ? undefined : handleTouchEnd}
        onTouchCancel={isEditing ? undefined : () => { swipingRef.current = false; resetSwipe(); }}
        onDragStartCapture={(e) => {
          if (isInteractiveTarget(e.target)) e.stopPropagation();
        }}
      >
        <div
          className="flex items-start justify-between cursor-pointer"
          onClick={onToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4
                className="font-semibold text-sm m-0"
                style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', letterSpacing: '0.3px' }}
              >
                {feature.title}
              </h4>
              <ActionTypeBadge type={feature.action_type ?? 'other'} small />
            </div>
            {feature.source && (
              <span
                className="text-xs mt-0.5 inline-block px-2 py-0.5 rounded-full"
                style={{
                  color: 'var(--accent)',
                  background: 'var(--accent-bg)',
                  border: '1px solid var(--accent-border)',
                }}
              >
                {feature.source}
              </span>
            )}
            {feature.max_uses !== null && feature.max_uses > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                {Array.from({ length: feature.max_uses }).map((_, i) => {
                  const remaining = feature.max_uses! - feature.used_uses;
                  const available = i < remaining;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (available) {
                          onUpdate({ used_uses: feature.used_uses + 1 });
                        } else {
                          onUpdate({ used_uses: Math.max(0, feature.used_uses - 1) });
                        }
                      }}
                      className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all"
                      style={{
                        background: available
                          ? 'linear-gradient(135deg, var(--accent), var(--accent-bright))'
                          : 'var(--bg-raised)',
                        border: available
                          ? '2px solid var(--accent)'
                          : '2px solid var(--border)',
                        boxShadow: available ? '0 0 6px rgba(201,168,76,0.4)' : 'none',
                      }}
                      aria-label={`Use ${i + 1}: ${available ? 'available' : 'spent'}`}
                    >
                      <span style={{ color: available ? '#0f0e13' : 'var(--border-light)', fontSize: '11px', fontWeight: 'bold' }}>
                        {available ? '◆' : '○'}
                      </span>
                    </button>
                  );
                })}
                <span className="text-[10px] ml-1" style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>
                  {feature.max_uses - feature.used_uses}/{feature.max_uses}
                </span>
              </div>
            )}
          </div>
          <span className="text-sm shrink-0 ml-2" style={{ color: 'var(--accent)' }}>
            {isExpanded ? '▾' : '▸'}
          </span>
        </div>

        {isExpanded && !isEditing && (
          <div className="mt-3 pt-3 animate-fade-in" style={{ borderTop: '1px solid var(--border)' }}>
            <p
              className="text-sm whitespace-pre-wrap m-0"
              style={{ color: 'var(--text)', lineHeight: '1.6', userSelect: 'text' }}
            >
              {feature.description || 'No description.'}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={startEdit}
                className="px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1"
                style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
              >
                <Pencil size={11} /> Edit
              </button>
              <button
                onClick={onDelete}
                className="px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1"
                style={{ background: 'var(--danger)', color: 'white', border: 'none' }}
              >
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </div>
        )}

        {isEditing && (
          <div className="mt-3 pt-3 flex flex-col gap-3 animate-fade-in" style={{ borderTop: '1px solid var(--border)' }}>
            <input
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)' }}
              placeholder="Title *"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              autoFocus
            />
            <input
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)' }}
              placeholder="Source (e.g., Racial, Class)"
              value={editSource}
              onChange={(e) => setEditSource(e.target.value)}
            />
            <textarea
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)', fontFamily: 'var(--sans)' }}
              placeholder="Description"
              rows={4}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
                Action Type
              </span>
              <ActionTypePicker value={editActionType} onChange={setEditActionType} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
                Uses per Rest (leave blank for unlimited)
              </span>
              <input
                type="number"
                className="w-24 px-3 py-2 rounded-lg text-sm outline-none text-center"
                style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)' }}
                placeholder="—"
                value={editMaxUses}
                onChange={(e) => setEditMaxUses(e.target.value)}
                min={1}
                max={99}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 rounded-lg text-sm cursor-pointer"
                style={{ color: 'var(--text)', background: 'transparent', border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 rounded-lg font-semibold text-sm cursor-pointer"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))', color: '#0f0e13', border: 'none' }}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

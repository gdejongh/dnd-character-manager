import { useState, useRef, useCallback } from 'react';
import type { FormEvent, TouchEvent as ReactTouchEvent } from 'react';
import type { InventoryItem, RechargeType } from '../types/database';
import { DAMAGE_TYPES, DAMAGE_TYPE_COLORS } from '../constants/dnd';
import { NumericInput } from './NumericInput';
import { Backpack, Trash2, Sparkles, ChevronDown, Shield } from 'lucide-react';

interface InventoryProps {
  items: InventoryItem[];
  strScore: number;
  onAdd: (name: string, quantity: number, weight: number, notes: string, maxCharges?: number | null, rechargeType?: RechargeType | null, resistances?: string[], immunities?: string[]) => void;
  onUpdate: (
    id: string,
    updates: Partial<Pick<InventoryItem, 'name' | 'quantity' | 'weight' | 'notes' | 'max_charges' | 'used_charges' | 'recharge_type' | 'resistances' | 'immunities'>>,
  ) => void;
  onDelete: (id: string) => void;
}

export function Inventory({ items, strScore, onAdd, onUpdate, onDelete }: InventoryProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [weight, setWeight] = useState('0');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Magic item fields
  const [isMagicItem, setIsMagicItem] = useState(false);
  const [maxCharges, setMaxCharges] = useState('');
  const [rechargeType, setRechargeType] = useState<RechargeType | null>(null);

  // Resistance/immunity fields
  const [showDefenses, setShowDefenses] = useState(false);
  const [resistances, setResistances] = useState<string[]>([]);
  const [immunities, setImmunities] = useState<string[]>([]);

  const carryCapacity = strScore * 15;
  const totalWeight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0);
  const isEncumbered = totalWeight > carryCapacity;

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const charges = isMagicItem && maxCharges ? parseInt(maxCharges) || null : null;
    const recharge = isMagicItem && charges ? rechargeType : null;
    onAdd(name.trim(), parseInt(quantity) || 1, parseFloat(weight) || 0, notes.trim(), charges, recharge, resistances, immunities);
    setName('');
    setQuantity('1');
    setWeight('0');
    setNotes('');
    setIsMagicItem(false);
    setMaxCharges('');
    setRechargeType(null);
    setShowDefenses(false);
    setResistances([]);
    setImmunities([]);
    setShowForm(false);
  }

  const inputStyle = {
    background: 'var(--code-bg)',
    color: 'var(--text-h)',
    border: '1px solid var(--border)',
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-4">
      {/* Weight Summary */}
      <div
        className="p-4 rounded-xl flex items-center justify-between"
        style={{
          border: isEncumbered ? '1px solid var(--danger)' : '1px solid var(--border)',
          background: isEncumbered
            ? 'rgba(185, 28, 28, 0.08)'
            : 'var(--bg-surface)',
        }}
      >
        <div className="flex items-center gap-3">
          <Backpack
            size={20}
            style={{ color: isEncumbered ? 'var(--danger-bright)' : 'var(--accent)' }}
          />
          <div>
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: 'var(--text)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}
            >
              Total Weight
            </span>
            <p
              className="text-lg font-bold m-0"
              style={{
                color: isEncumbered ? 'var(--danger-bright)' : 'var(--accent)',
                fontFamily: 'var(--mono)',
              }}
            >
              {totalWeight.toFixed(1)} lb
            </p>
          </div>
        </div>
        <div className="text-right">
          <span
            className="text-xs uppercase tracking-wider"
            style={{ color: 'var(--text)', fontFamily: 'var(--heading)', letterSpacing: '1px' }}
          >
            Carry Capacity
          </span>
          <p
            className="text-lg font-bold m-0"
            style={{ color: 'var(--text-h)', fontFamily: 'var(--mono)' }}
          >
            {carryCapacity} lb
          </p>
        </div>
      </div>

      {isEncumbered && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ background: 'rgba(185,28,28,0.15)', color: 'var(--danger-bright)', border: '1px solid rgba(185,28,28,0.3)' }}
        >
          Encumbered! Speed reduced by 10 ft.
        </div>
      )}

      {/* Item List — ledger style */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        {/* Table header */}
        <div
          className="grid px-4 py-2 text-[10px] uppercase tracking-widest"
          style={{
            gridTemplateColumns: '1fr 50px 60px',
            color: 'var(--accent)',
            fontFamily: 'var(--heading)',
            letterSpacing: '1.5px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--accent-bg)',
          }}
        >
          <span>Item</span>
          <span className="text-center">Qty</span>
          <span className="text-right">Weight</span>
        </div>

        {items.length === 0 && (
          <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text)' }}>
            No items yet. Add your first item!
          </div>
        )}

        {items.map((item) => (
          <InventoryRow
            key={item.id}
            item={item}
            isEditing={editingId === item.id}
            inputStyle={inputStyle}
            onEdit={() => setEditingId(item.id)}
            onDoneEdit={() => setEditingId(null)}
            onUpdate={onUpdate}
            onDelete={() => onDelete(item.id)}
          />
        ))}
      </div>

      {/* Add Item Form */}
      {showForm ? (
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 p-4 rounded-xl"
          style={{ border: '1px solid var(--accent-border)', background: 'var(--bg-surface)' }}
        >
          <input
            className="w-full px-4 py-3 rounded-lg text-sm outline-none"
            style={inputStyle}
            placeholder="Item name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <div className="flex gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}>Qty</label>
              <input
                className="w-16 px-2 py-2 rounded-lg text-sm text-center outline-none"
                style={inputStyle}
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}>Weight</label>
              <input
                className="w-20 px-2 py-2 rounded-lg text-sm text-center outline-none"
                style={inputStyle}
                type="number"
                min={0}
                step={0.1}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}>Notes</label>
              <input
                className="w-full px-2 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
                placeholder="Optional"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Magic Item Toggle */}
          <button
            type="button"
            onClick={() => setIsMagicItem(!isMagicItem)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer self-start"
            style={{
              background: isMagicItem ? 'var(--spell-bg)' : 'transparent',
              color: isMagicItem ? 'var(--spell-indigo)' : 'var(--text)',
              border: isMagicItem ? '1px solid var(--spell-border)' : '1px solid var(--border)',
            }}
          >
            <Sparkles size={12} />
            Charges
            <ChevronDown
              size={12}
              style={{
                transform: isMagicItem ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </button>

          {isMagicItem && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--spell-indigo)', fontFamily: 'var(--heading)' }}>Max Charges</label>
                <input
                  className="w-20 px-2 py-2 rounded-lg text-sm text-center outline-none"
                  style={inputStyle}
                  type="number"
                  min={1}
                  value={maxCharges}
                  onChange={(e) => setMaxCharges(e.target.value)}
                  placeholder="—"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--spell-indigo)', fontFamily: 'var(--heading)' }}>Recharges On</label>
                <select
                  className="px-2 py-2 rounded-lg text-sm outline-none cursor-pointer"
                  style={{ ...inputStyle, appearance: 'none' }}
                  value={rechargeType ?? ''}
                  onChange={(e) => setRechargeType((e.target.value || null) as RechargeType | null)}
                >
                  <option value="">No recharge</option>
                  <option value="short_rest">Short Rest</option>
                  <option value="long_rest">Long Rest</option>
                </select>
              </div>
            </div>
          )}

          {/* Resistances & Immunities Toggle */}
          <button
            type="button"
            onClick={() => setShowDefenses(!showDefenses)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer self-start"
            style={{
              background: showDefenses ? 'rgba(56,189,248,0.1)' : 'transparent',
              color: showDefenses ? '#38bdf8' : 'var(--text)',
              border: showDefenses ? '1px solid rgba(56,189,248,0.3)' : '1px solid var(--border)',
            }}
          >
            <Shield size={12} />
            Resistances / Immunities
            <ChevronDown
              size={12}
              style={{ transform: showDefenses ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            />
          </button>

          {showDefenses && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <DamageTypeTagPicker
                label="Resistances"
                labelColor="#38bdf8"
                selected={resistances}
                onChange={setResistances}
              />
              <DamageTypeTagPicker
                label="Immunities"
                labelColor="#fbbf24"
                selected={immunities}
                onChange={setImmunities}
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setShowForm(false); setIsMagicItem(false); setMaxCharges(''); setRechargeType(null); setShowDefenses(false); setResistances([]); setImmunities([]); }}
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
              Add Item
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl font-semibold text-sm cursor-pointer"
          style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
        >
          + Add Item
        </button>
      )}
      </div>
    </div>
  );
}

/* ── Charge Dots ── */
function ChargeDots({
  maxCharges,
  usedCharges,
  rechargeType,
  onToggle,
}: {
  maxCharges: number;
  usedCharges: number;
  rechargeType: RechargeType | null;
  onToggle: (newUsed: number) => void;
}) {
  const remaining = maxCharges - usedCharges;
  const restLabel = rechargeType === 'short_rest' ? 'SR' : rechargeType === 'long_rest' ? 'LR' : null;

  return (
    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
      {Array.from({ length: maxCharges }, (_, i) => {
        const isAvailable = i < remaining;
        return (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isAvailable) {
                // Use a charge (mark next available as used)
                onToggle(usedCharges + 1);
              } else {
                // Refund from the rightmost used
                onToggle(usedCharges - 1);
              }
            }}
            className="w-7 h-7 rounded-full cursor-pointer flex items-center justify-center transition-all"
            style={{
              background: isAvailable ? 'linear-gradient(135deg, var(--accent), var(--accent-bright))' : 'var(--bg-raised)',
              border: isAvailable ? '2px solid var(--accent)' : '2px solid var(--border)',
              boxShadow: isAvailable ? '0 0 6px rgba(201,168,76,0.4)' : 'none',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            aria-label={isAvailable ? `Use charge ${i + 1}` : `Restore charge ${i + 1}`}
          >
            <span style={{ color: isAvailable ? '#0f0e13' : 'var(--border-light)', fontSize: '11px', fontWeight: 'bold' }}>
              {isAvailable ? '◆' : '○'}
            </span>
          </button>
        );
      })}
      <span className="text-[10px] ml-0.5" style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>
        {remaining}/{maxCharges}
      </span>
      {restLabel && (
        <span
          className="text-[9px] px-1 py-0.5 rounded"
          style={{
            background: 'var(--spell-bg)',
            color: 'var(--spell-indigo)',
            border: '1px solid var(--spell-border)',
          }}
        >
          {restLabel}
        </span>
      )}
    </div>
  );
}

function InventoryRow({
  item,
  isEditing,
  inputStyle,
  onEdit,
  onDoneEdit,
  onUpdate,
  onDelete,
}: {
  item: InventoryItem;
  isEditing: boolean;
  inputStyle: React.CSSProperties;
  onEdit: () => void;
  onDoneEdit: () => void;
  onUpdate: InventoryProps['onUpdate'];
  onDelete: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const swipingRef = useRef(false);

  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = startXRef.current;
    swipingRef.current = true;
  }, []);

  const handleTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!swipingRef.current) return;
    const el = rowRef.current;
    if (!el) return;
    currentXRef.current = e.touches[0].clientX;
    const dx = currentXRef.current - startXRef.current;
    if (dx < 0) {
      el.style.transform = `translateX(${Math.max(dx, -100)}px)`;
      el.style.transition = 'none';
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!swipingRef.current) return;
    swipingRef.current = false;
    const el = rowRef.current;
    if (!el) return;
    const dx = currentXRef.current - startXRef.current;
    if (dx < -80) {
      el.style.transition = 'transform 0.2s ease-out';
      el.style.transform = 'translateX(-100%)';
      setTimeout(onDelete, 200);
    } else {
      el.style.transition = 'transform 0.2s ease-out';
      el.style.transform = 'translateX(0)';
    }
  }, [onDelete]);

  if (isEditing) {
    return (
      <div className="p-3 animate-fade-in" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
        <div className="flex flex-col gap-2">
          <input
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
            value={item.name}
            onChange={(e) => onUpdate(item.id, { name: e.target.value })}
            placeholder="Item name"
          />
          <div className="flex gap-2">
            <NumericInput
              className="w-16 px-2 py-2 rounded-lg text-sm text-center outline-none"
              style={inputStyle}
              min={0}
              value={item.quantity}
              onChange={(val) => onUpdate(item.id, { quantity: val })}
              placeholder="Qty"
            />
            <NumericInput
              className="w-20 px-2 py-2 rounded-lg text-sm text-center outline-none"
              style={inputStyle}
              min={0}
              step={0.1}
              value={item.weight}
              onChange={(val) => onUpdate(item.id, { weight: val })}
              placeholder="Wt"
            />
            <textarea
              className="flex-1 px-2 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ ...inputStyle, minHeight: '36px' }}
              rows={Math.min(6, Math.max(1, Math.ceil(item.notes.length / 40)))}
              value={item.notes}
              onChange={(e) => onUpdate(item.id, { notes: e.target.value })}
              placeholder="Notes"
            />
          </div>

          {/* Charges editing */}
          <div className="flex gap-2 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--spell-indigo)', fontFamily: 'var(--heading)' }}>Charges</label>
              <input
                className="w-16 px-2 py-2 rounded-lg text-sm text-center outline-none"
                style={inputStyle}
                type="number"
                min={0}
                value={item.max_charges ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : parseInt(e.target.value) || 0;
                  onUpdate(item.id, {
                    max_charges: val,
                    // Clear recharge_type if charges removed
                    ...(val === null || val === 0 ? { recharge_type: null, used_charges: 0 } : {}),
                  });
                }}
                placeholder="—"
              />
            </div>
            {item.max_charges != null && item.max_charges > 0 && (
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--spell-indigo)', fontFamily: 'var(--heading)' }}>Recharges On</label>
                <select
                  className="px-2 py-2 rounded-lg text-sm outline-none cursor-pointer"
                  style={{ ...inputStyle, appearance: 'none' }}
                  value={item.recharge_type ?? ''}
                  onChange={(e) => onUpdate(item.id, { recharge_type: (e.target.value || null) as RechargeType | null })}
                >
                  <option value="">No recharge</option>
                  <option value="short_rest">Short Rest</option>
                  <option value="long_rest">Long Rest</option>
                </select>
              </div>
            )}
          </div>

          {/* Resistances & Immunities editing */}
          <DamageTypeTagPicker
            label="Resistances"
            labelColor="#38bdf8"
            selected={item.resistances ?? []}
            onChange={(vals) => onUpdate(item.id, { resistances: vals })}
          />
          <DamageTypeTagPicker
            label="Immunities"
            labelColor="#fbbf24"
            selected={item.immunities ?? []}
            onChange={(vals) => onUpdate(item.id, { immunities: vals })}
          />

          <div className="flex gap-2">
            <button
              className="flex-1 py-2 rounded-lg text-sm cursor-pointer"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))', color: '#0f0e13', border: 'none' }}
              onClick={onDoneEdit}
            >
              Done
            </button>
            <button
              className="py-2 px-4 rounded-lg text-sm cursor-pointer flex items-center gap-1"
              style={{ background: 'var(--danger)', color: 'white', border: 'none' }}
              onClick={onDelete}
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden" style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        className="absolute inset-0 flex items-center justify-end px-4"
        style={{ background: 'var(--danger)' }}
      >
        <Trash2 size={16} style={{ color: 'white' }} />
      </div>
      <div
        ref={rowRef}
        className="grid items-center px-4 py-3 cursor-pointer relative"
        style={{ gridTemplateColumns: '1fr 50px 60px', background: 'var(--bg-surface)' }}
        onClick={onEdit}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onEdit()}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm block truncate" style={{ color: 'var(--text-h)' }}>
              {item.name}
            </span>
            {item.max_charges != null && item.max_charges > 0 && (
              <Sparkles size={11} style={{ color: 'var(--spell-indigo)', flexShrink: 0 }} />
            )}
          </div>
          {item.notes && (
            <span className="text-xs block mt-0.5" style={{ color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {item.notes}
            </span>
          )}
          {item.max_charges != null && item.max_charges > 0 && (
            <ChargeDots
              maxCharges={item.max_charges}
              usedCharges={item.used_charges}
              rechargeType={item.recharge_type}
              onToggle={(newUsed) => onUpdate(item.id, { used_charges: Math.max(0, Math.min(newUsed, item.max_charges!)) })}
            />
          )}
          {/* Resistance/Immunity tags */}
          <DefenseTags resistances={item.resistances} immunities={item.immunities} />
        </div>
        <span
          className="text-xs text-center font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
        >
          ×{item.quantity}
        </span>
        <span
          className="text-xs text-right shrink-0"
          style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}
        >
          {(item.weight * item.quantity).toFixed(1)} lb
        </span>
      </div>
    </div>
  );
}

/* ── Defense Tags Display ── */

function DefenseTags({ resistances, immunities }: { resistances?: string[]; immunities?: string[] }) {
  const hasResistances = resistances && resistances.length > 0;
  const hasImmunities = immunities && immunities.length > 0;
  if (!hasResistances && !hasImmunities) return null;

  return (
    <div className="flex items-center gap-1 mt-1 flex-wrap">
      {hasResistances && resistances.map((r) => (
        <span
          key={`res-${r}`}
          className="text-[9px] px-1.5 py-0.5 rounded-full"
          style={{
            background: `${DAMAGE_TYPE_COLORS[r] ?? 'var(--border)'}22`,
            color: DAMAGE_TYPE_COLORS[r] ?? 'var(--text)',
            border: `1px solid ${DAMAGE_TYPE_COLORS[r] ?? 'var(--border)'}44`,
            fontFamily: 'var(--heading)',
          }}
        >
          🛡️ {r}
        </span>
      ))}
      {hasImmunities && immunities.map((im) => (
        <span
          key={`imm-${im}`}
          className="text-[9px] px-1.5 py-0.5 rounded-full"
          style={{
            background: `${DAMAGE_TYPE_COLORS[im] ?? 'var(--border)'}22`,
            color: DAMAGE_TYPE_COLORS[im] ?? 'var(--text)',
            border: `1px solid ${DAMAGE_TYPE_COLORS[im] ?? 'var(--border)'}44`,
            fontFamily: 'var(--heading)',
            fontWeight: 700,
          }}
        >
          ⚡ {im}
        </span>
      ))}
    </div>
  );
}

/* ── Damage Type Tag Picker ── */

function DamageTypeTagPicker({
  label,
  labelColor,
  selected,
  onChange,
}: {
  label: string;
  labelColor: string;
  selected: string[];
  onChange: (vals: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-wider" style={{ color: labelColor, fontFamily: 'var(--heading)' }}>
        {label}
      </label>
      <div className="flex flex-wrap gap-1">
        {DAMAGE_TYPES.map((dt) => {
          const isActive = selected.includes(dt);
          const color = DAMAGE_TYPE_COLORS[dt] ?? 'var(--text)';
          return (
            <button
              key={dt}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(isActive ? selected.filter((s) => s !== dt) : [...selected, dt]);
              }}
              className="px-2 py-1 rounded-full text-[10px] cursor-pointer transition-all"
              style={{
                background: isActive ? `${color}22` : 'var(--code-bg)',
                color: isActive ? color : 'var(--text)',
                border: isActive ? `1px solid ${color}66` : '1px solid var(--border)',
                fontFamily: 'var(--heading)',
              }}
            >
              {dt.charAt(0).toUpperCase() + dt.slice(1)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

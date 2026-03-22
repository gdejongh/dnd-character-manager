import { useState, useRef, useCallback } from 'react';
import type { FormEvent, TouchEvent as ReactTouchEvent } from 'react';
import type { InventoryItem } from '../types/database';
import { NumericInput } from './NumericInput';
import { Backpack, Trash2 } from 'lucide-react';

interface InventoryProps {
  items: InventoryItem[];
  strScore: number;
  onAdd: (name: string, quantity: number, weight: number, notes: string) => void;
  onUpdate: (
    id: string,
    updates: Partial<Pick<InventoryItem, 'name' | 'quantity' | 'weight' | 'notes'>>,
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

  const carryCapacity = strScore * 15;
  const totalWeight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0);
  const isEncumbered = totalWeight > carryCapacity;

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), parseInt(quantity) || 1, parseFloat(weight) || 0, notes.trim());
    setName('');
    setQuantity('1');
    setWeight('0');
    setNotes('');
    setShowForm(false);
  }

  const inputStyle = {
    background: 'var(--code-bg)',
    color: 'var(--text-h)',
    border: '1px solid var(--border)',
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 animate-fade-in">
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
          ⚠️ Encumbered! Speed reduced by 10 ft.
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
            <input
              className="flex-1 px-2 py-2 rounded-lg text-sm outline-none"
              style={inputStyle}
              value={item.notes}
              onChange={(e) => onUpdate(item.id, { notes: e.target.value })}
              placeholder="Notes"
            />
          </div>
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
          <span className="font-medium text-sm block truncate" style={{ color: 'var(--text-h)' }}>
            {item.name}
          </span>
          {item.notes && (
            <span className="text-xs block mt-0.5 truncate" style={{ color: 'var(--text)' }}>
              {item.notes}
            </span>
          )}
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

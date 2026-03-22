import { useState } from 'react';
import type { FormEvent } from 'react';
import type { InventoryItem } from '../types/database';

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

export function Inventory({
  items,
  strScore,
  onAdd,
  onUpdate,
  onDelete,
}: InventoryProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [weight, setWeight] = useState('0');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const carryCapacity = strScore * 15;
  const totalWeight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0);

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
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Weight Summary */}
      <div
        className="p-4 rounded-xl flex items-center justify-between"
        style={{ border: '1px solid var(--border)' }}
      >
        <div>
          <span className="text-sm" style={{ color: 'var(--text)' }}>
            Total Weight
          </span>
          <p
            className="text-lg font-bold m-0"
            style={{
              color: totalWeight > carryCapacity ? '#ef4444' : 'var(--text-h)',
            }}
          >
            {totalWeight.toFixed(1)} lb
          </p>
        </div>
        <div className="text-right">
          <span className="text-sm" style={{ color: 'var(--text)' }}>
            Carry Capacity
          </span>
          <p className="text-lg font-bold m-0" style={{ color: 'var(--text-h)' }}>
            {carryCapacity} lb
          </p>
        </div>
      </div>

      {/* Item List */}
      {items.map((item) => (
        <div
          key={item.id}
          className="p-3 rounded-xl"
          style={{ border: '1px solid var(--border)' }}
        >
          {editingId === item.id ? (
            <div className="flex flex-col gap-2">
              <input
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
                value={item.name}
                onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                placeholder="Item name"
              />
              <div className="flex gap-2">
                <input
                  className="w-16 px-2 py-2 rounded-lg text-sm text-center outline-none"
                  style={inputStyle}
                  type="number"
                  min={0}
                  value={item.quantity}
                  onChange={(e) =>
                    onUpdate(item.id, {
                      quantity: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  placeholder="Qty"
                />
                <input
                  className="w-20 px-2 py-2 rounded-lg text-sm text-center outline-none"
                  style={inputStyle}
                  type="number"
                  min={0}
                  step={0.1}
                  value={item.weight}
                  onChange={(e) =>
                    onUpdate(item.id, {
                      weight: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
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
                  style={{ background: 'var(--accent)', color: 'white', border: 'none' }}
                  onClick={() => setEditingId(null)}
                >
                  Done
                </button>
                <button
                  className="py-2 px-4 rounded-lg text-sm cursor-pointer"
                  style={{ background: '#ef4444', color: 'white', border: 'none' }}
                  onClick={() => {
                    onDelete(item.id);
                    setEditingId(null);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setEditingId(item.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setEditingId(item.id)}
            >
              <div className="flex-1 min-w-0">
                <span
                  className="font-medium text-sm block"
                  style={{ color: 'var(--text-h)' }}
                >
                  {item.name}
                </span>
                {item.notes && (
                  <span
                    className="text-xs block mt-0.5 truncate"
                    style={{ color: 'var(--text)' }}
                  >
                    {item.notes}
                  </span>
                )}
              </div>
              <span
                className="text-xs shrink-0 px-2 py-0.5 rounded-full"
                style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
              >
                ×{item.quantity}
              </span>
              <span
                className="text-xs shrink-0"
                style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}
              >
                {(item.weight * item.quantity).toFixed(1)} lb
              </span>
            </div>
          )}
        </div>
      ))}

      {items.length === 0 && !showForm && (
        <p className="text-center py-8" style={{ color: 'var(--text)' }}>
          No items yet. Add your first item!
        </p>
      )}

      {/* Add Item Form */}
      {showForm ? (
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 p-4 rounded-xl"
          style={{ border: '1px solid var(--accent-border)' }}
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
              <label className="text-xs" style={{ color: 'var(--text)' }}>
                Qty
              </label>
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
              <label className="text-xs" style={{ color: 'var(--text)' }}>
                Weight
              </label>
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
              <label className="text-xs" style={{ color: 'var(--text)' }}>
                Notes
              </label>
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
              style={{
                color: 'var(--text)',
                background: 'transparent',
                border: '1px solid var(--border)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-lg font-semibold text-white text-sm cursor-pointer"
              style={{ background: 'var(--accent)', border: 'none' }}
            >
              Add Item
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl font-semibold text-sm cursor-pointer"
          style={{
            background: 'var(--accent-bg)',
            color: 'var(--accent)',
            border: '1px solid var(--accent-border)',
          }}
        >
          + Add Item
        </button>
      )}
    </div>
  );
}

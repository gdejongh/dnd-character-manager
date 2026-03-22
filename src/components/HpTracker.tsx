import { useState } from 'react';
import type { Character } from '../types/database';
import { NumericInput } from './NumericInput';

interface HpTrackerProps {
  character: Character;
  onUpdate: (
    updates: Partial<Pick<Character, 'current_hp' | 'max_hp' | 'temp_hp'>>,
  ) => void;
}

export function HpTracker({ character, onUpdate }: HpTrackerProps) {
  const [customAmount, setCustomAmount] = useState('');
  const [editingMax, setEditingMax] = useState(false);
  const [editingTemp, setEditingTemp] = useState(false);

  function adjustHp(amount: number) {
    if (amount < 0) {
      let remaining = Math.abs(amount);
      let newTemp = character.temp_hp;
      let newCurrent = character.current_hp;

      if (newTemp > 0) {
        if (remaining <= newTemp) {
          newTemp -= remaining;
          remaining = 0;
        } else {
          remaining -= newTemp;
          newTemp = 0;
        }
      }
      newCurrent = Math.max(0, newCurrent - remaining);
      onUpdate({ current_hp: newCurrent, temp_hp: newTemp });
    } else {
      const newHp = Math.min(character.max_hp, character.current_hp + amount);
      onUpdate({ current_hp: newHp });
    }
  }

  function handleCustomAction(heal: boolean) {
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    adjustHp(heal ? amount : -amount);
    setCustomAmount('');
  }

  const hpPercent =
    character.max_hp > 0 ? (character.current_hp / character.max_hp) * 100 : 0;
  const hpColor = hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#f59e0b' : '#ef4444';

  const btnBase =
    'flex items-center justify-center rounded-xl font-bold text-lg cursor-pointer active:scale-95 transition-transform';

  return (
    <div className="flex flex-col items-center gap-6 p-4 pb-24">
      {/* HP Display */}
      <div className="flex flex-col items-center gap-2 w-full">
        <span
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text)' }}
        >
          Hit Points
        </span>
        <div className="flex items-baseline gap-2">
          <span
            className="text-6xl font-bold"
            style={{ color: hpColor, fontFamily: 'var(--mono)' }}
          >
            {character.current_hp}
          </span>
          <span className="text-2xl" style={{ color: 'var(--text)' }}>
            /
          </span>
          <span
            className="text-2xl font-bold"
            style={{ color: 'var(--text-h)', fontFamily: 'var(--mono)' }}
          >
            {character.max_hp}
          </span>
        </div>

        {/* HP Bar */}
        <div
          className="w-full h-4 rounded-full overflow-hidden"
          style={{ background: 'var(--border)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, hpPercent)}%`,
              background: hpColor,
            }}
          />
        </div>
      </div>

      {/* Quick ±  Buttons */}
      <div className="grid grid-cols-4 gap-3 w-full">
        <button
          className={btnBase}
          style={{ background: '#ef4444', color: 'white', border: 'none', minHeight: '56px' }}
          onClick={() => adjustHp(-5)}
        >
          −5
        </button>
        <button
          className={btnBase}
          style={{ background: '#ef4444', color: 'white', border: 'none', minHeight: '56px' }}
          onClick={() => adjustHp(-1)}
        >
          −1
        </button>
        <button
          className={btnBase}
          style={{ background: '#22c55e', color: 'white', border: 'none', minHeight: '56px' }}
          onClick={() => adjustHp(1)}
        >
          +1
        </button>
        <button
          className={btnBase}
          style={{ background: '#22c55e', color: 'white', border: 'none', minHeight: '56px' }}
          onClick={() => adjustHp(5)}
        >
          +5
        </button>
      </div>

      {/* Custom Amount */}
      <div className="flex gap-3 w-full">
        <input
          type="number"
          placeholder="Amount"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          min={1}
          className="flex-1 px-4 py-3 rounded-xl text-center text-lg outline-none"
          style={{
            background: 'var(--code-bg)',
            color: 'var(--text-h)',
            border: '1px solid var(--border)',
          }}
        />
        <button
          className="px-5 py-3 rounded-xl font-semibold text-white cursor-pointer active:scale-95 transition-transform"
          style={{ background: '#ef4444', border: 'none' }}
          onClick={() => handleCustomAction(false)}
        >
          Damage
        </button>
        <button
          className="px-5 py-3 rounded-xl font-semibold text-white cursor-pointer active:scale-95 transition-transform"
          style={{ background: '#22c55e', border: 'none' }}
          onClick={() => handleCustomAction(true)}
        >
          Heal
        </button>
      </div>

      {/* Temp HP */}
      <div
        className="w-full p-4 rounded-xl"
        style={{ border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Temporary HP
          </span>
          {editingTemp ? (
            <div className="flex items-center gap-2">
              <NumericInput
                min={0}
                value={character.temp_hp}
                onChange={(val) => onUpdate({ temp_hp: val })}
                className="w-20 px-2 py-1 rounded-lg text-center outline-none"
                style={{
                  background: 'var(--code-bg)',
                  color: 'var(--text-h)',
                  border: '1px solid var(--border)',
                }}
                autoFocus
              />
              <button
                className="px-3 py-1 rounded-lg text-sm cursor-pointer"
                style={{ background: 'var(--accent)', color: 'white', border: 'none' }}
                onClick={() => setEditingTemp(false)}
              >
                Done
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingTemp(true)}
              className="text-lg font-bold cursor-pointer bg-transparent"
              style={{
                color: 'var(--accent)',
                border: 'none',
                fontFamily: 'var(--mono)',
              }}
            >
              {character.temp_hp}
            </button>
          )}
        </div>
      </div>

      {/* Max HP */}
      <div
        className="w-full p-4 rounded-xl"
        style={{ border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Max HP
          </span>
          {editingMax ? (
            <div className="flex items-center gap-2">
              <NumericInput
                min={1}
                value={character.max_hp}
                onChange={(val) =>
                  onUpdate({
                    max_hp: val,
                    current_hp: Math.min(character.current_hp, val),
                  })
                }
                className="w-20 px-2 py-1 rounded-lg text-center outline-none"
                style={{
                  background: 'var(--code-bg)',
                  color: 'var(--text-h)',
                  border: '1px solid var(--border)',
                }}
                autoFocus
              />
              <button
                className="px-3 py-1 rounded-lg text-sm cursor-pointer"
                style={{ background: 'var(--accent)', color: 'white', border: 'none' }}
                onClick={() => setEditingMax(false)}
              >
                Done
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingMax(true)}
              className="text-lg font-bold cursor-pointer bg-transparent"
              style={{
                color: 'var(--accent)',
                border: 'none',
                fontFamily: 'var(--mono)',
              }}
            >
              {character.max_hp}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

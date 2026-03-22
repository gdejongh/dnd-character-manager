import type { ActionType } from '../types/database';
import { ACTION_TYPE_OPTIONS, ACTION_TYPE_MAP } from '../constants/actionTypes';
import type { ActionTypeFilter } from '../constants/actionTypes';

export function ActionTypeBadge({ type, small }: { type: ActionType; small?: boolean }) {
  const opt = ACTION_TYPE_MAP[type] ?? ACTION_TYPE_MAP['other'];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold shrink-0 ${small ? 'text-[9px] px-1.5 py-0' : 'text-[10px] px-2 py-0.5'}`}
      style={{
        color: opt.color,
        background: `${opt.color}18`,
        border: `1px solid ${opt.color}40`,
        fontFamily: 'var(--heading)',
        letterSpacing: '0.3px',
        lineHeight: small ? '16px' : '18px',
      }}
    >
      {opt.label}
    </span>
  );
}

export function ActionTypePicker({
  value,
  onChange,
}: {
  value: ActionType;
  onChange: (v: ActionType) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {ACTION_TYPE_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
            style={{
              background: active ? `${opt.color}25` : 'var(--code-bg)',
              color: active ? opt.color : 'var(--text)',
              border: active ? `2px solid ${opt.color}80` : '1px solid var(--border)',
              fontFamily: 'var(--heading)',
              letterSpacing: '0.3px',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ActionTypeFilterBar({
  value,
  onChange,
  counts,
}: {
  value: ActionTypeFilter;
  onChange: (v: ActionTypeFilter) => void;
  counts?: Record<ActionTypeFilter, number>;
}) {
  const options: { value: ActionTypeFilter; label: string; color: string }[] = [
    { value: 'all', label: 'All', color: 'var(--accent)' },
    ...ACTION_TYPE_OPTIONS,
  ];

  return (
    <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      {options.map((opt) => {
        const active = value === opt.value;
        const count = counts?.[opt.value];
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all shrink-0 flex items-center gap-1"
            style={{
              background: active ? `${opt.color}20` : 'transparent',
              color: active ? opt.color : 'var(--text)',
              border: active ? `1px solid ${opt.color}60` : '1px solid transparent',
              fontFamily: 'var(--heading)',
              letterSpacing: '0.3px',
            }}
          >
            {opt.label}
            {count !== undefined && (
              <span
                className="text-[9px] font-mono"
                style={{ opacity: 0.7 }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

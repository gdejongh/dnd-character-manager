import type { ActionType } from '../types/database';

export const ACTION_TYPE_OPTIONS: { value: ActionType; label: string; short: string; color: string }[] = [
  { value: 'action', label: 'Action', short: 'A', color: '#22c55e' },
  { value: 'bonus_action', label: 'Bonus Action', short: 'BA', color: '#f59e0b' },
  { value: 'reaction', label: 'Reaction', short: 'R', color: '#6366f1' },
  { value: 'other', label: 'Other', short: '—', color: 'var(--text)' },
];

export const ACTION_TYPE_MAP = Object.fromEntries(ACTION_TYPE_OPTIONS.map((o) => [o.value, o])) as Record<
  ActionType,
  (typeof ACTION_TYPE_OPTIONS)[number]
>;

export type ActionTypeFilter = ActionType | 'all';

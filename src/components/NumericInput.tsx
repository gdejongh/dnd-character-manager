import { useState } from 'react';

interface NumericInputProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * A number input that holds a local string draft while focused, so the field
 * can be fully cleared before typing a new value. Commits (clamped) on blur.
 */
export function NumericInput({
  value,
  min,
  max,
  step,
  onChange,
  className,
  style,
  placeholder,
  autoFocus,
}: NumericInputProps) {
  const [draft, setDraft] = useState<string | null>(null);

  function clamp(n: number): number {
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    return n;
  }

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={draft ?? value}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={className}
      style={style}
      onFocus={() => setDraft(String(value))}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const parsed = step && step < 1
          ? parseFloat(draft ?? '')
          : parseInt(draft ?? '', 10);
        if (!isNaN(parsed)) onChange(clamp(parsed));
        setDraft(null);
      }}
    />
  );
}

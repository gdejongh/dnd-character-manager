import { useState } from 'react';
import type { FormEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function TagEditor({ tags, onChange, placeholder = 'Add…', readOnly }: TagEditorProps) {
  const [input, setInput] = useState('');

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const val = input.trim();
    if (!val || tags.some((t) => t.toLowerCase() === val.toLowerCase())) return;
    onChange([...tags, val].sort((a, b) => a.localeCompare(b)));
    setInput('');
  }

  function handleRemove(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="flex flex-col gap-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                background: 'var(--bg-raised)',
                color: 'var(--text-h)',
                border: '1px solid var(--border)',
              }}
            >
              {tag}
              {!readOnly && (
                <button
                  onClick={() => handleRemove(tag)}
                  className="ml-0.5 p-0 bg-transparent cursor-pointer flex items-center"
                  style={{ color: 'var(--text-dim)', border: 'none' }}
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      {!readOnly && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: 'var(--code-bg)',
              color: 'var(--text-h)',
              border: '1px solid var(--border)',
              minWidth: 0,
            }}
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
            style={{
              background: input.trim() ? 'var(--accent-bg)' : 'var(--bg-raised)',
              color: input.trim() ? 'var(--accent)' : 'var(--text-dim)',
              border: `1px solid ${input.trim() ? 'var(--accent-border)' : 'var(--border)'}`,
            }}
          >
            <Plus size={14} />
            Add
          </button>
        </form>
      )}
    </div>
  );
}

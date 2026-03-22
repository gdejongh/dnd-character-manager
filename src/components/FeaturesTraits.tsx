import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Feature } from '../types/database';

interface FeaturesTraitsProps {
  features: Feature[];
  onAdd: (title: string, description: string, source: string) => void;
  onDelete: (id: string) => void;
}

export function FeaturesTraits({ features, onAdd, onDelete }: FeaturesTraitsProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), description.trim(), source.trim());
    setTitle('');
    setDescription('');
    setSource('');
    setShowForm(false);
  }

  const inputStyle = {
    background: 'var(--code-bg)',
    color: 'var(--text-h)',
    border: '1px solid var(--border)',
  };

  return (
    <div className="flex flex-col gap-3 p-4 pb-24">
      <h3
        className="text-sm font-semibold uppercase tracking-wider m-0"
        style={{ color: 'var(--text)' }}
      >
        Features &amp; Traits
      </h3>

      {features.map((feature) => (
        <div
          key={feature.id}
          className="p-4 rounded-xl"
          style={{ border: '1px solid var(--border)' }}
        >
          <div
            className="flex items-start justify-between cursor-pointer"
            onClick={() =>
              setExpandedId(expandedId === feature.id ? null : feature.id)
            }
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              setExpandedId(expandedId === feature.id ? null : feature.id)
            }
          >
            <div className="flex-1">
              <h4
                className="font-semibold text-sm m-0"
                style={{ color: 'var(--text-h)' }}
              >
                {feature.title}
              </h4>
              {feature.source && (
                <span
                  className="text-xs mt-0.5 inline-block"
                  style={{ color: 'var(--accent)' }}
                >
                  {feature.source}
                </span>
              )}
            </div>
            <span className="text-sm shrink-0 ml-2" style={{ color: 'var(--text)' }}>
              {expandedId === feature.id ? '▾' : '▸'}
            </span>
          </div>

          {expandedId === feature.id && (
            <div
              className="mt-3 pt-3"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <p
                className="text-sm whitespace-pre-wrap m-0"
                style={{ color: 'var(--text)' }}
              >
                {feature.description || 'No description.'}
              </p>
              <button
                onClick={() => onDelete(feature.id)}
                className="mt-3 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                style={{ background: '#ef4444', color: 'white', border: 'none' }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}

      {features.length === 0 && !showForm && (
        <p className="text-center py-8" style={{ color: 'var(--text)' }}>
          No features or traits yet.
        </p>
      )}

      {showForm ? (
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 p-4 rounded-xl"
          style={{ border: '1px solid var(--accent-border)' }}
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
              Add Feature
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
          + Add Feature
        </button>
      )}
    </div>
  );
}

import { useState } from 'react';
import { X, Check, Palette } from 'lucide-react';
import { THEMES } from '../constants/themes';
import type { ThemeId } from '../constants/themes';

interface ThemePickerProps {
  currentTheme: ThemeId | string | null;
  onSelect: (themeId: ThemeId) => void;
  onClose: () => void;
}

export function ThemePicker({ currentTheme, onSelect, onClose }: ThemePickerProps) {
  const [previewTheme, setPreviewTheme] = useState<ThemeId | null>(null);
  const activeTheme = currentTheme ?? 'dark-fantasy';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl animate-fade-in"
        style={{
          background: 'var(--bg-raised)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-4"
          style={{
            background: 'var(--bg-raised)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-2">
            <Palette size={18} style={{ color: 'var(--accent)' }} />
            <h2
              className="m-0 text-sm"
              style={{
                fontFamily: 'var(--heading)',
                color: 'var(--accent)',
                letterSpacing: '1px',
              }}
            >
              CHARACTER THEME
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg cursor-pointer bg-transparent"
            style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Theme Grid */}
        <div className="p-4 grid grid-cols-2 gap-3">
          {THEMES.map((theme) => {
            const isActive = theme.id === activeTheme;
            const isPreview = theme.id === previewTheme;
            return (
              <button
                key={theme.id}
                onClick={() => onSelect(theme.id)}
                onMouseEnter={() => setPreviewTheme(theme.id)}
                onMouseLeave={() => setPreviewTheme(null)}
                className="relative flex flex-col rounded-xl cursor-pointer text-left overflow-hidden transition-transform active:scale-[0.97]"
                style={{
                  border: isActive
                    ? `2px solid ${theme.colors.accent}`
                    : isPreview
                      ? `2px solid ${theme.colors.accentBorder}`
                      : `2px solid ${theme.colors.border}`,
                  background: theme.colors.bg,
                }}
              >
                {/* Color preview bar */}
                <div className="flex h-2">
                  <div className="flex-1" style={{ background: theme.colors.accent }} />
                  <div className="flex-1" style={{ background: theme.colors.accentBright }} />
                  <div className="flex-1" style={{ background: theme.colors.spellIndigo }} />
                  <div className="flex-1" style={{ background: theme.colors.spellViolet }} />
                </div>

                {/* Preview area */}
                <div className="p-3">
                  {/* Theme name in its own heading font */}
                  <p
                    className="text-sm font-semibold m-0 leading-tight"
                    style={{
                      color: theme.colors.accent,
                      fontFamily: theme.fonts.heading,
                      letterSpacing: '0.5px',
                      fontSize: undefined,
                    }}
                  >
                    {theme.name}
                  </p>
                  <p
                    className="text-xs mt-1 m-0 leading-snug"
                    style={{ color: theme.colors.text }}
                  >
                    {theme.description}
                  </p>

                  {/* Mini UI preview */}
                  <div className="mt-2 flex gap-1.5">
                    <div
                      className="h-5 flex-1 rounded"
                      style={{
                        background: theme.colors.bgRaised,
                        border: `1px solid ${theme.colors.border}`,
                      }}
                    />
                    <div
                      className="h-5 w-8 rounded"
                      style={{
                        background: theme.colors.accentBg,
                        border: `1px solid ${theme.colors.accentBorder}`,
                      }}
                    />
                  </div>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: theme.colors.accent }}
                  >
                    <Check
                      size={12}
                      style={{
                        color: theme.id === 'divine-radiance' ? '#fff' : theme.colors.bg,
                      }}
                      strokeWidth={3}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Small button to open the theme picker — used in character headers */
export function ThemePickerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2.5 rounded-lg bg-transparent cursor-pointer"
      style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
      aria-label="Change theme"
      title="Change theme"
    >
      <Palette size={16} />
    </button>
  );
}

import { useState, useEffect, useRef } from 'react';
import { CONDITIONS } from '../constants/dnd';
import { RULE_SECTIONS } from '../constants/rulesReference';
import { Search, X, ChevronDown, ChevronRight } from 'lucide-react';

interface QuickReferenceProps {
  onClose: () => void;
}

export function QuickReference({ onClose }: QuickReferenceProps) {
  const [search, setSearch] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Conditions', 'Combat Actions', 'Common Rules']));
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const q = search.toLowerCase();

  function toggleSection(title: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  function toggleEntry(key: string) {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filteredConditions = CONDITIONS.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
  );

  const filteredSections = RULE_SECTIONS.map((section) => ({
    ...section,
    entries: section.entries.filter(
      (e) => !q || e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q),
    ),
  })).filter((s) => s.entries.length > 0);

  const hasConditions = filteredConditions.length > 0;
  const hasResults = hasConditions || filteredSections.length > 0;

  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) focusable[0].focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    dialog.addEventListener('keydown', trap);
    return () => dialog.removeEventListener('keydown', trap);
  }, []);

  return (
    <>
      <div className="hidden lg:block fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Quick Reference"
        className="fixed inset-0 z-50 flex flex-col lg:inset-auto lg:top-0 lg:right-0 lg:bottom-0 lg:left-auto lg:w-full lg:max-w-[600px] lg:shadow-2xl"
        style={{ background: 'var(--bg)' }}
      >
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{
          background: 'linear-gradient(180deg, var(--bg) 0%, rgba(15,14,19,0.95) 100%)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h2
          className="flex-1 m-0 text-base"
          style={{ fontFamily: 'var(--heading)', color: 'var(--accent)', letterSpacing: '0.5px' }}
        >
          📖 Quick Reference
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-transparent cursor-pointer"
          style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          <X size={16} />
        </button>
      </header>

      {/* Search */}
      <div className="px-4 pt-3 pb-1 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--accent)' }} />
          <input
            type="text"
            placeholder="Search rules, conditions, actions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--code-bg)',
              color: 'var(--text-h)',
              border: '1px solid var(--accent-border)',
            }}
            autoFocus
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer"
              style={{ color: 'var(--text)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 pb-8">
        {!hasResults && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <span style={{ fontSize: '32px' }}>🔍</span>
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              No results for "{search}"
            </p>
          </div>
        )}

        {/* Conditions Section */}
        {hasConditions && (
          <section
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--accent-border)', background: 'var(--bg-surface)' }}
          >
            <button
              onClick={() => toggleSection('Conditions')}
              className="w-full flex items-center gap-2 px-4 py-3 bg-transparent border-none cursor-pointer text-left"
              style={{
                background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03))',
                borderBottom: expandedSections.has('Conditions') ? '1px solid var(--accent-border)' : 'none',
              }}
            >
              <span style={{ fontSize: '14px' }}>🎭</span>
              <span
                className="flex-1 font-semibold text-sm"
                style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}
              >
                Conditions ({filteredConditions.length})
              </span>
              {expandedSections.has('Conditions') ? (
                <ChevronDown size={14} style={{ color: 'var(--accent)' }} />
              ) : (
                <ChevronRight size={14} style={{ color: 'var(--accent)' }} />
              )}
            </button>

            {expandedSections.has('Conditions') && (
              <div className="p-3 flex flex-col gap-1">
                {filteredConditions.map((cond) => {
                  const key = `cond-${cond.name}`;
                  const isOpen = expandedEntries.has(key);
                  return (
                    <button
                      key={cond.name}
                      onClick={() => toggleEntry(key)}
                      className="w-full text-left bg-transparent border-none cursor-pointer rounded-lg p-0"
                    >
                      <div
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors"
                        style={{
                          background: isOpen ? 'var(--bg-raised)' : 'transparent',
                        }}
                      >
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                          style={{ background: `${cond.color}20`, fontSize: '13px' }}
                        >
                          {cond.icon}
                        </span>
                        <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-h)' }}>
                          {cond.name}
                        </span>
                        {isOpen ? (
                          <ChevronDown size={12} style={{ color: 'var(--text)' }} />
                        ) : (
                          <ChevronRight size={12} style={{ color: 'var(--text)' }} />
                        )}
                      </div>
                      {isOpen && (
                        <div className="px-3 pb-2.5 pl-12">
                          <p className="text-xs leading-relaxed m-0" style={{ color: 'var(--text)' }}>
                            {cond.description}
                          </p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Rule Sections */}
        {filteredSections.map((section) => (
          <section
            key={section.title}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
          >
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center gap-2 px-4 py-3 bg-transparent border-none cursor-pointer text-left"
              style={{
                background: 'linear-gradient(135deg, var(--bg-raised), var(--bg-surface))',
                borderBottom: expandedSections.has(section.title) ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: '14px' }}>{section.emoji}</span>
              <span
                className="flex-1 font-semibold text-sm"
                style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}
              >
                {section.title} ({section.entries.length})
              </span>
              {expandedSections.has(section.title) ? (
                <ChevronDown size={14} style={{ color: 'var(--text)' }} />
              ) : (
                <ChevronRight size={14} style={{ color: 'var(--text)' }} />
              )}
            </button>

            {expandedSections.has(section.title) && (
              <div className="p-3 flex flex-col gap-1">
                {section.entries.map((entry) => {
                  const key = `${section.title}-${entry.name}`;
                  const isOpen = expandedEntries.has(key);
                  return (
                    <button
                      key={entry.name}
                      onClick={() => toggleEntry(key)}
                      className="w-full text-left bg-transparent border-none cursor-pointer rounded-lg p-0"
                    >
                      <div
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors"
                        style={{
                          background: isOpen ? 'var(--bg-raised)' : 'transparent',
                        }}
                      >
                        <span className="text-sm shrink-0" style={{ fontSize: '14px' }}>
                          {entry.icon}
                        </span>
                        <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-h)' }}>
                          {entry.name}
                        </span>
                        {isOpen ? (
                          <ChevronDown size={12} style={{ color: 'var(--text)' }} />
                        ) : (
                          <ChevronRight size={12} style={{ color: 'var(--text)' }} />
                        )}
                      </div>
                      {isOpen && (
                        <div className="px-3 pb-2.5 pl-10">
                          <p className="text-xs leading-relaxed m-0" style={{ color: 'var(--text)' }}>
                            {entry.description}
                          </p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </main>
      </div>
    </>
  );
}

import type { Tab } from '../types/database';
import { Shield, Heart, Sparkles, Backpack, Swords, ScrollText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'sheet', label: 'Sheet', Icon: Shield },
  { id: 'hp', label: 'HP', Icon: Heart },
  { id: 'spells', label: 'Spells', Icon: Sparkles },
  { id: 'items', label: 'Items', Icon: Backpack },
  { id: 'features', label: 'Traits', Icon: Swords },
  { id: 'notes', label: 'Notes', Icon: ScrollText },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-stretch z-20"
      style={{
        background: 'linear-gradient(180deg, #1c1b25 0%, #13121a 100%)',
        borderTop: '2px solid var(--border)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Decorative top border with gold accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, var(--accent-border) 30%, var(--accent) 50%, var(--accent-border) 70%, transparent 100%)',
        }}
      />
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 bg-transparent border-none cursor-pointer transition-colors relative"
            style={{ minHeight: '56px' }}
          >
            {isActive && (
              <div
                className="absolute top-0 left-2 right-2 h-0.5 rounded-full"
                style={{ background: 'var(--accent)' }}
              />
            )}
            <tab.Icon
              size={20}
              style={{
                color: isActive ? 'var(--accent)' : 'var(--text)',
                filter: isActive ? 'drop-shadow(0 0 4px rgba(201,168,76,0.4))' : 'none',
                transition: 'color 0.2s, filter 0.2s',
              }}
            />
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: isActive ? 'var(--accent)' : 'var(--text)',
                fontFamily: 'var(--heading)',
                letterSpacing: '0.5px',
                transition: 'color 0.2s',
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

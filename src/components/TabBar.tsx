import type { Tab } from '../types/database';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'sheet', label: 'Sheet', icon: '📊' },
  { id: 'hp', label: 'HP', icon: '❤️' },
  { id: 'spells', label: 'Spells', icon: '✨' },
  { id: 'items', label: 'Items', icon: '🎒' },
  { id: 'features', label: 'Traits', icon: '⚔️' },
  { id: 'notes', label: 'Notes', icon: '📝' },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-stretch z-20"
      style={{
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 bg-transparent border-none cursor-pointer"
            style={{
              minHeight: '56px',
              color: isActive ? 'var(--accent)' : 'var(--text)',
              borderTop: isActive
                ? '2px solid var(--accent)'
                : '2px solid transparent',
            }}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: 500 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

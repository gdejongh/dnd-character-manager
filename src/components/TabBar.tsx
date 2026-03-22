import type { Tab } from '../types/database';
import { Shield, Heart, Sparkles, Backpack, Swords, ScrollText, FlameKindling } from 'lucide-react';
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
  const isCombatActive = activeTab === 'combat';

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
          background: isCombatActive
            ? 'linear-gradient(90deg, transparent 0%, rgba(220,38,38,0.4) 30%, rgba(220,38,38,0.8) 50%, rgba(220,38,38,0.4) 70%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, var(--accent-border) 30%, var(--accent) 50%, var(--accent-border) 70%, transparent 100%)',
        }}
      />

      {/* Regular tabs - first 3 */}
      {TABS.slice(0, 3).map((tab) => (
        <TabButton key={tab.id} tab={tab} isActive={activeTab === tab.id} onTabChange={onTabChange} />
      ))}

      {/* Combat tab - special center button */}
      <button
        onClick={() => onTabChange('combat')}
        className="flex flex-col items-center justify-center bg-transparent border-none cursor-pointer relative"
        style={{ minHeight: '56px', flex: '1.3' }}
      >
        {/* Raised circle */}
        <div
          className="relative flex items-center justify-center rounded-full -mt-5"
          style={{
            width: '48px',
            height: '48px',
            background: isCombatActive
              ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
              : 'linear-gradient(135deg, #991b1b, #7f1d1d)',
            boxShadow: isCombatActive
              ? '0 0 20px rgba(220,38,38,0.5), 0 0 40px rgba(220,38,38,0.2), inset 0 1px 0 rgba(255,255,255,0.15)'
              : '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            border: `2px solid ${isCombatActive ? '#ef4444' : '#991b1b'}`,
            transition: 'all 0.3s ease',
            animation: isCombatActive ? 'combatPulse 2s ease-in-out infinite' : undefined,
          }}
        >
          <FlameKindling
            size={22}
            style={{
              color: isCombatActive ? '#fff' : '#ef4444',
              filter: isCombatActive ? 'drop-shadow(0 0 6px rgba(255,255,255,0.4))' : 'drop-shadow(0 0 4px rgba(239,68,68,0.5))',
            }}
          />
        </div>
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            color: isCombatActive ? '#ef4444' : '#dc2626',
            fontFamily: 'var(--heading)',
            letterSpacing: '1px',
            marginTop: '2px',
          }}
        >
          COMBAT
        </span>
      </button>

      {/* Regular tabs - last 3 */}
      {TABS.slice(3).map((tab) => (
        <TabButton key={tab.id} tab={tab} isActive={activeTab === tab.id} onTabChange={onTabChange} />
      ))}
    </nav>
  );
}

function TabButton({
  tab,
  isActive,
  onTabChange,
}: {
  tab: { id: Tab; label: string; Icon: LucideIcon };
  isActive: boolean;
  onTabChange: (tab: Tab) => void;
}) {
  return (
    <button
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
        size={18}
        style={{
          color: isActive ? 'var(--accent)' : 'var(--text)',
          filter: isActive ? 'drop-shadow(0 0 4px rgba(201,168,76,0.4))' : 'none',
          transition: 'color 0.2s, filter 0.2s',
        }}
      />
      <span
        style={{
          fontSize: '9px',
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
}

import { useState } from 'react';
import type { Character, CampaignCharacterRole } from '../types/database';
import type { CampaignCharacterWithDetails } from '../hooks/useCampaignView';
import { ArrowLeft, Copy, Search, Plus, X, Heart, Shield, Users, Skull, MessageCircle } from 'lucide-react';
import { showToast } from '../lib/toast';

const ROLE_CONFIG: Record<CampaignCharacterRole, { label: string; color: string; bg: string; border: string; icon: typeof Shield }> = {
  party: {
    label: 'Party',
    color: 'var(--accent)',
    bg: 'rgba(201,168,76,0.10)',
    border: 'rgba(201,168,76,0.30)',
    icon: Shield,
  },
  ally: {
    label: 'Allies',
    color: '#4ade80',
    bg: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.30)',
    icon: Users,
  },
  enemy: {
    label: 'Enemies',
    color: 'var(--danger-bright)',
    bg: 'rgba(239,68,68,0.10)',
    border: 'rgba(239,68,68,0.30)',
    icon: Skull,
  },
  npc: {
    label: 'NPCs',
    color: '#a78bfa',
    bg: 'rgba(147,130,220,0.10)',
    border: 'rgba(147,130,220,0.30)',
    icon: MessageCircle,
  },
};

const ROLE_ORDER: CampaignCharacterRole[] = ['party', 'ally', 'enemy', 'npc'];

interface CampaignViewProps {
  campaignName: string;
  joinCode: string;
  isDM: boolean;
  userId: string;
  partyCharacters: CampaignCharacterWithDetails[];
  allyCharacters: CampaignCharacterWithDetails[];
  enemyCharacters: CampaignCharacterWithDetails[];
  npcCharacters: CampaignCharacterWithDetails[];
  userCharacters: Character[];
  onBack: () => void;
  onSelectCharacter: (characterId: string) => void;
  onAddCharacter: (characterId: string, role: CampaignCharacterRole) => Promise<void>;
  onRemoveCharacter: (campaignCharacterId: string) => Promise<void>;
  loading: boolean;
}

export function CampaignView({
  campaignName,
  joinCode,
  isDM,
  userId,
  partyCharacters,
  allyCharacters,
  enemyCharacters,
  npcCharacters,
  userCharacters,
  onBack,
  onSelectCharacter,
  onAddCharacter,
  onRemoveCharacter,
  loading,
}: CampaignViewProps) {
  const [search, setSearch] = useState('');
  const [addingRole, setAddingRole] = useState<CampaignCharacterRole | null>(null);
  const [addingCharId, setAddingCharId] = useState<string | null>(null);

  const allCampaignCharacterIds = new Set([
    ...partyCharacters,
    ...allyCharacters,
    ...enemyCharacters,
    ...npcCharacters,
  ].map((cc) => cc.character_id));

  const roleCharacters: Record<CampaignCharacterRole, CampaignCharacterWithDetails[]> = {
    party: partyCharacters,
    ally: allyCharacters,
    enemy: enemyCharacters,
    npc: npcCharacters,
  };

  const searchLower = search.toLowerCase().trim();
  const filterChars = (chars: CampaignCharacterWithDetails[]) =>
    searchLower
      ? chars.filter((cc) =>
          cc.character.name.toLowerCase().includes(searchLower) ||
          cc.character.race.toLowerCase().includes(searchLower) ||
          cc.character.class.toLowerCase().includes(searchLower)
        )
      : chars;

  const availableCharsForRole = (role: CampaignCharacterRole) => {
    if (isDM) {
      return userCharacters.filter((c) => !allCampaignCharacterIds.has(c.id));
    }
    if (role === 'party') {
      return userCharacters.filter((c) => !allCampaignCharacterIds.has(c.id));
    }
    return [];
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      showToast('Join code copied!');
    } catch {
      showToast(joinCode);
    }
  };

  const handleAdd = async (characterId: string, role: CampaignCharacterRole) => {
    setAddingCharId(characterId);
    await onAddCharacter(characterId, role);
    setAddingCharId(null);
    setAddingRole(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10"
        style={{
          background: 'linear-gradient(180deg, var(--bg) 0%, rgba(15,14,19,0.95) 100%)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-transparent cursor-pointer shrink-0 flex items-center gap-1"
          style={{
            color: 'var(--accent)',
            border: '1px solid var(--accent-border)',
            fontSize: '13px',
            fontFamily: 'var(--heading)',
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex-1 min-w-0">
          <h1
            className="m-0 truncate"
            style={{ color: 'var(--accent)', fontSize: '1rem', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}
          >
            {campaignName}
          </h1>
        </div>
        <button
          onClick={handleCopyCode}
          className="px-2.5 py-1.5 rounded-lg cursor-pointer shrink-0 flex items-center gap-1.5"
          style={{
            background: 'var(--code-bg)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontSize: '12px',
            fontFamily: 'var(--mono)',
            letterSpacing: '1px',
          }}
          title="Copy join code"
        >
          <Copy size={12} /> {joinCode}
        </button>
      </header>

      {/* Search bar */}
      <div className="px-4 py-3">
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
          style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}
        >
          <Search size={14} style={{ color: 'var(--text)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search characters…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-h)', border: 'none', fontFamily: 'var(--sans)' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="p-0.5 bg-transparent cursor-pointer"
              style={{ color: 'var(--text)', border: 'none' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-6 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div
              className="w-10 h-10 rounded-full"
              style={{
                border: '3px solid var(--border)',
                borderTopColor: 'var(--accent)',
                animation: 'diceRoll 1s linear infinite',
              }}
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
            {ROLE_ORDER.map((role) => {
              const config = ROLE_CONFIG[role];
              const chars = filterChars(roleCharacters[role]);
              const totalCount = roleCharacters[role].length;
              const canAdd = isDM || role === 'party';
              const available = availableCharsForRole(role);

              if (totalCount === 0 && !canAdd) return null;
              if (chars.length === 0 && searchLower && totalCount > 0) return null;
              if (chars.length === 0 && !canAdd) return null;

              const RoleIcon = config.icon;

              return (
                <div key={role} className="animate-fade-in">
                  {/* Section heading */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <RoleIcon size={14} style={{ color: config.color }} />
                      <h2
                        className="text-xs m-0"
                        style={{
                          color: config.color,
                          fontFamily: 'var(--heading)',
                          letterSpacing: '1.5px',
                        }}
                      >
                        {config.label.toUpperCase()}
                        {totalCount > 0 && (
                          <span
                            className="ml-2 px-1.5 py-0.5 rounded text-xs"
                            style={{ background: config.bg, fontSize: '0.7rem' }}
                          >
                            {totalCount}
                          </span>
                        )}
                      </h2>
                    </div>
                    {canAdd && available.length > 0 && (
                      <button
                        onClick={() => setAddingRole(addingRole === role ? null : role)}
                        className="px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1"
                        style={{
                          background: addingRole === role ? config.bg : 'transparent',
                          color: config.color,
                          border: `1px solid ${config.border}`,
                          fontSize: '11px',
                          fontFamily: 'var(--heading)',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {addingRole === role ? <X size={11} /> : <Plus size={11} />}
                        {addingRole === role ? 'Cancel' : 'Add'}
                      </button>
                    )}
                  </div>

                  {/* Add character picker */}
                  {addingRole === role && (
                    <div
                      className="mb-3 p-3 rounded-xl animate-fade-in"
                      style={{ background: config.bg, border: `1px solid ${config.border}` }}
                    >
                      <p className="text-xs mb-2" style={{ color: 'var(--text)' }}>
                        Select a character to add:
                      </p>
                      <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                        {available.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => handleAdd(c.id, role)}
                            disabled={addingCharId === c.id}
                            className="flex items-center gap-2 p-2 rounded-lg cursor-pointer text-left w-full disabled:opacity-50"
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <Shield size={13} style={{ color: config.color }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>
                                {c.name}
                              </p>
                              <p className="text-xs truncate" style={{ color: 'var(--text)', fontSize: '0.65rem' }}>
                                {[c.race, c.class].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                            <span className="text-xs" style={{ color: 'var(--hp-crimson)', fontFamily: 'var(--mono)', fontSize: '0.65rem' }}>
                              {c.current_hp}/{c.max_hp}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Character cards grid */}
                  {chars.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {chars.map((cc, i) => (
                        <div
                          key={cc.id}
                          className="p-3.5 rounded-xl cursor-pointer transition-all active:scale-[0.98] animate-fade-in"
                          style={{
                            background: 'linear-gradient(135deg, var(--bg-raised) 0%, var(--bg-surface) 100%)',
                            border: `1px solid ${config.border}`,
                            boxShadow: 'var(--shadow)',
                            animationDelay: `${i * 40}ms`,
                          }}
                          onClick={() => onSelectCharacter(cc.character_id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && onSelectCharacter(cc.character_id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {cc.character.image_url ? (
                                <div
                                  className="w-9 h-9 rounded-lg shrink-0 bg-cover bg-center"
                                  style={{
                                    backgroundImage: `url(${cc.character.image_url})`,
                                    backgroundPosition: `center ${cc.character.image_position ?? 50}%`,
                                    border: `1px solid ${config.border}`,
                                  }}
                                />
                              ) : (
                                <div
                                  className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center"
                                  style={{ background: config.bg, border: `1px solid ${config.border}` }}
                                >
                                  <RoleIcon size={14} style={{ color: config.color }} />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h3
                                  className="text-sm m-0 truncate"
                                  style={{ color: config.color, fontFamily: 'var(--heading)', fontSize: '0.85rem' }}
                                >
                                  {cc.character.name}
                                </h3>
                                <p className="text-xs truncate" style={{ color: 'var(--text)', fontSize: '0.7rem' }}>
                                  {[cc.character.race, cc.character.class].filter(Boolean).join(' · ') || 'Unknown'}
                                  {cc.character.level > 0 && ` · Lv ${cc.character.level}`}
                                </p>
                              </div>
                            </div>
                            {isDM && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveCharacter(cc.id);
                                }}
                                className="p-1.5 rounded-lg bg-transparent cursor-pointer shrink-0"
                                style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
                                aria-label={`Remove ${cc.character.name}`}
                              >
                                <X size={12} />
                              </button>
                            )}
                            {!isDM && cc.added_by === userId && cc.role === 'party' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveCharacter(cc.id);
                                }}
                                className="p-1.5 rounded-lg bg-transparent cursor-pointer shrink-0"
                                style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
                                aria-label={`Remove ${cc.character.name}`}
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2.5">
                            <span
                              className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                              style={{
                                background: 'rgba(185,28,28,0.15)',
                                color: 'var(--hp-crimson)',
                                border: '1px solid rgba(185,28,28,0.25)',
                                fontSize: '0.65rem',
                              }}
                            >
                              <Heart size={8} fill="currentColor" /> {cc.character.current_hp}/{cc.character.max_hp}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    !searchLower && canAdd && (
                      <p className="text-xs py-4 text-center" style={{ color: 'var(--text)' }}>
                        No {config.label.toLowerCase()} yet
                      </p>
                    )
                  )}
                </div>
              );
            })}

            {/* Empty state: all sections empty */}
            {partyCharacters.length === 0 && allyCharacters.length === 0 && enemyCharacters.length === 0 && npcCharacters.length === 0 && !loading && (
              <div className="flex flex-col items-center py-12 gap-3">
                <Users size={40} style={{ color: 'var(--border-light)' }} />
                <p className="text-sm text-center" style={{ color: 'var(--text)' }}>
                  No characters in this campaign yet.
                  {isDM ? ' Use the Add buttons above to populate your world!' : ' The DM will add characters, or add your own to the Party.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

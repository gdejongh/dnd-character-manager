import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Character, CharacterShare } from '../types/database';
import type { ActiveSessionInfo } from '../hooks/useCombatSession';
import type { SharedCharacterInfo } from '../hooks/useSharedWithMe';
import { LogOut, Trash2, Heart, Plus, Shield, Swords, Users, Settings, Share2, Check, X, Eye, UserMinus } from 'lucide-react';
import { lookupSession } from '../hooks/useCombatSession';
import { AccountSettings } from './AccountSettings';
import { ShareModal } from './ShareModal';

interface HomeScreenProps {
  characters: Character[];
  userEmail: string;
  username: string;
  loading: boolean;
  onSelect: (id: string) => void;
  onCreate: (name: string, race: string, charClass: string) => Promise<Character | null>;
  onDelete: (id: string) => Promise<void>;
  onSignOut: () => void;
  onUpdateUsername: (username: string) => Promise<void>;
  onUpdatePassword: (password: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onStartCombat: () => Promise<void>;
  onJoinCombat: (sessionId: string, characterId: string, charName: string, charClass: string, hp: number, maxHp: number, imageUrl: string | null, imagePosition: number) => Promise<void>;
  activeSession: ActiveSessionInfo | null;
  onRejoinCombat: (sessionId: string, role: 'dm' | 'player') => void;
  // Sharing — sender side
  getSharesForCharacter: (characterId: string) => CharacterShare[];
  onShareCharacter: (characterId: string, email: string) => Promise<void>;
  onRevokeShare: (shareId: string) => Promise<void>;
  // Sharing — recipient side
  pendingShares: SharedCharacterInfo[];
  acceptedShares: SharedCharacterInfo[];
  onAcceptShare: (shareId: string) => Promise<void>;
  onDeclineShare: (shareId: string) => Promise<void>;
  onUnfollowShare: (shareId: string) => Promise<void>;
  onSelectSharedCharacter: (characterId: string, shareId: string) => void;
}

export function HomeScreen({
  characters,
  userEmail,
  username,
  loading,
  onSelect,
  onCreate,
  onDelete,
  onSignOut,
  onUpdateUsername,
  onUpdatePassword,
  onDeleteAccount,
  onStartCombat,
  onJoinCombat,
  activeSession,
  onRejoinCombat,
  getSharesForCharacter,
  onShareCharacter,
  onRevokeShare,
  pendingShares,
  acceptedShares,
  onAcceptShare,
  onDeclineShare,
  onUnfollowShare,
  onSelectSharedCharacter,
}: HomeScreenProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [race, setRace] = useState('');
  const [charClass, setCharClass] = useState('');
  const [creating, setCreating] = useState(false);

  // Join combat state
  const [joinStep, setJoinStep] = useState<'idle' | 'code' | 'pick'>('idle');
  const [roomCode, setRoomCode] = useState('');
  const [joinSessionId, setJoinSessionId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinKeyboardInset, setJoinKeyboardInset] = useState(0);
  const [startingCombat, setStartingCombat] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const joinKeyboardSafetyGap = joinKeyboardInset > 0 ? 72 : 0;
  const joinCodeSectionRef = useRef<HTMLDivElement | null>(null);
  const keyboardWasOpenRef = useRef(false);
  const maxKeyboardInsetRef = useRef(0);

  // Share modal state
  const [shareModalCharId, setShareModalCharId] = useState<string | null>(null);
  const shareModalChar = shareModalCharId ? characters.find((c) => c.id === shareModalCharId) : null;

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    const character = await onCreate(name.trim(), race.trim(), charClass.trim());
    setCreating(false);
    if (character) {
      setName('');
      setRace('');
      setCharClass('');
      setShowForm(false);
      onSelect(character.id);
    }
  }

  const inputStyle = {
    background: 'var(--code-bg)',
    color: 'var(--text-h)',
    border: '1px solid var(--border)',
  };

  const scrollJoinCodeIntoView = () => {
    requestAnimationFrame(() => {
      joinCodeSectionRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    });
  };

  useEffect(() => {
    if (joinStep !== 'code') {
      setJoinKeyboardInset(0);
      return;
    }

    setTimeout(scrollJoinCodeIntoView, 50);

    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateForKeyboard = () => {
      const rawInset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      const keyboardLooksOpen = rawInset > 80;

      if (!keyboardLooksOpen) {
        keyboardWasOpenRef.current = false;
        maxKeyboardInsetRef.current = 0;
        setJoinKeyboardInset(0);
        return;
      }

      maxKeyboardInsetRef.current = Math.max(maxKeyboardInsetRef.current, Math.round(rawInset));
      setJoinKeyboardInset((prev) => (prev !== maxKeyboardInsetRef.current ? maxKeyboardInsetRef.current : prev));

      if (!keyboardWasOpenRef.current) {
        keyboardWasOpenRef.current = true;
        scrollJoinCodeIntoView();
      }
    };

    viewport.addEventListener('resize', updateForKeyboard);
    viewport.addEventListener('scroll', updateForKeyboard);
    updateForKeyboard();

    return () => {
      viewport.removeEventListener('resize', updateForKeyboard);
      viewport.removeEventListener('scroll', updateForKeyboard);
      keyboardWasOpenRef.current = false;
      maxKeyboardInsetRef.current = 0;
      setJoinKeyboardInset(0);
    };
  }, [joinStep]);

  if (showAccountSettings) {
    return (
      <AccountSettings
        email={userEmail}
        username={username}
        onBack={() => setShowAccountSettings(false)}
        onUpdateUsername={onUpdateUsername}
        onUpdatePassword={onUpdatePassword}
        onDeleteAccount={onDeleteAccount}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header
        className="flex items-center justify-between p-4"
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(180deg, var(--bg-raised) 0%, var(--bg) 100%)',
        }}
      >
        <div className="flex items-center gap-3">
          <Shield size={22} style={{ color: 'var(--accent)' }} />
          <h1
            className="m-0 animate-shimmer"
            style={{ fontSize: '1.15rem', letterSpacing: '1px' }}
          >
            D&D Characters
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAccountSettings(true)}
            className="p-2.5 rounded-lg bg-transparent cursor-pointer"
            style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
            aria-label="Account settings"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={onSignOut}
            className="p-2.5 rounded-lg bg-transparent cursor-pointer"
            style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ── Rejoin Active Session Banner ── */}
      {activeSession && (
        <div
          className="mx-4 mt-3 animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, rgba(185,28,28,0.12) 0%, rgba(201,168,76,0.10) 100%)',
            border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => onRejoinCombat(activeSession.sessionId, activeSession.role)}
            className="w-full flex items-center gap-3 p-4 cursor-pointer bg-transparent text-left"
            style={{ border: 'none' }}
          >
            <div
              className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
                boxShadow: '0 0 12px rgba(239,68,68,0.3)',
              }}
            >
              <Swords size={18} style={{ color: '#fca5a5' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold m-0"
                style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}
              >
                Battle in Progress
              </p>
              <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text)' }}>
                Room <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', letterSpacing: '1px' }}>{activeSession.roomCode}</span>
                {' · '}
                {activeSession.role === 'dm' ? 'Dungeon Master' : 'Player'}
                {' · '}
                {activeSession.status === 'lobby' ? 'In Lobby' : 'Combat Active'}
              </p>
            </div>
            <span
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
                color: '#fca5a5',
                fontFamily: 'var(--heading)',
                letterSpacing: '0.5px',
              }}
            >
              Rejoin
            </span>
          </button>
        </div>
      )}

      {/* Character List */}
      <div className="flex-1 p-4">
        {loading ? (
          <p className="text-center py-12" style={{ color: 'var(--text)' }}>
            Loading characters…
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {characters.map((char, i) => (
                <div
                  key={char.id}
                  className="p-4 rounded-xl cursor-pointer transition-all active:scale-[0.98] animate-fade-in"
                  style={{
                    background: 'linear-gradient(135deg, var(--bg-raised) 0%, var(--bg-surface) 100%)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow)',
                    animationDelay: `${i * 60}ms`,
                  }}
                  onClick={() => onSelect(char.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onSelect(char.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2
                        className="text-lg m-0"
                        style={{ color: 'var(--accent)', fontSize: '1rem' }}
                      >
                        {char.name}
                      </h2>
                      <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
                        {[char.race, char.class].filter(Boolean).join(' · ') || 'No race/class'}
                        {char.level > 0 && ` · Level ${char.level}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareModalCharId(char.id);
                        }}
                        className="p-2.5 rounded-lg bg-transparent cursor-pointer shrink-0"
                        style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
                        aria-label={`Share ${char.name}`}
                      >
                        <Share2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(char.id);
                        }}
                        className="p-2.5 rounded-lg bg-transparent cursor-pointer shrink-0"
                        style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
                        aria-label={`Delete ${char.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-3">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                      style={{
                        background: 'rgba(185,28,28,0.15)',
                        color: 'var(--hp-crimson)',
                        border: '1px solid rgba(185,28,28,0.25)',
                      }}
                    >
                      <Heart size={10} fill="currentColor" /> {char.current_hp}/{char.max_hp}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {characters.length === 0 && (
              <div className="flex flex-col items-center py-16 gap-4">
                <Shield size={48} style={{ color: 'var(--border-light)' }} />
                <p className="text-center" style={{ color: 'var(--text)' }}>
                  No adventurers yet. Create your first character!
                </p>
              </div>
            )}

            {/* ── Pending Share Invitations ── */}
            {pendingShares.length > 0 && (
              <div className="mt-6">
                <h3
                  className="text-xs mb-3 px-1"
                  style={{ color: 'var(--accent)', fontFamily: 'var(--heading)', letterSpacing: '1.5px' }}
                >
                  ✦ PENDING INVITATIONS
                </h3>
                <div className="flex flex-col gap-2">
                  {pendingShares.map((item) => (
                    <div
                      key={item.share.id}
                      className="p-3 rounded-xl animate-fade-in"
                      style={{
                        background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.03) 100%)',
                        border: '1px solid var(--accent-border)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>
                            {item.character.name}
                          </p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text)' }}>
                            {[item.character.race, item.character.class].filter(Boolean).join(' · ')}
                            {item.character.level > 0 && ` · Level ${item.character.level}`}
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text)' }}>
                            From <span style={{ color: 'var(--accent)' }}>{item.share.sender_username || item.share.sender_email}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <button
                            onClick={() => onAcceptShare(item.share.id)}
                            className="p-2 rounded-lg cursor-pointer"
                            style={{
                              background: 'rgba(34,197,94,0.15)',
                              color: '#4ade80',
                              border: '1px solid rgba(34,197,94,0.3)',
                            }}
                            aria-label="Accept"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => onDeclineShare(item.share.id)}
                            className="p-2 rounded-lg cursor-pointer"
                            style={{
                              background: 'rgba(239,68,68,0.1)',
                              color: '#f87171',
                              border: '1px solid rgba(239,68,68,0.25)',
                            }}
                            aria-label="Decline"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Shared With Me ── */}
            {acceptedShares.length > 0 && (
              <div className="mt-6">
                <h3
                  className="text-xs mb-3 px-1"
                  style={{ color: 'var(--text)', fontFamily: 'var(--heading)', letterSpacing: '1.5px' }}
                >
                  SHARED WITH ME
                </h3>
                <div className="flex flex-col gap-3">
                  {acceptedShares.map((item, i) => (
                    <div
                      key={item.share.id}
                      className="p-4 rounded-xl cursor-pointer transition-all active:scale-[0.98] animate-fade-in"
                      style={{
                        background: 'linear-gradient(135deg, var(--bg-raised) 0%, var(--bg-surface) 100%)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow)',
                        animationDelay: `${i * 60}ms`,
                      }}
                      onClick={() => onSelectSharedCharacter(item.character.id, item.share.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && onSelectSharedCharacter(item.character.id, item.share.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg m-0" style={{ color: 'var(--accent)', fontSize: '1rem' }}>
                              {item.character.name}
                            </h2>
                            <span
                              className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
                              style={{
                                background: 'rgba(147,130,220,0.12)',
                                color: '#a78bfa',
                                border: '1px solid rgba(147,130,220,0.25)',
                              }}
                            >
                              <Eye size={10} /> Shared
                            </span>
                          </div>
                          <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
                            {[item.character.race, item.character.class].filter(Boolean).join(' · ') || 'No race/class'}
                            {item.character.level > 0 && ` · Level ${item.character.level}`}
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text)' }}>
                            From {item.share.sender_username || item.share.sender_email}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnfollowShare(item.share.id);
                          }}
                          className="p-2 rounded-lg cursor-pointer shrink-0"
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            color: '#f87171',
                            border: '1px solid rgba(239,68,68,0.25)',
                          }}
                          aria-label={`Unfollow ${item.character.name}`}
                          title="Stop following shared character"
                        >
                          <UserMinus size={13} />
                        </button>
                      </div>
                      <div className="flex gap-3 mt-3">
                        <span
                          className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                          style={{
                            background: 'rgba(185,28,28,0.15)',
                            color: 'var(--hp-crimson)',
                            border: '1px solid rgba(185,28,28,0.25)',
                          }}
                        >
                          <Heart size={10} fill="currentColor" /> {item.character.current_hp}/{item.character.max_hp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Combat Session Buttons ── */}
      {!loading && joinStep === 'idle' && (
        <div
          className="px-4 py-3 flex gap-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={async () => {
              setStartingCombat(true);
              await onStartCombat();
              setStartingCombat(false);
            }}
            disabled={startingCombat}
            className="flex-1 py-3 rounded-xl font-semibold text-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
              color: '#fff',
              border: '1px solid rgba(239,68,68,0.3)',
              fontFamily: 'var(--heading)',
              letterSpacing: '0.5px',
            }}
          >
            <Swords size={16} />
            {startingCombat ? 'Creating…' : 'Start Combat'}
          </button>
          <button
            onClick={() => setJoinStep('code')}
            className="flex-1 py-3 rounded-xl font-semibold text-sm cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: 'var(--accent-bg)',
              color: 'var(--accent)',
              border: '1px solid var(--accent-border)',
              fontFamily: 'var(--heading)',
              letterSpacing: '0.5px',
            }}
          >
            <Users size={16} />
            Join Combat
          </button>
        </div>
      )}

      {/* ── Join Flow: Enter Room Code ── */}
      {joinStep === 'code' && (
        <div
          ref={joinCodeSectionRef}
          className="px-4 py-4 animate-fade-in"
          style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            paddingBottom: `${16 + joinKeyboardInset + joinKeyboardSafetyGap}px`,
          }}
        >
          <h3
            className="text-center mb-3"
            style={{ fontFamily: 'var(--heading)', color: 'var(--accent)', fontSize: '0.85rem', letterSpacing: '1px' }}
          >
            ENTER ROOM CODE
          </h3>
          <form
            onSubmit={async (e: FormEvent) => {
              e.preventDefault();
              setJoinError('');
              setJoining(true);
              const sess = await lookupSession(roomCode);
              setJoining(false);
              if (sess) {
                setJoinSessionId(sess.id);
                setJoinStep('pick');
              } else {
                setJoinError('Session not found. Check the code and try again.');
              }
            }}
            className="flex flex-col gap-3"
          >
            <input
              type="text"
              placeholder="e.g. DRAGON-42"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              onFocus={scrollJoinCodeIntoView}
              className="w-full px-4 py-3.5 rounded-lg text-center text-lg outline-none tracking-widest"
              style={{
                ...inputStyle,
                fontFamily: 'var(--mono)',
                fontSize: '1.2rem',
                letterSpacing: '3px',
              }}
              autoFocus
            />
            {joinError && (
              <p className="text-xs text-center" style={{ color: 'var(--danger-bright)' }}>{joinError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setJoinStep('idle'); setRoomCode(''); setJoinError(''); }}
                className="flex-1 py-3 rounded-lg cursor-pointer"
                style={{ color: 'var(--text)', background: 'transparent', border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!roomCode.trim() || joining}
                className="flex-1 py-3 rounded-lg cursor-pointer font-semibold disabled:opacity-30"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
                  color: '#0f0e13',
                  border: 'none',
                  fontFamily: 'var(--heading)',
                }}
              >
                {joining ? 'Checking…' : 'Find Session'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Join Flow: Pick Character ── */}
      {joinStep === 'pick' && (
        <div className="px-4 py-4 animate-fade-in" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <h3
            className="text-center mb-3"
            style={{ fontFamily: 'var(--heading)', color: 'var(--accent)', fontSize: '0.85rem', letterSpacing: '1px' }}
          >
            CHOOSE YOUR CHARACTER
          </h3>
          {characters.length === 0 ? (
            <p className="text-center text-sm py-4" style={{ color: 'var(--text)' }}>
              You need to create a character first!
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {characters.map((c) => (
                <button
                  key={c.id}
                  onClick={async () => {
                    if (!joinSessionId) return;
                    setJoining(true);
                    await onJoinCombat(joinSessionId, c.id, c.name, c.class, c.current_hp, c.max_hp, c.image_url, c.image_position ?? 50);
                    setJoining(false);
                  }}
                  disabled={joining}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer text-left w-full disabled:opacity-50"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <Shield size={16} style={{ color: 'var(--accent)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', fontSize: '0.85rem' }}>
                      {c.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text)' }}>
                      {[c.race, c.class].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--hp-crimson)', fontFamily: 'var(--mono)' }}>
                    {c.current_hp}/{c.max_hp}
                  </span>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => { setJoinStep('idle'); setRoomCode(''); setJoinSessionId(null); }}
            className="w-full mt-3 py-2.5 rounded-lg cursor-pointer"
            style={{ color: 'var(--text)', background: 'transparent', border: '1px solid var(--border)' }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* New Character Form / Button */}
      {showForm ? (
        <div
          className="p-5 animate-fade-in"
          style={{
            borderTop: '1px solid var(--border)',
            background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg) 100%)',
          }}
        >
          <h3
            className="text-center mb-4"
            style={{ fontFamily: 'var(--heading)', color: 'var(--accent)', fontSize: '0.9rem', letterSpacing: '1.5px' }}
          >
            ✦ CREATE NEW CHARACTER ✦
          </h3>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Character Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-lg text-base outline-none text-center"
              style={{
                ...inputStyle,
                fontFamily: 'var(--heading)',
                fontSize: '1.05rem',
                letterSpacing: '0.5px',
              }}
              autoFocus
            />
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Race"
                value={race}
                onChange={(e) => setRace(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg text-base outline-none"
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Class"
                value={charClass}
                onChange={(e) => setCharClass(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg text-base outline-none"
                style={inputStyle}
              />
            </div>
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-lg font-semibold text-base cursor-pointer"
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
                disabled={creating}
                className="flex-1 py-3 rounded-lg font-semibold text-base cursor-pointer disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
                  color: '#0f0e13',
                  border: 'none',
                  fontFamily: 'var(--heading)',
                  letterSpacing: '0.5px',
                }}
              >
                {creating ? 'Forging…' : 'Begin Adventure'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3.5 rounded-xl font-semibold text-base cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
              color: '#0f0e13',
              border: 'none',
              fontFamily: 'var(--heading)',
              letterSpacing: '0.5px',
            }}
          >
            <Plus size={18} /> New Character
          </button>
        </div>
      )}

      {/* Share Modal */}
      {shareModalChar && (
        <ShareModal
          characterName={shareModalChar.name}
          shares={getSharesForCharacter(shareModalChar.id)}
          onShare={(email) => onShareCharacter(shareModalChar.id, email)}
          onRevoke={onRevokeShare}
          onClose={() => setShareModalCharId(null)}
        />
      )}
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Tab } from './types/database';
import { isSupabaseConfigured } from './lib/supabase';
import { supabase } from './lib/supabase';
import { getPreparedSpellLimit, isWarlock, isDruid, getClassLevel } from './constants/dnd';
import { showToast } from './lib/toast';
import { useAuth } from './hooks/useAuth';
import { useCharacters } from './hooks/useCharacters';
import { useCharacter } from './hooks/useCharacter';
import { useAbilityScores } from './hooks/useAbilityScores';
import { useSpellSlots } from './hooks/useSpellSlots';
import { useSpells } from './hooks/useSpells';
import { useInventory } from './hooks/useInventory';
import { useFeatures } from './hooks/useFeatures';
import { useNotes } from './hooks/useNotes';
import { useWeapons } from './hooks/useWeapons';
import { useCharacterImage } from './hooks/useCharacterImage';
import { useCharacterShares } from './hooks/useCharacterShares';
import { useSharedWithMe } from './hooks/useSharedWithMe';
import { useCustomBeasts } from './hooks/useCustomBeasts';
import { useCharacterClasses } from './hooks/useCharacterClasses';
import { createCombatSession, joinCombatSession, findActiveSession } from './hooks/useCombatSession';
import type { ActiveSessionInfo } from './hooks/useCombatSession';
import { Auth } from './components/Auth';
import { HomeScreen } from './components/HomeScreen';
import { GuestCharacterBuilder } from './components/GuestCharacterBuilder';
import type { GuestCharacterData, GuestScoreData } from './components/GuestCharacterBuilder';
import { GuestSheetPreview } from './components/GuestSheetPreview';
import { CharacterSheet } from './components/CharacterSheet';
import { HpTracker } from './components/HpTracker';
import { SpellSlots } from './components/SpellSlots';
import { Inventory } from './components/Inventory';
import { Weapons } from './components/Weapons';
import { FeaturesTraits } from './components/FeaturesTraits';
import { Notes } from './components/Notes';
import { CombatView } from './components/CombatView';
import { TabBar } from './components/TabBar';
import { CombatTransition } from './components/CombatTransition';
import { ToastContainer } from './components/Toast';
import { LiveCombat } from './components/LiveCombat';
import { ExportPdfButton } from './components/ExportPdf';
import { exportCharacterPdf } from './lib/exportPdf';
import type { PdfStyle } from './lib/exportPdf';
import { Users, Copy, Eye, ScrollText, HelpCircle } from 'lucide-react';
import { QuickReference } from './components/QuickReference';
import { DiceRoller } from './components/DiceRoller';
import { WildShapeModal } from './components/WildShapeModal';
import { ActionFAB } from './components/ActionFAB';
import { useDiceRoller } from './hooks/useDiceRoller';
import { buildQuickRolls } from './constants/dice';
import { getThemeById, applyTheme, DEFAULT_THEME } from './constants/themes';
import type { ThemeId } from './constants/themes';
import { ThemePicker, ThemePickerButton } from './components/ThemePicker';
import type { Ability } from './types/database';
import type { Beast } from './constants/beasts';
import './App.css';

function SetupScreen() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-6"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="w-full max-w-md p-6 rounded-2xl animate-fade-in"
        style={{
          background: 'var(--bg-raised)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <h1
          className="text-center mb-1"
          style={{ fontSize: '1.4rem', letterSpacing: '0.5px', color: 'var(--accent)' }}
        >
          D&D Character Manager
        </h1>
        <h2
          className="text-center mb-4"
          style={{ color: 'var(--text)', fontSize: '0.85rem', fontFamily: 'var(--sans)', fontWeight: 400 }}
        >
          Supabase Setup Required
        </h2>
        <ol
          className="flex flex-col gap-3 text-sm list-decimal pl-5"
          style={{ color: 'var(--text)' }}
        >
          <li>
            Create a project at{' '}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              supabase.com
            </a>
          </li>
          <li>
            Open the <strong style={{ color: 'var(--text-h)' }}>SQL Editor</strong> and paste the
            contents of{' '}
            <code>schema.sql</code>
          </li>
          <li>
            Copy <code>.env.local.example</code> → <code>.env.local</code>
          </li>
          <li>
            Fill in <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>{' '}
            from <strong style={{ color: 'var(--text-h)' }}>Settings → API</strong>
          </li>
          <li>Restart the dev server</li>
        </ol>
      </div>
    </div>
  );
}

function App() {
  const {
    user,
    loading: authLoading,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    updateUsername,
    updatePassword,
    deleteAccount,
  } = useAuth();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('sheet');
  const [showCombatTransition, setShowCombatTransition] = useState(false);
  const [showQuickRef, setShowQuickRef] = useState(false);
  const [showDiceRoller, setShowDiceRoller] = useState(false);

  // Dice roller
  const diceRoller = useDiceRoller();

  // Live Combat Session state
  const [combatSessionId, setCombatSessionId] = useState<string | null>(null);
  const [combatRole, setCombatRole] = useState<'dm' | 'player'>('dm');

  // Active session detection for rejoin
  const [activeSession, setActiveSession] = useState<ActiveSessionInfo | null>(null);

  // Shared character viewing state
  const [sharedViewShareId, setSharedViewShareId] = useState<string | null>(null);
  const isReadOnly = sharedViewShareId !== null;

  // Guest mode state
  const GUEST_STORAGE_KEY = 'dnd-guest-character';
  const [showAuth, setShowAuth] = useState(false);
  const [guestCharacter, setGuestCharacter] = useState<GuestCharacterData | null>(() => {
    try {
      const stored = localStorage.getItem(GUEST_STORAGE_KEY);
      return stored ? JSON.parse(stored).character ?? null : null;
    } catch { return null; }
  });
  const [guestScores, setGuestScores] = useState<GuestScoreData[]>(() => {
    try {
      const stored = localStorage.getItem(GUEST_STORAGE_KEY);
      return stored ? JSON.parse(stored).scores ?? [] : [];
    } catch { return []; }
  });
  const [guestEditing, setGuestEditing] = useState(false);

  // Persist guest data to localStorage (survives email verification redirect)
  useEffect(() => {
    if (guestCharacter) {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ character: guestCharacter, scores: guestScores }));
    } else {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    }
  }, [guestCharacter, guestScores]);

  // Auto-save guest character after login/signup
  const guestSaveAttempted = useRef(false);
  useEffect(() => {
    if (!user || !guestCharacter || guestSaveAttempted.current) return;
    guestSaveAttempted.current = true;
    (async () => {
      try {
        const created = await createCharacter(guestCharacter.name, guestCharacter.race, guestCharacter.class);
        if (!created) throw new Error('Failed to create character');

        // Update character fields beyond name/race/class
        await supabase.from('characters').update({
          level: guestCharacter.level,
          max_hp: guestCharacter.max_hp,
          current_hp: guestCharacter.max_hp,
          armor_class: guestCharacter.armor_class,
          speed: guestCharacter.speed,
        }).eq('id', created.id);

        // Update seeded ability scores to match guest values
        for (const s of guestScores) {
          await supabase.from('ability_scores').update({ score: s.score })
            .eq('character_id', created.id)
            .eq('ability', s.ability);
        }

        // Save guest extras (spells, weapons, features, spell slots)
        const GUEST_EXTRAS_KEY = 'dnd-guest-extras';
        try {
          const stored = localStorage.getItem(GUEST_EXTRAS_KEY);
          if (stored) {
            const extras = JSON.parse(stored);

            if (extras.spells?.length) {
              await supabase.from('spells').insert(
                extras.spells.map((s: { name: string; description: string; level: number; prepared: boolean; concentration: boolean; action_type: string }) => ({
                  character_id: created.id,
                  name: s.name,
                  description: s.description,
                  level: s.level,
                  prepared: s.prepared,
                  concentration: s.concentration,
                  action_type: s.action_type,
                })),
              );
            }

            if (extras.weapons?.length) {
              await supabase.from('weapons').insert(
                extras.weapons.map((w: { name: string; damage_dice: string; damage_type: string; ability_mod: string; proficient: boolean; action_type: string }) => ({
                  character_id: created.id,
                  name: w.name,
                  damage_dice: w.damage_dice,
                  damage_type: w.damage_type,
                  ability_mod: w.ability_mod,
                  proficient: w.proficient,
                  action_type: w.action_type,
                })),
              );
            }

            if (extras.features?.length) {
              await supabase.from('features').insert(
                extras.features.map((f: { title: string; description: string; source: string; action_type: string; max_uses: number | null; used_uses: number; rest_type?: 'long_rest' | 'short_rest' }) => ({
                  character_id: created.id,
                  title: f.title,
                  description: f.description,
                  source: f.source,
                  action_type: f.action_type,
                  max_uses: f.max_uses,
                  used_uses: f.used_uses,
                  rest_type: f.rest_type ?? 'long_rest',
                })),
              );
            }

            // Update spell slot totals (slots are already seeded by createCharacter)
            if (extras.slots?.length) {
              for (const slot of extras.slots as { level: number; total: number; used: number }[]) {
                if (slot.total > 0) {
                  await supabase.from('spell_slots').update({ total: slot.total, used: slot.used })
                    .eq('character_id', created.id)
                    .eq('level', slot.level);
                }
              }
            }

            localStorage.removeItem(GUEST_EXTRAS_KEY);
          }
        } catch (extrasErr) {
          console.error('Error saving guest extras:', extrasErr);
        }

        setGuestCharacter(null);
        setGuestScores([]);
        setGuestEditing(false);
        setSelectedCharacterId(created.id);
        setActiveTab('sheet');
        showToast(`${guestCharacter.name} has been saved!`);
      } catch (err) {
        console.error('Error saving guest character:', err);
        showToast('Could not save your character. Please try creating it again.');
        setGuestCharacter(null);
        setGuestScores([]);
      }
    })();
  }, [user, guestCharacter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check for active sessions when user lands on HomeScreen
  useEffect(() => {
    if (!user || combatSessionId) return;
    let cancelled = false;
    findActiveSession(user.id).then((info) => {
      if (!cancelled) setActiveSession(info);
    });
    return () => { cancelled = true; };
  }, [user, combatSessionId]);

  const handleTabChange = useCallback(
    (tab: Tab) => {
      if (tab === 'combat' && activeTab !== 'combat') {
        setShowCombatTransition(true);
      } else {
        setActiveTab(tab);
      }
    },
    [activeTab],
  );

  const { characters, loading: charsLoading, createCharacter, deleteCharacter, syncCharacter, refresh: refreshCharacters } =
    useCharacters(user?.id);
  const { character, loading: charLoading, updateCharacter } =
    useCharacter(selectedCharacterId, syncCharacter);
  const { scores, updateScore, toggleSavingThrow } =
    useAbilityScores(selectedCharacterId);
  const { slots, updateTotal, setSlotUsed, resetAll, autoFillSlots } =
    useSpellSlots(selectedCharacterId);
  const { spells, addSpell, updateSpell, deleteSpell } =
    useSpells(selectedCharacterId);
  const { items, addItem, updateItem, deleteItem } = useInventory(selectedCharacterId);
  const { features, addFeature, updateFeature, resetAllUses, resetUsesByRestType, deleteFeature } = useFeatures(selectedCharacterId);
  const { weapons, addWeapon, updateWeapon, deleteWeapon } = useWeapons(selectedCharacterId);
  const { notes, loading: notesLoading, updateContent } = useNotes(selectedCharacterId);
  const { uploading: imageUploading, error: imageError, uploadImage, deleteImage } =
    useCharacterImage(user?.id, selectedCharacterId);
  const { customBeasts, addCustomBeast, deleteCustomBeast } = useCustomBeasts(selectedCharacterId);
  const { classes: characterClasses, addClass, migrateToMulticlass, updateClassLevel, updateClassName, removeClass } = useCharacterClasses(selectedCharacterId);

  // Wild Shape modal state
  const [showWildShapeModal, setShowWildShapeModal] = useState(false);

  // Theme picker modal state
  const [showThemePicker, setShowThemePicker] = useState(false);

  // Apply theme when character loads or changes
  useEffect(() => {
    if (character) {
      applyTheme(getThemeById(character.theme));
    }
  }, [character?.theme]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleActivateWildShape = useCallback((beast: Beast) => {
    updateCharacter({
      wild_shape_active: true,
      wild_shape_beast_name: beast.name,
      wild_shape_current_hp: beast.hp,
      wild_shape_max_hp: beast.hp,
      wild_shape_beast_ac: beast.ac,
      wild_shape_beast_str: beast.str,
      wild_shape_beast_dex: beast.dex,
      wild_shape_beast_con: beast.con,
      wild_shape_beast_speed: beast.speed,
      wild_shape_beast_swim_speed: beast.swimSpeed ?? null,
      wild_shape_beast_fly_speed: beast.flySpeed ?? null,
      wild_shape_beast_climb_speed: beast.climbSpeed ?? null,
      wild_shape_beast_burrow_speed: beast.burrowSpeed ?? null,
    });
    setShowWildShapeModal(false);
    showToast(`🐺 Wild Shape: ${beast.name}`);
  }, [updateCharacter]);

  // Character sharing
  const { shareCharacter, revokeShare, getSharesForCharacter } =
    useCharacterShares(user?.id);
  const { pendingShares, acceptedShares, acceptShare, declineShare, copyCharacter, unfollowShare } =
    useSharedWithMe(user?.id);

  async function handleAuth(email: string, password: string, isSignUp: boolean, username?: string) {
    if (isSignUp) {
      return await signUp(email, password, username ?? '');
    }
    await signIn(email, password);
    return {};
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full"
            style={{
              border: '3px solid var(--border)',
              borderTopColor: 'var(--accent)',
              animation: 'diceRoll 1s linear infinite',
            }}
          />
          <p style={{ color: 'var(--text)', fontFamily: 'var(--heading)', letterSpacing: '0.5px' }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }

  // Supabase not configured
  if (!isSupabaseConfigured) {
    return <SetupScreen />;
  }

  // Not authenticated — guest flow or auth
  if (!user) {
    // Show auth screen if explicitly requested
    if (showAuth) {
      return (
        <Auth
          onAuth={handleAuth}
          onForgotPassword={sendPasswordReset}
          onGuestMode={() => setShowAuth(false)}
        />
      );
    }

    // Show guest preview if character has been built
    if (guestCharacter && !guestEditing) {
      return (
        <GuestSheetPreview
          character={guestCharacter}
          scores={guestScores}
          onCreateAccount={() => setShowAuth(true)}
          onEdit={() => setGuestEditing(true)}
          onStartOver={() => {
            setGuestCharacter(null);
            setGuestScores([]);
            setGuestEditing(false);
            localStorage.removeItem('dnd-guest-extras');
          }}
        />
      );
    }

    // Show guest character builder (default landing for unauthenticated users)
    return (
      <GuestCharacterBuilder
        onComplete={(charData, scoreData) => {
          setGuestCharacter(charData);
          setGuestScores(scoreData);
          setGuestEditing(false);
        }}
        onSignIn={() => setShowAuth(true)}
      />
    );
  }

  // Live Combat Session
  if (combatSessionId) {
    return (
      <LiveCombat
        sessionId={combatSessionId}
        userId={user.id}
        role={combatRole}
        characters={characters}
        onLeave={() => {
          setCombatSessionId(null);
          setActiveSession(null);
        }}
      />
    );
  }

  // Home screen
  if (!selectedCharacterId) {
    return (
        <HomeScreen
          characters={characters}
          userEmail={user.email ?? ''}
          username={
            typeof user.user_metadata?.username === 'string' && user.user_metadata.username.trim()
              ? user.user_metadata.username
              : (user.email?.split('@')[0] ?? 'adventurer')
          }
          loading={charsLoading}
          onSelect={(id) => {
            setSelectedCharacterId(id);
            setSharedViewShareId(null);
            setActiveTab('sheet');
          }}
          onCreate={createCharacter}
          onDelete={deleteCharacter}
          onSignOut={signOut}
          onUpdateUsername={updateUsername}
          onUpdatePassword={updatePassword}
          onDeleteAccount={deleteAccount}
          onStartCombat={async () => {
            try {
              const sessionId = await createCombatSession(user.id);
              setCombatRole('dm');
              setCombatSessionId(sessionId);
            } catch (err: unknown) {
              showToast(err instanceof Error ? err.message : 'Failed to create combat session');
            }
        }}
        onJoinCombat={async (sessionId, characterId, charName, charClass, hp, maxHp, imageUrl, imagePosition) => {
          try {
            await joinCombatSession(sessionId, user.id, characterId, charName, charClass, hp, maxHp, imageUrl, imagePosition);
            setCombatRole('player');
            setCombatSessionId(sessionId);
          } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Failed to join combat session');
          }
        }}
        activeSession={activeSession}
        onRejoinCombat={(sessionId, role) => {
          setCombatRole(role);
          setCombatSessionId(sessionId);
        }}
        getSharesForCharacter={getSharesForCharacter}
        onShareCharacter={shareCharacter}
        onRevokeShare={revokeShare}
        pendingShares={pendingShares}
        acceptedShares={acceptedShares}
        onAcceptShare={acceptShare}
        onDeclineShare={declineShare}
        onUnfollowShare={async (shareId) => {
          try {
            await unfollowShare(shareId);
            if (sharedViewShareId === shareId) {
              setSelectedCharacterId(null);
              setSharedViewShareId(null);
            }
            showToast('Stopped following shared character.');
          } catch (error: unknown) {
            showToast(error instanceof Error ? error.message : 'Failed to unfollow shared character');
          }
        }}
        onSelectSharedCharacter={(characterId, shareId) => {
          setSelectedCharacterId(characterId);
          setSharedViewShareId(shareId);
          setActiveTab('sheet');
        }}
      />
    );
  }

  // Loading selected character
  if (charLoading || !character) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full"
            style={{
              border: '3px solid var(--border)',
              borderTopColor: 'var(--accent)',
              animation: 'diceRoll 1s linear infinite',
            }}
          />
          <p style={{ color: 'var(--text)', fontFamily: 'var(--heading)' }}>
            Loading character…
          </p>
        </div>
      </div>
    );
  }

  const strScore = scores.find((s) => s.ability === 'STR')?.score ?? 10;

  const abilityScoreMap = Object.fromEntries(
    (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const).map((a) => [
      a,
      scores.find((s) => s.ability === a)?.score ?? 10,
    ]),
  ) as Record<import('./types/database').Ability, number>;

  const preparedLimit = character
    ? getPreparedSpellLimit(character.class, character.level, abilityScoreMap)
    : null;


  const classEntries = characterClasses.length > 0
    ? characterClasses.map((c) => ({ className: c.class_name, level: c.level }))
    : character ? [{ className: character.class, level: character.level }] : [];

  const charIsWarlock = character ? isWarlock(classEntries) : false;
  const charIsDruid = character ? isDruid(classEntries) : false;
  const druidLevel = getClassLevel(classEntries, 'druid');

  // Find the share info for the read-only banner
  const currentShareInfo = isReadOnly
    ? acceptedShares.find((s) => s.share.id === sharedViewShareId)
    : null;

  // No-op handlers for read-only mode
  const noOpAsync = async () => {};
  const noOpUpdate = async () => ({} as ReturnType<typeof updateCharacter>);
  const noOpUpload = async () => null as string | null;

  return (
    <div className="flex flex-col lg:ml-20 min-h-screen">
      <ToastContainer />

      {showCombatTransition && (
        <CombatTransition
          onSwitchTab={() => setActiveTab('combat')}
          onComplete={() => setShowCombatTransition(false)}
        />
      )}

      {/* Top bar */}
      <header
        className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10"
        style={{
          background: 'linear-gradient(180deg, var(--bg) 0%, rgba(15,14,19,0.95) 100%)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <button
          onClick={() => { setSelectedCharacterId(null); setSharedViewShareId(null); applyTheme(getThemeById(DEFAULT_THEME)); }}
          className="p-2 rounded-lg bg-transparent cursor-pointer shrink-0 flex items-center gap-1"
          style={{
            color: 'var(--accent)',
            border: '1px solid var(--accent-border)',
            fontSize: '13px',
            fontFamily: 'var(--heading)',
          }}
        >
          <Users size={14} /> All Characters
        </button>
        <div className="flex-1" />

        {!isReadOnly && (
          <ThemePickerButton onClick={() => setShowThemePicker(true)} />
        )}
        <button
          onClick={() => setShowQuickRef(true)}
          className="p-2 rounded-lg bg-transparent cursor-pointer shrink-0 flex items-center justify-center"
          style={{
            color: activeTab === 'notes' ? 'var(--text)' : 'var(--text)',
            border: '1px solid var(--border)',
            transition: 'color 0.2s, border-color 0.2s',
          }}
          title="Quick Reference"
        >
          <HelpCircle size={16} />
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className="p-2 rounded-lg bg-transparent cursor-pointer shrink-0 flex items-center justify-center"
          style={{
            color: activeTab === 'notes' ? 'var(--accent)' : 'var(--text)',
            border: `1px solid ${activeTab === 'notes' ? 'var(--accent-border)' : 'var(--border)'}`,
            transition: 'color 0.2s, border-color 0.2s',
          }}
          title="Notes"
        >
          <ScrollText size={16} />
        </button>
        {isReadOnly ? (
          <button
            onClick={async () => {
              try {
                await copyCharacter(sharedViewShareId!);
                refreshCharacters();
                setSelectedCharacterId(null);
                setSharedViewShareId(null);
                showToast('Character copied to your collection!');
              } catch (err: unknown) {
                showToast(err instanceof Error ? err.message : 'Failed to copy character');
              }
            }}
            className="px-3 py-2 rounded-lg cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-semibold"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
              color: '#0f0e13',
              border: 'none',
              fontFamily: 'var(--heading)',
              letterSpacing: '0.5px',
            }}
          >
            <Copy size={13} /> Copy
          </button>
        ) : (
          <ExportPdfButton
            onExport={(pdfStyle: PdfStyle) => {
              exportCharacterPdf({
                character,
                scores,
                slots,
                spells,
                items,
                features,
                notes,
              }, pdfStyle);
            }}
          />
        )}
      </header>

      {/* Read-only banner */}
      {isReadOnly && (
        <div
          className="flex items-center justify-center gap-2 px-4 py-2"
          style={{
            background: 'linear-gradient(135deg, rgba(147,130,220,0.1) 0%, rgba(147,130,220,0.05) 100%)',
            borderBottom: '1px solid rgba(147,130,220,0.2)',
          }}
        >
          <Eye size={13} style={{ color: '#a78bfa' }} />
          <span className="text-xs" style={{ color: '#a78bfa' }}>
            Read Only
            {currentShareInfo && (
              <> · Shared by {currentShareInfo.share.sender_username || currentShareInfo.share.sender_email}</>
            )}
          </span>
        </div>
      )}

      {/* Tab content with fade transition */}
      <main id="main-content" className="flex-1 overflow-y-auto pb-24 lg:pb-6">
        <div key={activeTab} className="animate-fade-in" style={isReadOnly ? { pointerEvents: 'none' } : undefined}>
          {activeTab === 'sheet' && (
            <CharacterSheet
              character={character}
              scores={scores}
              onUpdateCharacter={isReadOnly ? noOpUpdate : updateCharacter}
              onUpdateScore={isReadOnly ? noOpAsync : updateScore}
              onToggleSavingThrow={isReadOnly ? noOpAsync : toggleSavingThrow}
              imageUploading={imageUploading}
              imageError={imageError}
              onUploadImage={isReadOnly ? noOpUpload : uploadImage}
              onDeleteImage={isReadOnly ? noOpAsync : deleteImage}
              readOnly={isReadOnly}
              onOpenWildShapeModal={isReadOnly ? undefined : () => setShowWildShapeModal(true)}
              characterClasses={characterClasses}
              onAddClass={isReadOnly ? undefined : addClass}
              onUpdateClassLevel={isReadOnly ? undefined : updateClassLevel}
              onUpdateClassName={isReadOnly ? undefined : updateClassName}
              onRemoveClass={isReadOnly ? undefined : removeClass}
              onMigrateToMulticlass={isReadOnly ? undefined : migrateToMulticlass}
              onUpdatePrimaryCastingClass={isReadOnly ? undefined : (cls) => updateCharacter({ primary_casting_class: cls })}
            />
          )}
          {activeTab === 'hp' && (
            <HpTracker
              character={character}
              onUpdate={isReadOnly ? noOpUpdate : updateCharacter}
              onOpenWildShapeModal={isReadOnly ? undefined : () => setShowWildShapeModal(true)}
              charIsDruid={charIsDruid}
            />
          )}
          {activeTab === 'spells' && (
            <SpellSlots
              slots={slots}
              spells={spells}
              preparedLimit={preparedLimit}
              characterClass={character.class}
              characterLevel={character.level}
              concentrationSpellId={character.concentration_spell_id}
              onUpdateTotal={isReadOnly ? noOpAsync : updateTotal}
              onSetSlotUsed={isReadOnly ? noOpAsync : setSlotUsed}
              onAutoFillSlots={isReadOnly ? noOpAsync : autoFillSlots}
              onAddSpell={isReadOnly ? noOpAsync : addSpell}
              onUpdateSpell={isReadOnly ? noOpAsync : updateSpell}
              onDeleteSpell={isReadOnly ? noOpAsync : deleteSpell}
              onSetConcentration={isReadOnly ? noOpAsync : (spellId: string | null) => updateCharacter({ concentration_spell_id: spellId })}
            />
          )}
          {activeTab === 'items' && (
            <Inventory
              items={items}
              strScore={strScore}
              onAdd={isReadOnly ? noOpAsync : addItem}
              onUpdate={isReadOnly ? noOpAsync : updateItem}
              onDelete={isReadOnly ? noOpAsync : deleteItem}
            />
          )}
          {activeTab === 'weapons' && (
            <Weapons
              weapons={weapons}
              scores={scores}
              level={character.level}
              onAdd={isReadOnly ? noOpAsync : addWeapon}
              onUpdate={isReadOnly ? noOpAsync : updateWeapon}
              onDelete={isReadOnly ? noOpAsync : deleteWeapon}
            />
          )}
          {activeTab === 'features' && (
            <FeaturesTraits
              features={features}
              onAdd={isReadOnly ? noOpAsync : addFeature}
              onUpdate={isReadOnly ? noOpAsync : updateFeature}
              onDelete={isReadOnly ? noOpAsync : deleteFeature}
            />
          )}
          {activeTab === 'notes' && (
            <Notes notes={notes} loading={notesLoading} onUpdateContent={isReadOnly ? noOpAsync : updateContent} />
          )}
          {activeTab === 'combat' && (
            <CombatView
              character={character}
              scores={scores}
              slots={slots}
              spells={spells}
              weapons={weapons}
              features={features}
              onUpdateCharacter={isReadOnly ? noOpUpdate : updateCharacter}
              onSetSlotUsed={isReadOnly ? noOpAsync : setSlotUsed}
              onUpdateFeature={isReadOnly ? noOpAsync : updateFeature}
              onOpenWildShapeModal={isReadOnly ? undefined : () => setShowWildShapeModal(true)}
              charIsDruid={charIsDruid}
            />
          )}
        </div>
      </main>

      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Unified Action FAB (Dice + Short Rest + Long Rest) */}
      {!isReadOnly && !showDiceRoller && !showQuickRef && (
        <ActionFAB
          onOpenDiceRoller={() => setShowDiceRoller(true)}
          isWarlock={charIsWarlock}
          currentHp={character.current_hp}
          maxHp={character.max_hp}
          onRestoreHp={(amount: number) => {
            const nextHp = Math.min(character.max_hp, character.current_hp + amount);
            return updateCharacter({ current_hp: nextHp });
          }}
          onRestoreWarlockSlots={charIsWarlock ? resetAll : undefined}
          onRestoreShortRestUses={() => resetUsesByRestType('short_rest')}
          onRestoreSlots={resetAll}
          onRestoreUses={resetAllUses}
          onResetDeathSaves={() => updateCharacter({ death_save_successes: 0, death_save_failures: 0 })}
          onClearConditions={() => updateCharacter({ conditions: [] })}
          onDropConcentration={() => updateCharacter({ concentration_spell_id: null })}
        />
      )}
      {showDiceRoller && (
        <DiceRoller
          onClose={() => setShowDiceRoller(false)}
          lastRoll={diceRoller.lastRoll}
          history={diceRoller.history}
          isRolling={diceRoller.isRolling}
          onRoll={diceRoller.roll}
          onClearHistory={diceRoller.clearHistory}
          quickRolls={buildQuickRolls(
            abilityScoreMap,
            character.level,
            character.skill_proficiencies ?? [],
            scores.filter((s) => s.saving_throw_proficiency).map((s) => s.ability) as Ability[],
            weapons.map((w) => ({ name: w.name, damage_dice: w.damage_dice, ability_mod: w.ability_mod as Ability, proficient: w.proficient })),
          )}
        />
      )}

      {/* Quick Reference Overlay */}
      {showQuickRef && (
        <QuickReference onClose={() => setShowQuickRef(false)} />
      )}
      {showThemePicker && character && (
        <ThemePicker
          currentTheme={character.theme}
          onSelect={async (themeId: ThemeId) => {
            applyTheme(getThemeById(themeId));
            await updateCharacter({ theme: themeId });
            setShowThemePicker(false);
            showToast(`Theme: ${getThemeById(themeId).name}`);
          }}
          onClose={() => setShowThemePicker(false)}
        />
      )}
      {showWildShapeModal && character && charIsDruid && (
        <WildShapeModal
          druidLevel={druidLevel}
          customBeasts={customBeasts}
          onSelect={handleActivateWildShape}
          onAddCustomBeast={addCustomBeast}
          onDeleteCustomBeast={deleteCustomBeast}
          onClose={() => setShowWildShapeModal(false)}
        />
      )}
    </div>
  );
}

export default App;

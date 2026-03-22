import { useState, useCallback } from 'react';
import type { Tab } from './types/database';
import { isSupabaseConfigured } from './lib/supabase';
import { getPreparedSpellLimit } from './constants/dnd';
import { useAuth } from './hooks/useAuth';
import { useCharacters } from './hooks/useCharacters';
import { useCharacter } from './hooks/useCharacter';
import { useAbilityScores } from './hooks/useAbilityScores';
import { useSpellSlots } from './hooks/useSpellSlots';
import { useSpells } from './hooks/useSpells';
import { useInventory } from './hooks/useInventory';
import { useFeatures } from './hooks/useFeatures';
import { useNotes } from './hooks/useNotes';
import { Auth } from './components/Auth';
import { HomeScreen } from './components/HomeScreen';
import { CharacterSheet } from './components/CharacterSheet';
import { HpTracker } from './components/HpTracker';
import { SpellSlots } from './components/SpellSlots';
import { Inventory } from './components/Inventory';
import { FeaturesTraits } from './components/FeaturesTraits';
import { Notes } from './components/Notes';
import { CombatView } from './components/CombatView';
import { TabBar } from './components/TabBar';
import { CombatTransition } from './components/CombatTransition';
import { ToastContainer } from './components/Toast';
import { DiceRoller } from './components/DiceRoller';
import { ExportPdfButton } from './components/ExportPdf';
import { exportCharacterPdf } from './lib/exportPdf';
import type { PdfStyle } from './lib/exportPdf';
import { ChevronLeft } from 'lucide-react';
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
          background: 'linear-gradient(180deg, var(--bg-raised) 0%, var(--bg-surface) 100%)',
          border: '1px solid var(--accent-border)',
          boxShadow: 'var(--shadow-lg), 0 0 30px rgba(201,168,76,0.06)',
        }}
      >
        <h1
          className="text-center mb-1 animate-shimmer"
          style={{ fontSize: '1.6rem', letterSpacing: '1px' }}
        >
          ⚔️ D&D Character Manager
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
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('sheet');
  const [showCombatTransition, setShowCombatTransition] = useState(false);

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

  const { characters, loading: charsLoading, createCharacter, deleteCharacter } =
    useCharacters(user?.id);
  const { character, loading: charLoading, updateCharacter } =
    useCharacter(selectedCharacterId);
  const { scores, updateScore, toggleSavingThrow } =
    useAbilityScores(selectedCharacterId);
  const { slots, updateTotal, setSlotUsed, resetAll } =
    useSpellSlots(selectedCharacterId);
  const { spells, addSpell, updateSpell, deleteSpell } =
    useSpells(selectedCharacterId);
  const { items, addItem, updateItem, deleteItem } = useInventory(selectedCharacterId);
  const { features, addFeature, deleteFeature } = useFeatures(selectedCharacterId);
  const { notes, loading: notesLoading, updateContent } = useNotes(selectedCharacterId);

  async function handleAuth(email: string, password: string, isSignUp: boolean) {
    if (isSignUp) await signUp(email, password);
    else await signIn(email, password);
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

  // Not authenticated
  if (!user) {
    return <Auth onAuth={handleAuth} />;
  }

  // Home screen
  if (!selectedCharacterId) {
    return (
      <HomeScreen
        characters={characters}
        loading={charsLoading}
        onSelect={(id) => {
          setSelectedCharacterId(id);
          setActiveTab('sheet');
        }}
        onCreate={createCharacter}
        onDelete={deleteCharacter}
        onSignOut={signOut}
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

  return (
    <div className="flex flex-col min-h-screen">
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
          onClick={() => setSelectedCharacterId(null)}
          className="p-2 rounded-lg bg-transparent cursor-pointer shrink-0 flex items-center gap-1"
          style={{
            color: 'var(--accent)',
            border: '1px solid var(--accent-border)',
            fontSize: '13px',
            fontFamily: 'var(--heading)',
          }}
        >
          <ChevronLeft size={14} /> Back
        </button>
        <div className="flex-1 min-w-0">
          <h1
            className="text-base font-bold m-0 truncate animate-shimmer"
            style={{ fontSize: '1rem', letterSpacing: '0.5px' }}
          >
            {character.name}
          </h1>
          <p className="text-xs m-0 truncate" style={{ color: 'var(--text)' }}>
            {[character.race, character.class].filter(Boolean).join(' · ')}
            {character.level > 0 && ` · Lvl ${character.level}`}
          </p>
        </div>
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
      </header>

      {/* Tab content with fade transition */}
      <main className="flex-1 overflow-y-auto">
        <div key={activeTab} className="animate-fade-in">
          {activeTab === 'sheet' && (
            <CharacterSheet
              character={character}
              scores={scores}
              onUpdateCharacter={updateCharacter}
              onUpdateScore={updateScore}
              onToggleSavingThrow={toggleSavingThrow}
            />
          )}
          {activeTab === 'hp' && (
            <HpTracker character={character} onUpdate={updateCharacter} />
          )}
          {activeTab === 'spells' && (
            <SpellSlots
              slots={slots}
              spells={spells}
              preparedLimit={preparedLimit}
              onUpdateTotal={updateTotal}
              onSetSlotUsed={setSlotUsed}
              onResetAll={resetAll}
              onAddSpell={addSpell}
              onUpdateSpell={updateSpell}
              onDeleteSpell={deleteSpell}
            />
          )}
          {activeTab === 'items' && (
            <Inventory
              items={items}
              strScore={strScore}
              onAdd={addItem}
              onUpdate={updateItem}
              onDelete={deleteItem}
            />
          )}
          {activeTab === 'features' && (
            <FeaturesTraits
              features={features}
              onAdd={addFeature}
              onDelete={deleteFeature}
            />
          )}
          {activeTab === 'notes' && (
            <Notes notes={notes} loading={notesLoading} onUpdateContent={updateContent} />
          )}
          {activeTab === 'combat' && (
            <CombatView
              character={character}
              scores={scores}
              slots={slots}
              spells={spells}
              features={features}
              onUpdateCharacter={updateCharacter}
              onSetSlotUsed={setSlotUsed}
            />
          )}
        </div>
      </main>

      <DiceRoller />
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

export default App;

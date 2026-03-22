import { useState } from 'react';
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
import { TabBar } from './components/TabBar';
import './App.css';

function SetupScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div
        className="w-full max-w-md p-6 rounded-xl"
        style={{
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <h1
          className="text-2xl font-bold mb-4 text-center"
          style={{ color: 'var(--text-h)', fontSize: '1.5rem', letterSpacing: 'normal' }}
        >
          ⚔️ D&D Character Manager
        </h1>
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: 'var(--text-h)', fontSize: '1.1rem' }}
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
            Open the <strong style={{ color: 'var(--text-h)' }}>SQL Editor</strong> and
            paste the contents of{' '}
            <code
              style={{
                background: 'var(--code-bg)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              schema.sql
            </code>
          </li>
          <li>
            Copy{' '}
            <code
              style={{
                background: 'var(--code-bg)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              .env.local.example
            </code>{' '}
            →{' '}
            <code
              style={{
                background: 'var(--code-bg)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              .env.local
            </code>
          </li>
          <li>
            Fill in{' '}
            <code
              style={{
                background: 'var(--code-bg)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              VITE_SUPABASE_URL
            </code>{' '}
            and{' '}
            <code
              style={{
                background: 'var(--code-bg)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              VITE_SUPABASE_ANON_KEY
            </code>{' '}
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
        <p style={{ color: 'var(--text)' }}>Loading…</p>
      </div>
    );
  }

  // Supabase not configured — show setup instructions
  if (!isSupabaseConfigured) {
    return <SetupScreen />;
  }

  // Not authenticated
  if (!user) {
    return <Auth onAuth={handleAuth} />;
  }

  // Home screen — character selector
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
        <p style={{ color: 'var(--text)' }}>Loading character…</p>
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
      {/* Top bar */}
      <header
        className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={() => setSelectedCharacterId(null)}
          className="p-2 rounded-lg bg-transparent cursor-pointer shrink-0"
          style={{
            color: 'var(--text-h)',
            border: '1px solid var(--border)',
            fontSize: '14px',
          }}
        >
          ← Back
        </button>
        <div className="flex-1 min-w-0">
          <h1
            className="text-base font-bold m-0 truncate"
            style={{ color: 'var(--text-h)', fontSize: '1rem', letterSpacing: 'normal' }}
          >
            {character.name}
          </h1>
          <p className="text-xs m-0 truncate" style={{ color: 'var(--text)' }}>
            {[character.race, character.class].filter(Boolean).join(' · ')}
            {character.level > 0 && ` · Lvl ${character.level}`}
          </p>
        </div>
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto">
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
      </main>

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;

# Copilot Instructions — D&D 5e Character Manager

## Build & Dev Commands

```bash
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # Type-check (tsc -b) then Vite production build
npm run lint         # ESLint across all .ts/.tsx files
npm run preview      # Preview production build locally
```

There is no test runner configured in this project.

## Architecture

**Stack:** React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + Supabase (Postgres + Auth + RLS).

**Routing is state-based** — there is no React Router. `App.tsx` uses `selectedCharacterId` and `activeTab` state to decide what to render. The screen hierarchy is: SetupScreen → Auth → HomeScreen → character tab views. Entering combat mode (`combatSessionId` state) switches to the `LiveCombat` component entirely.

**All data hooks live in `src/hooks/`** and are instantiated in `App.tsx`. Props and callbacks flow downward to components — there is no external state library, context, or Redux.

**Supabase Realtime** is used only for live combat sessions (`useCombatSession`), subscribing to `combat_sessions`, `session_participants`, and `combatants` tables filtered by session ID. Character sheet data does not use realtime subscriptions.

**Database schema** is defined in `schema.sql` at the repo root. All tables use Row Level Security (RLS) — child tables authorize via subqueries on the `characters` table's `user_id`. The schema must be run manually in the Supabase SQL Editor.

## Key Conventions

### Hooks

Every data hook (`useAbilityScores`, `useSpellSlots`, `useInventory`, etc.) follows the same pattern:

- State: `const [data, setData] = useState<T[]>([]); const [loading, setLoading] = useState(true);`
- Fetch in `useEffect` with an `active` flag to guard against race conditions on unmount/re-render.
- **Optimistic updates**: mutate local state immediately, then fire the async Supabase call. Errors are logged to `console.error` only — there is no user-facing error state.
- Return an object with data, loading flag, and mutation functions.
- All hooks that operate on a character take `characterId` as their dependency.

### Types

`src/types/database.ts` contains hand-written interfaces that mirror the Supabase table schemas exactly (snake_case column names). When modifying `schema.sql`, update these types to match.

### Styling

The app uses a **dark fantasy theme** with gold accents. Theming is done through CSS custom properties defined in `src/index.css` (e.g., `--bg`, `--text`, `--accent`, `--border`). Components apply these via inline `style` props:

```tsx
style={{ color: 'var(--text)', background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
```

Tailwind utility classes are used for layout (`flex`, `grid`, `gap-*`, `px-*`). Custom keyframe animations (40+) are defined in `index.css` and applied via utility classes like `.animate-fade-in`, `.combat-entrance`, `.hp-pulse`.

### Toasts

Use the fire-and-forget `showToast(message)` function from `src/lib/toast.ts` for notifications. It uses a module-level dispatcher pattern — no context or prop drilling needed.

### D&D Game Logic

`src/constants/dnd.ts` contains all 5e-specific rules: ability score modifiers (`(score - 10) / 2`), proficiency bonus by level, spellcasting ability per class, spell save DC, spell attack bonus, and prepared spell limits. Add new game mechanics here rather than inlining formulas in components.

### Environment

Supabase credentials go in `.env.local` (see `.env.local.example`). The Supabase client in `src/lib/supabase.ts` exports an `isSupabaseConfigured` flag — when false, the app shows a setup screen instead of crashing.

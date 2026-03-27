# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # Type-check (tsc -b) then Vite production build
npm run lint         # ESLint across all .ts/.tsx files
npm run preview      # Preview production build locally
```

There is no test runner configured in this project.

## Architecture

**Stack:** React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + Supabase (Postgres + Auth + RLS + Realtime).

**Routing is state-based** — no React Router. `App.tsx` uses `selectedCharacterId` and `activeTab` state to decide what to render. Screen hierarchy: SetupScreen → Auth → HomeScreen → character tab views. Setting `combatSessionId` switches to the `LiveCombat` component. Guest mode stores data in localStorage under `dnd-guest-character`.

**All data hooks live in `src/hooks/`** and are instantiated in `App.tsx`. Props and callbacks flow downward — no context, Redux, or external state library.

**Supabase Realtime** is used only for live combat sessions (`useCombatSession`), not for character sheet data.

**Database schema** is in `schema.sql` at repo root. All tables use Row Level Security (RLS) — child tables authorize via subqueries on `characters.user_id`. Schema changes must be run manually in the Supabase SQL Editor.

## Key Conventions

### Hook Pattern

Every data hook follows the same pattern:
- `useState` for data array + loading flag
- `useEffect` fetch with an `active` flag guard against race conditions
- **Optimistic updates**: mutate local state immediately, then fire async Supabase call
- Errors logged to `console.error` only — no user-facing error state
- All hooks take `characterId` as their dependency

### Types

`src/types/database.ts` has hand-written interfaces mirroring Supabase table schemas (snake_case). When modifying `schema.sql`, update these types to match.

### SQL Changes

When a change introduces or modifies SQL, always include exact runnable SQL in a fenced `sql` code block, copy/paste-ready for Supabase SQL Editor.

### Styling

Dark fantasy theme with gold accents. Theming via CSS custom properties in `src/index.css` (`--bg`, `--text`, `--accent`, `--border`, etc.) applied through inline `style` props:

```tsx
style={{ color: 'var(--text)', background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
```

Tailwind utilities for layout (`flex`, `grid`, `gap-*`). Custom keyframe animations (40+) defined in `index.css`.

### Toasts

Use `showToast(message)` from `src/lib/toast.ts` — module-level dispatcher, no context or prop drilling needed.

### D&D Game Logic

`src/constants/dnd.ts` contains all 5e rules: ability modifiers, proficiency bonus, spellcasting ability per class, spell save DC, prepared spell limits. Add new game mechanics here rather than inlining formulas in components.

### Environment

Supabase credentials in `.env.local` (see `.env.local.example`). `src/lib/supabase.ts` exports `isSupabaseConfigured` — when false, app shows setup screen.

## Commit Policy

Do NOT commit or push changes automatically. Stage changes only; the user will review and commit manually.

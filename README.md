# D&D 5e Character Manager

A single-page app for managing Dungeons & Dragons 5th Edition characters, built with React, TypeScript, Vite, Tailwind CSS v4, and Supabase.

## Features

- **Character Selector** — create, switch between, and delete characters
- **Character Sheet** — ability scores with auto-calculated modifiers, proficiency bonus, saving throw & skill proficiency toggles
- **HP Tracker** — current / max / temp HP with large touch-friendly ± buttons and a colour-coded health bar
- **Spell Slots** — levels 1–9 with individual slot toggles and a Long Rest reset
- **Inventory** — items with name, quantity, weight, notes; total weight vs. carry capacity (STR × 15)
- **Features & Traits** — expandable list with title, source, and description
- **Notes** — plain text scratchpad with auto-save (500 ms debounce)

Navigation uses a bottom tab bar optimised for iPhone / iPad (large touch targets, safe-area insets).

---

## Getting Started

### 1. Clone & install

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the Supabase dashboard, open the **SQL Editor**.
3. Paste the entire contents of **`schema.sql`** (in the repo root) and click **Run**.
   This creates all six tables (`characters`, `ability_scores`, `spell_slots`, `inventory_items`, `features`, `notes`), enables Row Level Security, and adds the required RLS policies.
4. In **Authentication → Settings**, make sure email/password sign-ups are enabled (they are by default).

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in:

| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase dashboard → **Settings → API → Project URL** |
| `VITE_SUPABASE_ANON_KEY` | Supabase dashboard → **Settings → API → `anon` `public`** key |
| `VITE_FEEDBACK_EMAIL` | Email address that receives in-app bug reports and feature requests |

### 4. Run the dev server

```bash
npm run dev
```

Open the URL shown in your terminal (usually `http://localhost:5173`).

### 5. Build for production

```bash
npm run build
npm run preview   # optional — test the production build locally
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Build | Vite 8 |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| State | React hooks — no external state library |

---

## Project Structure

```
schema.sql              ← Supabase SQL schema + RLS policies
.env.local.example      ← env template
src/
  lib/supabase.ts       ← Supabase client initialisation
  types/database.ts     ← TypeScript interfaces
  constants/dnd.ts      ← D&D 5e constants (abilities, skills, modifiers)
  hooks/                ← Custom hooks for auth, characters, scores, etc.
  components/           ← UI components (one per feature tab)
  App.tsx               ← Root component with routing + state
  App.css               ← Minimal app-specific styles
  index.css             ← Tailwind + CSS custom properties (theme)
```

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

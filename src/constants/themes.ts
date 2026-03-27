export type ThemeId =
  | 'dark-fantasy'
  | 'arcane-tome'
  | 'shadow-guild'
  | 'sacred-grove'
  | 'divine-radiance'
  | 'forge-and-iron'
  | 'fey-wild'
  | 'infernal';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  colors: {
    text: string;
    textH: string;
    bg: string;
    bgSurface: string;
    bgRaised: string;
    border: string;
    borderLight: string;
    codeBg: string;
    accent: string;
    accentBright: string;
    accentBg: string;
    accentBorder: string;
    hpGreen: string;
    hpYellow: string;
    hpRed: string;
    hpCrimson: string;
    spellIndigo: string;
    spellViolet: string;
    spellBg: string;
    spellBorder: string;
    danger: string;
    dangerBright: string;
  };
  fonts: {
    heading: string;
  };
  backgroundGradient: string;
  backgroundGradientLg: string;
  backgroundTexture: string;
  textureOpacity: number;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'dark-fantasy',
    name: 'Dark Fantasy',
    description: 'Classic dark theme with gold accents',
    colors: {
      text: '#9590a8',
      textH: '#e8e0f0',
      bg: '#0f0e13',
      bgSurface: '#16151d',
      bgRaised: '#1c1b25',
      border: '#2a2836',
      borderLight: '#3a3750',
      codeBg: '#1a1922',
      accent: '#c9a84c',
      accentBright: '#f0c040',
      accentBg: 'rgba(201, 168, 76, 0.12)',
      accentBorder: 'rgba(201, 168, 76, 0.35)',
      hpGreen: '#4ade80',
      hpYellow: '#fbbf24',
      hpRed: '#b91c1c',
      hpCrimson: '#dc2626',
      spellIndigo: '#6366f1',
      spellViolet: '#8b5cf6',
      spellBg: 'rgba(99, 102, 241, 0.1)',
      spellBorder: 'rgba(99, 102, 241, 0.3)',
      danger: '#b91c1c',
      dangerBright: '#ef4444',
    },
    fonts: {
      heading: "'Cinzel', Georgia, 'Times New Roman', serif",
    },
    backgroundGradient:
      'radial-gradient(ellipse at 50% 0%, rgba(201, 168, 76, 0.03) 0%, transparent 60%), var(--bg)',
    backgroundGradientLg:
      'radial-gradient(ellipse at 50% 0%, rgba(201, 168, 76, 0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(99, 102, 241, 0.02) 0%, transparent 40%), var(--bg)',
    backgroundTexture: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a84c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    textureOpacity: 0.025,
  },
  {
    id: 'arcane-tome',
    name: 'Arcane Tome',
    description: 'Deep navy with gold filigree and glowing rune accents',
    colors: {
      text: '#8b9ec7',
      textH: '#d4dff7',
      bg: '#0a0e1a',
      bgSurface: '#101728',
      bgRaised: '#151e33',
      border: '#1e2d4a',
      borderLight: '#2a3f66',
      codeBg: '#0e1525',
      accent: '#b4944a',
      accentBright: '#dbb863',
      accentBg: 'rgba(180, 148, 74, 0.12)',
      accentBorder: 'rgba(180, 148, 74, 0.35)',
      hpGreen: '#4ade80',
      hpYellow: '#fbbf24',
      hpRed: '#b91c1c',
      hpCrimson: '#dc2626',
      spellIndigo: '#7c8cf8',
      spellViolet: '#a78bfa',
      spellBg: 'rgba(124, 140, 248, 0.12)',
      spellBorder: 'rgba(124, 140, 248, 0.35)',
      danger: '#b91c1c',
      dangerBright: '#ef4444',
    },
    fonts: {
      heading: "'Cinzel Decorative', 'Cinzel', Georgia, serif",
    },
    backgroundGradient:
      'radial-gradient(ellipse at 50% 0%, rgba(124, 140, 248, 0.06) 0%, transparent 60%), var(--bg)',
    backgroundGradientLg:
      'radial-gradient(ellipse at 50% 0%, rgba(124, 140, 248, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(180, 148, 74, 0.03) 0%, transparent 40%), var(--bg)',
    backgroundTexture: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%237c8cf8' fill-opacity='1'%3E%3Ccircle cx='20' cy='20' r='1.5'/%3E%3Ccircle cx='0' cy='0' r='1'/%3E%3Ccircle cx='40' cy='0' r='1'/%3E%3Ccircle cx='0' cy='40' r='1'/%3E%3Ccircle cx='40' cy='40' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
    textureOpacity: 0.04,
  },
  {
    id: 'shadow-guild',
    name: 'Shadow Guild',
    description: 'Near-black with crimson accents and a worn leather feel',
    colors: {
      text: '#9a8e8e',
      textH: '#e0d4d4',
      bg: '#0c0a0a',
      bgSurface: '#141010',
      bgRaised: '#1a1414',
      border: '#2d2222',
      borderLight: '#3d2e2e',
      codeBg: '#120e0e',
      accent: '#c43c3c',
      accentBright: '#e85454',
      accentBg: 'rgba(196, 60, 60, 0.12)',
      accentBorder: 'rgba(196, 60, 60, 0.35)',
      hpGreen: '#4ade80',
      hpYellow: '#fbbf24',
      hpRed: '#b91c1c',
      hpCrimson: '#dc2626',
      spellIndigo: '#8b6fc0',
      spellViolet: '#a78bfa',
      spellBg: 'rgba(139, 111, 192, 0.1)',
      spellBorder: 'rgba(139, 111, 192, 0.3)',
      danger: '#b91c1c',
      dangerBright: '#ef4444',
    },
    fonts: {
      heading: "'Pirata One', 'Georgia', cursive",
    },
    backgroundGradient:
      'radial-gradient(ellipse at 50% 0%, rgba(196, 60, 60, 0.04) 0%, transparent 60%), var(--bg)',
    backgroundGradientLg:
      'radial-gradient(ellipse at 50% 0%, rgba(196, 60, 60, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(139, 111, 192, 0.02) 0%, transparent 40%), var(--bg)',
    backgroundTexture: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c43c3c' fill-opacity='1'%3E%3Cpath d='M25 0l2 4-2 2-2-2 2-4zm0 44l2 4-2 2-2-2 2-4zM0 25l4-2 2 2-2 2-4-2zm44 0l4-2 2 2-2 2-4-2z'/%3E%3C/g%3E%3C/svg%3E")`,
    textureOpacity: 0.02,
  },
  {
    id: 'sacred-grove',
    name: 'Sacred Grove',
    description: 'Earthy greens and bark browns with dappled light',
    colors: {
      text: '#8da88d',
      textH: '#d4e8d4',
      bg: '#0b100b',
      bgSurface: '#111a11',
      bgRaised: '#162016',
      border: '#243024',
      borderLight: '#324532',
      codeBg: '#0f160f',
      accent: '#6db56d',
      accentBright: '#8dd38d',
      accentBg: 'rgba(109, 181, 109, 0.12)',
      accentBorder: 'rgba(109, 181, 109, 0.30)',
      hpGreen: '#4ade80',
      hpYellow: '#fbbf24',
      hpRed: '#b91c1c',
      hpCrimson: '#dc2626',
      spellIndigo: '#5a9e6f',
      spellViolet: '#7bc88f',
      spellBg: 'rgba(90, 158, 111, 0.1)',
      spellBorder: 'rgba(90, 158, 111, 0.3)',
      danger: '#b91c1c',
      dangerBright: '#ef4444',
    },
    fonts: {
      heading: "'MedievalSharp', 'Georgia', cursive",
    },
    backgroundGradient:
      'radial-gradient(ellipse at 50% 0%, rgba(109, 181, 109, 0.04) 0%, transparent 60%), var(--bg)',
    backgroundGradientLg:
      'radial-gradient(ellipse at 30% 20%, rgba(109, 181, 109, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(139, 119, 72, 0.04) 0%, transparent 40%), var(--bg)',
    backgroundTexture: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236db56d' fill-opacity='1'%3E%3Cpath d='M15 10c2-3 5-3 7 0s2 7 0 10-5 3-7 0-2-7 0-10z'/%3E%3Cpath d='M45 40c2-3 5-3 7 0s2 7 0 10-5 3-7 0-2-7 0-10z'/%3E%3C/g%3E%3C/svg%3E")`,
    textureOpacity: 0.02,
  },
  {
    id: 'divine-radiance',
    name: 'Divine Radiance',
    description: 'Warm ivory and gold with heavenly glow effects',
    colors: {
      text: '#6b6475',
      textH: '#2e2438',
      bg: '#f5f0e8',
      bgSurface: '#ede6da',
      bgRaised: '#e8dfd0',
      border: '#d4c9b5',
      borderLight: '#c4b8a0',
      codeBg: '#ebe3d5',
      accent: '#b8860b',
      accentBright: '#d4a017',
      accentBg: 'rgba(184, 134, 11, 0.10)',
      accentBorder: 'rgba(184, 134, 11, 0.30)',
      hpGreen: '#16a34a',
      hpYellow: '#ca8a04',
      hpRed: '#b91c1c',
      hpCrimson: '#dc2626',
      spellIndigo: '#7c5cbf',
      spellViolet: '#9b6fd4',
      spellBg: 'rgba(124, 92, 191, 0.08)',
      spellBorder: 'rgba(124, 92, 191, 0.25)',
      danger: '#b91c1c',
      dangerBright: '#dc2626',
    },
    fonts: {
      heading: "'Cormorant Garamond', 'Georgia', serif",
    },
    backgroundGradient:
      'radial-gradient(ellipse at 50% 0%, rgba(184, 134, 11, 0.06) 0%, transparent 60%), var(--bg)',
    backgroundGradientLg:
      'radial-gradient(ellipse at 50% 0%, rgba(184, 134, 11, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(124, 92, 191, 0.03) 0%, transparent 40%), var(--bg)',
    backgroundTexture: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23b8860b' fill-opacity='1'%3E%3Ccircle cx='40' cy='40' r='1.5'/%3E%3Ccircle cx='0' cy='40' r='1'/%3E%3Ccircle cx='80' cy='40' r='1'/%3E%3Ccircle cx='40' cy='0' r='1'/%3E%3Ccircle cx='40' cy='80' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
    textureOpacity: 0.04,
  },
  {
    id: 'forge-and-iron',
    name: 'Forge & Iron',
    description: 'Dark steel grays with orange ember accents',
    colors: {
      text: '#9a9a9a',
      textH: '#e0e0e0',
      bg: '#0e0e0e',
      bgSurface: '#161616',
      bgRaised: '#1c1c1c',
      border: '#2e2e2e',
      borderLight: '#404040',
      codeBg: '#141414',
      accent: '#e07020',
      accentBright: '#f09040',
      accentBg: 'rgba(224, 112, 32, 0.12)',
      accentBorder: 'rgba(224, 112, 32, 0.35)',
      hpGreen: '#4ade80',
      hpYellow: '#fbbf24',
      hpRed: '#b91c1c',
      hpCrimson: '#dc2626',
      spellIndigo: '#c07030',
      spellViolet: '#d49050',
      spellBg: 'rgba(192, 112, 48, 0.1)',
      spellBorder: 'rgba(192, 112, 48, 0.3)',
      danger: '#b91c1c',
      dangerBright: '#ef4444',
    },
    fonts: {
      heading: "'Bungee Shade', 'Impact', sans-serif",
    },
    backgroundGradient:
      'radial-gradient(ellipse at 50% 100%, rgba(224, 112, 32, 0.05) 0%, transparent 60%), var(--bg)',
    backgroundGradientLg:
      'radial-gradient(ellipse at 50% 100%, rgba(224, 112, 32, 0.07) 0%, transparent 50%), radial-gradient(ellipse at 20% 20%, rgba(200, 200, 200, 0.02) 0%, transparent 40%), var(--bg)',
    backgroundTexture: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23e07020' fill-opacity='1'%3E%3Crect x='0' y='0' width='2' height='2'/%3E%3Crect x='20' y='20' width='2' height='2'/%3E%3C/g%3E%3C/svg%3E")`,
    textureOpacity: 0.03,
  },
  {
    id: 'fey-wild',
    name: 'Fey Wild',
    description: 'Iridescent pastels with shifting hues and organic shapes',
    colors: {
      text: '#9a8db8',
      textH: '#e8ddf8',
      bg: '#0e0a14',
      bgSurface: '#16101f',
      bgRaised: '#1d1529',
      border: '#2e2542',
      borderLight: '#3f3558',
      codeBg: '#140f1c',
      accent: '#c77dff',
      accentBright: '#e0a0ff',
      accentBg: 'rgba(199, 125, 255, 0.12)',
      accentBorder: 'rgba(199, 125, 255, 0.30)',
      hpGreen: '#4ade80',
      hpYellow: '#fbbf24',
      hpRed: '#b91c1c',
      hpCrimson: '#dc2626',
      spellIndigo: '#60d4a0',
      spellViolet: '#80e8b8',
      spellBg: 'rgba(96, 212, 160, 0.1)',
      spellBorder: 'rgba(96, 212, 160, 0.3)',
      danger: '#b91c1c',
      dangerBright: '#ef4444',
    },
    fonts: {
      heading: "'MedievalSharp', 'Georgia', cursive",
    },
    backgroundGradient:
      'radial-gradient(ellipse at 30% 0%, rgba(199, 125, 255, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, rgba(96, 212, 160, 0.04) 0%, transparent 50%), var(--bg)',
    backgroundGradientLg:
      'radial-gradient(ellipse at 30% 0%, rgba(199, 125, 255, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(96, 212, 160, 0.05) 0%, transparent 40%), var(--bg)',
    backgroundTexture: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c77dff' fill-opacity='1'%3E%3Ccircle cx='15' cy='15' r='2'/%3E%3Ccircle cx='45' cy='45' r='1.5'/%3E%3Ccircle cx='45' cy='15' r='1'/%3E%3Ccircle cx='15' cy='45' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
    textureOpacity: 0.035,
  },
  {
    id: 'infernal',
    name: 'Infernal',
    description: 'Blood red and charcoal with ember glow and cracked textures',
    colors: {
      text: '#a08888',
      textH: '#f0d8d8',
      bg: '#100808',
      bgSurface: '#180c0c',
      bgRaised: '#201010',
      border: '#351818',
      borderLight: '#4a2020',
      codeBg: '#150a0a',
      accent: '#e03030',
      accentBright: '#ff5050',
      accentBg: 'rgba(224, 48, 48, 0.12)',
      accentBorder: 'rgba(224, 48, 48, 0.35)',
      hpGreen: '#4ade80',
      hpYellow: '#fbbf24',
      hpRed: '#b91c1c',
      hpCrimson: '#dc2626',
      spellIndigo: '#e05030',
      spellViolet: '#f07050',
      spellBg: 'rgba(224, 80, 48, 0.1)',
      spellBorder: 'rgba(224, 80, 48, 0.3)',
      danger: '#b91c1c',
      dangerBright: '#ef4444',
    },
    fonts: {
      heading: "'Cinzel', Georgia, 'Times New Roman', serif",
    },
    backgroundGradient:
      'radial-gradient(ellipse at 50% 100%, rgba(224, 48, 48, 0.06) 0%, transparent 60%), var(--bg)',
    backgroundGradientLg:
      'radial-gradient(ellipse at 50% 100%, rgba(224, 48, 48, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 20% 20%, rgba(255, 100, 50, 0.03) 0%, transparent 40%), var(--bg)',
    backgroundTexture: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23e03030' fill-opacity='1'%3E%3Cpath d='M10 25L15 20L20 25L15 30Z'/%3E%3Cpath d='M35 5L40 0L45 5L40 10Z'/%3E%3Cpath d='M35 45L40 40L45 45L40 50Z'/%3E%3C/g%3E%3C/svg%3E")`,
    textureOpacity: 0.02,
  },
];

export const DEFAULT_THEME: ThemeId = 'dark-fantasy';

export function getThemeById(id: ThemeId | string | null | undefined): ThemeDefinition {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Apply a theme's CSS custom properties to the document root */
export function applyTheme(theme: ThemeDefinition) {
  const root = document.documentElement;
  const s = root.style;

  s.setProperty('--text', theme.colors.text);
  s.setProperty('--text-h', theme.colors.textH);
  s.setProperty('--bg', theme.colors.bg);
  s.setProperty('--bg-surface', theme.colors.bgSurface);
  s.setProperty('--bg-raised', theme.colors.bgRaised);
  s.setProperty('--border', theme.colors.border);
  s.setProperty('--border-light', theme.colors.borderLight);
  s.setProperty('--code-bg', theme.colors.codeBg);
  s.setProperty('--accent', theme.colors.accent);
  s.setProperty('--accent-bright', theme.colors.accentBright);
  s.setProperty('--accent-bg', theme.colors.accentBg);
  s.setProperty('--accent-border', theme.colors.accentBorder);
  s.setProperty('--hp-green', theme.colors.hpGreen);
  s.setProperty('--hp-yellow', theme.colors.hpYellow);
  s.setProperty('--hp-red', theme.colors.hpRed);
  s.setProperty('--hp-crimson', theme.colors.hpCrimson);
  s.setProperty('--spell-indigo', theme.colors.spellIndigo);
  s.setProperty('--spell-violet', theme.colors.spellViolet);
  s.setProperty('--spell-bg', theme.colors.spellBg);
  s.setProperty('--spell-border', theme.colors.spellBorder);
  s.setProperty('--danger', theme.colors.danger);
  s.setProperty('--danger-bright', theme.colors.dangerBright);
  s.setProperty('--heading', theme.fonts.heading);

  // Background
  s.setProperty('--theme-bg-gradient', theme.backgroundGradient);
  s.setProperty('--theme-bg-gradient-lg', theme.backgroundGradientLg);
  s.setProperty('--theme-bg-texture', theme.backgroundTexture);
  s.setProperty('--theme-texture-opacity', String(theme.textureOpacity));

  // Light theme needs different color-scheme
  if (theme.id === 'divine-radiance') {
    root.style.colorScheme = 'light';
  } else {
    root.style.colorScheme = 'dark';
  }
}

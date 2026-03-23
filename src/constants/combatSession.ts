const FANTASY_WORDS = [
  'DRAGON', 'GOBLIN', 'SHADOW', 'RAVEN', 'FORGE',
  'WRAITH', 'EMBER', 'FROST', 'STONE', 'VENOM',
  'STEEL', 'THORN', 'DUSK', 'IRON', 'BONE',
  'FLAME', 'CRYPT', 'STORM', 'BLOOD', 'VOID',
] as const;

export function generateRoomCode(): string {
  const word = FANTASY_WORDS[Math.floor(Math.random() * FANTASY_WORDS.length)];
  const num = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return `${word}-${num}`;
}

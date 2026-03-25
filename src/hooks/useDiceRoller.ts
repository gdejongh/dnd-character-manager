import { useState, useCallback } from 'react';
import type { DiceRoll, DieType } from '../constants/dice';
import { DICE, MAX_HISTORY } from '../constants/dice';

interface ParsedNotation {
  dice: { type: DieType; count: number }[];
  modifier: number;
}

function parseNotation(notation: string): ParsedNotation | null {
  const clean = notation.replace(/\s/g, '').toLowerCase();
  const dice: { type: DieType; count: number }[] = [];
  let modifier = 0;

  // Match patterns like "2d6+3", "1d20-1", "d8", "2d6+1d4+3"
  const dicePattern = /(\d*)d(\d+)/g;
  const modPattern = /[+-]\d+$/;

  let match;
  while ((match = dicePattern.exec(clean)) !== null) {
    const count = match[1] ? parseInt(match[1]) : 1;
    const sides = parseInt(match[2]);
    const validDie = DICE.find((d) => d.sides === sides);
    if (!validDie || count < 1 || count > 99) return null;
    dice.push({ type: validDie.type, count });
  }

  const modMatch = clean.match(modPattern);
  if (modMatch) {
    modifier = parseInt(modMatch[0]);
  }

  if (dice.length === 0) return null;
  return { dice, modifier };
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

let rollIdCounter = 0;

export function useDiceRoller() {
  const [history, setHistory] = useState<DiceRoll[]>([]);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const roll = useCallback(
    (
      notation: string,
      options?: {
        advantage?: 'advantage' | 'disadvantage';
        label?: string;
      },
    ): DiceRoll | null => {
      const parsed = parseNotation(notation);
      if (!parsed) return null;

      setIsRolling(true);

      const results: number[] = [];
      let isCrit = false;
      let isFumble = false;

      if (
        options?.advantage &&
        parsed.dice.length === 1 &&
        parsed.dice[0].type === 'd20' &&
        parsed.dice[0].count === 1
      ) {
        // Advantage/disadvantage: roll 2d20, take higher/lower
        const r1 = rollDie(20);
        const r2 = rollDie(20);
        const chosen =
          options.advantage === 'advantage' ? Math.max(r1, r2) : Math.min(r1, r2);
        results.push(chosen);
        // Show both rolls for context (chosen value used for total)
        isCrit = chosen === 20;
        isFumble = chosen === 1;
      } else {
        for (const die of parsed.dice) {
          const sides = DICE.find((d) => d.type === die.type)!.sides;
          for (let i = 0; i < die.count; i++) {
            results.push(rollDie(sides));
          }
        }
        // Check for crit/fumble on single d20 rolls
        if (
          parsed.dice.length === 1 &&
          parsed.dice[0].type === 'd20' &&
          parsed.dice[0].count === 1
        ) {
          isCrit = results[0] === 20;
          isFumble = results[0] === 1;
        }
      }

      const total = results.reduce((sum, r) => sum + r, 0) + parsed.modifier;

      const diceRoll: DiceRoll = {
        id: `roll-${Date.now()}-${++rollIdCounter}`,
        notation,
        dice: parsed.dice,
        modifier: parsed.modifier,
        results,
        total,
        advantage: options?.advantage,
        isCrit,
        isFumble,
        label: options?.label,
        timestamp: Date.now(),
      };

      setLastRoll(diceRoll);
      setHistory((prev) => [diceRoll, ...prev].slice(0, MAX_HISTORY));

      // Reset animation state after a short delay
      setTimeout(() => setIsRolling(false), 600);

      return diceRoll;
    },
    [],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    setLastRoll(null);
  }, []);

  return { history, lastRoll, isRolling, roll, clearHistory };
}

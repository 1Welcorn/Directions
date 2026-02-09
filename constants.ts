
import { Direction, DifficultyLevel, DifficultyConfig } from './types';

export const INITIAL_DIRECTIONS: Direction[] = [
  // EASY LEVEL (Foundations) - Indices 0-3
  { key: "start",       en: "Start",         pt: "Comece",               emoji: "🏁" },
  { key: "go",          en: "Go",            pt: "Inicie",               emoji: "🚶" },
  { key: "left",        en: "Left",          pt: "Esquerda",             emoji: "⬅️" },
  { key: "right",       en: "Right",         pt: "Direita",              emoji: "➡️" },
  
  // MEDIUM LEVEL (Basic Relations) - Indices 4-7
  { key: "turn",        en: "Turn",          pt: "Vire",                 emoji: "↪️" },
  { key: "next_to",     en: "Next to",       pt: "Do lado",              emoji: "🏘️" },
  { key: "there_is",    en: "There is",      pt: "Existe",               emoji: "👤" },
  { key: "there_are",   en: "There are",     pt: "Existem",              emoji: "👥" },

  // HARD LEVEL (Advanced/Abstract) - Indices 8-15
  { key: "under",       en: "Under",         pt: "Debaixo",              emoji: "⬇️" },
  { key: "between",     en: "Between",       pt: "No meio",              emoji: "↕️" },
  { key: "through",     en: "Through",       pt: "Através",              emoji: "🚇" },
  { key: "opposite",    en: "Opposite",      pt: "Contrário",            emoji: "🔃" },
  { key: "go_past",     en: "Go past",       pt: "Passe por",            emoji: "⏭️" },
  { key: "cross",       en: "Cross",         pt: "Atravesse",            emoji: "🦓" },
  { key: "walk_along",  en: "Walk along",    pt: "Ande pela",            emoji: "🛣️" },
  { key: "go_straight", en: "Go straight",   pt: "Siga reto",            emoji: "⬆️" }
];

export const DIFFICULTY_SETTINGS: Record<DifficultyLevel, DifficultyConfig> = {
  [DifficultyLevel.EASY]: { pairs: 4, peekDuration: 5000, label: 'Easy' },
  [DifficultyLevel.MEDIUM]: { pairs: 8, peekDuration: 3000, label: 'Medium' },
  [DifficultyLevel.HARD]: { pairs: 8, peekDuration: 1500, label: 'Hard' }
};

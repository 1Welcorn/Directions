
export enum GameMode {
  SAME = 'same',
  TRANSLATE = 'translate'
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export interface DifficultyConfig {
  pairs: number;
  peekDuration: number;
  label: string;
}

export interface Direction {
  key: string;
  en: string;
  pt: string;
  emoji: string;
}

export interface CardData {
  id: string;
  key: string;
  emoji: string;
  text: string;
  lang: 'EN' | 'PT';
  isFlipped: boolean;
  isMatched: boolean;
  imageUrl?: string; // High-capacity asset storage
}

export interface ToastMessage {
  text: string;
  type: 'info' | 'success' | 'error';
}

export interface StoredAsset {
  key: string;
  data: string; // Base64 image data
  timestamp: number;
}

export interface Word {
  no: number;
  word: string;
  meaning: string;
}

export interface Lesson {
  id: number;
  words: Word[];
}

export interface MatchPair {
  word: Word;
  meaning: Word;
  connected: boolean;
}

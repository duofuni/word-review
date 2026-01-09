import { Word, Lesson } from '../types';

const WORDS_PER_LESSON = 20;

export function parseWordsToLessons(words: Word[]): Lesson[] {
  const lessons: Lesson[] = [];
  
  for (let i = 0; i < words.length; i += WORDS_PER_LESSON) {
    const lessonWords = words.slice(i, i + WORDS_PER_LESSON);
    if (lessonWords.length > 0) {
      lessons.push({
        id: Math.floor(i / WORDS_PER_LESSON) + 1,
        words: lessonWords
      });
    }
  }
  
  return lessons;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

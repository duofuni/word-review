const STORAGE_KEY = 'word-review-progress';

export interface Progress {
  lessonId: number;
  completed: boolean;
}

export function getProgress(): Progress[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveProgress(progress: Progress[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
}

export function updateLessonProgress(lessonId: number, completed: boolean): void {
  const progress = getProgress();
  const index = progress.findIndex(p => p.lessonId === lessonId);
  
  if (index >= 0) {
    progress[index].completed = completed;
  } else {
    progress.push({ lessonId, completed });
  }
  
  saveProgress(progress);
}

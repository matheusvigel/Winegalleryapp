import { Progress, Stats } from '../types';

const STORAGE_KEY_PROGRESS = 'wine-gallery-progress';
const STORAGE_KEY_STATS = 'wine-gallery-stats';

export const getProgress = (): Progress[] => {
  const stored = localStorage.getItem(STORAGE_KEY_PROGRESS);
  return stored ? JSON.parse(stored) : [];
};

export const saveProgress = (progress: Progress[]): void => {
  localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
};

export const getStats = (): Stats => {
  const stored = localStorage.getItem(STORAGE_KEY_STATS);
  return stored ? JSON.parse(stored) : {
    totalPoints: 0,
    completedCount: 0,
    wishlistCount: 0,
    level: 1,
  };
};

export const saveStats = (stats: Stats): void => {
  localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
};

export const updateItemStatus = (
  itemId: string,
  status: 'wishlist' | 'completed' | null,
  points: number
): void => {
  const progress = getProgress();
  const stats = getStats();
  
  const existingIndex = progress.findIndex(p => p.itemId === itemId);
  
  if (status === null) {
    // Remove from progress
    if (existingIndex !== -1) {
      const existing = progress[existingIndex];
      if (existing.status === 'completed') {
        stats.completedCount--;
        stats.totalPoints -= points;
      } else if (existing.status === 'wishlist') {
        stats.wishlistCount--;
      }
      progress.splice(existingIndex, 1);
    }
  } else {
    // Add or update progress
    if (existingIndex !== -1) {
      const existing = progress[existingIndex];
      // Update counts based on transition
      if (existing.status === 'completed' && status === 'wishlist') {
        stats.completedCount--;
        stats.totalPoints -= points;
        stats.wishlistCount++;
      } else if (existing.status === 'wishlist' && status === 'completed') {
        stats.wishlistCount--;
        stats.completedCount++;
        stats.totalPoints += points;
      }
      progress[existingIndex] = {
        itemId,
        status,
        timestamp: Date.now(),
      };
    } else {
      progress.push({
        itemId,
        status,
        timestamp: Date.now(),
      });
      
      if (status === 'completed') {
        stats.completedCount++;
        stats.totalPoints += points;
      } else {
        stats.wishlistCount++;
      }
    }
  }
  
  // Calculate level (every 100 points = 1 level)
  stats.level = Math.floor(stats.totalPoints / 100) + 1;
  
  saveProgress(progress);
  saveStats(stats);
};

export const getItemStatus = (itemId: string): 'wishlist' | 'completed' | null => {
  const progress = getProgress();
  const item = progress.find(p => p.itemId === itemId);
  return item?.status || null;
};

// Legacy support - map old function names
export const updateExperienceStatus = updateItemStatus;
export const getExperienceStatus = getItemStatus;
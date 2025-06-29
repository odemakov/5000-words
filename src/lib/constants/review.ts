// Review system constants
import { Storage } from '$lib/storage';

// Default review intervals in hours
export const DEFAULT_REVIEW_INTERVALS = {
  POOL1_HOURS: 24, // 1 day
  POOL2_HOURS: 72, // 3 days
  POOL3_HOURS: 144 // 6 days
};

// Pool enum
export enum POOLS {
  POOL1 = 'POOL1',
  POOL2 = 'POOL2',
  POOL3 = 'POOL3'
}

// Review pools/grades with labels
export const REVIEW_POOLS = {
  POOL1: {
    name: POOLS.POOL1,
    label: 'Short-term'
  },
  POOL2: {
    name: POOLS.POOL2,
    label: 'Medium-term'
  },
  POOL3: {
    name: POOLS.POOL3,
    label: 'Long-term'
  }
} as const;

// Pool type
export type ReviewPool = keyof typeof REVIEW_POOLS;

// Helper to get next pool
export function getNextPool(currentPool: ReviewPool): ReviewPool | null {
  switch (currentPool) {
    case POOLS.POOL1:
      return POOLS.POOL2;
    case POOLS.POOL2:
      return POOLS.POOL3;
    case POOLS.POOL3:
      return null; // Already at highest pool
    default:
      return null;
  }
}

// Helper to get previous pool
export function getPreviousPool(currentPool: ReviewPool): ReviewPool | null {
  switch (currentPool) {
    case POOLS.POOL1:
      return null; // Already at lowest pool
    case POOLS.POOL2:
      return POOLS.POOL1;
    case POOLS.POOL3:
      return POOLS.POOL2;
    default:
      return null;
  }
}

// Get user-configured review intervals
function getReviewIntervals() {
  const settings = Storage.getAppSettings();
  return (
    settings?.reviewIntervals || {
      pool1Hours: DEFAULT_REVIEW_INTERVALS.POOL1_HOURS,
      pool2Hours: DEFAULT_REVIEW_INTERVALS.POOL2_HOURS,
      pool3Hours: DEFAULT_REVIEW_INTERVALS.POOL3_HOURS
    }
  );
}

// Get interval in milliseconds for a pool based on user settings
export function getPoolIntervalMs(pool: ReviewPool): number {
  const intervals = getReviewIntervals();
  const hours =
    pool === POOLS.POOL1
      ? intervals.pool1Hours
      : pool === POOLS.POOL2
        ? intervals.pool2Hours
        : intervals.pool3Hours;
  return hours * 60 * 60 * 1000; // Convert hours to milliseconds
}

// Calculate due date for a review word
export function getReviewDueDate(addedAt: number, pool: ReviewPool): number {
  return addedAt + getPoolIntervalMs(pool);
}

// Check if a review word is due for review
export function isReviewDue(addedAt: number, pool: ReviewPool): boolean {
  return Date.now() >= getReviewDueDate(addedAt, pool);
}

// Get pool minimum time in milliseconds (same as interval)
export function getPoolMinTimeMs(pool: ReviewPool): number {
  return getPoolIntervalMs(pool);
}

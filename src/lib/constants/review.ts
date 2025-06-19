// Review system constants

// Review intervals in seconds (configurable)
export const REVIEW_INTERVALS = {
  FIRST: 7 * 24 * 60 * 60, // 7 days in seconds
  SECOND: 14 * 24 * 60 * 60, // 14 days in seconds
  THIRD: 30 * 24 * 60 * 60 // 30 days in seconds
} as const;

// Pool enum
export enum POOLS {
  POOL1 = 'POOL1',
  POOL2 = 'POOL2',
  POOL3 = 'POOL3'
}

// Review pools/grades with minimum time requirements
export const REVIEW_POOLS = {
  POOL1: {
    name: POOLS.POOL1,
    label: 'Short-term',
    interval: REVIEW_INTERVALS.FIRST
  },
  POOL2: {
    name: POOLS.POOL2,
    label: 'Medium-term',
    interval: REVIEW_INTERVALS.SECOND
  },
  POOL3: {
    name: POOLS.POOL3,
    label: 'Long-term',
    interval: REVIEW_INTERVALS.THIRD
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

// Get interval in milliseconds for a pool
export function getPoolIntervalMs(pool: ReviewPool): number {
  return REVIEW_POOLS[pool].interval * 1000;
}

// Get pool minimum time in milliseconds
export function getPoolMinTimeMs(pool: ReviewPool): number {
  return REVIEW_POOLS[pool].interval * 1000;
}

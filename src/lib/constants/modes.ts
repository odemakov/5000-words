// Learning mode constants
export const LEARNING = 'learning' as const;
export const REVIEWING = 'reviewing' as const;
export const ADDING = 'adding' as const;
export const LEVEL_A1 = 'A1' as const;
export const LEVEL_A2 = 'A2' as const;
export const LEVEL_B1 = 'B1' as const;
export const LEVEL_B2 = 'B2' as const;

// Mode type
export type LearningMode = typeof LEARNING | typeof REVIEWING | typeof ADDING;

// Level type
export type Level = typeof LEVEL_A1 | typeof LEVEL_A2 | typeof LEVEL_B1 | typeof LEVEL_B2;

// Simple helper functions for typed values
export function isLearningMode(mode: LearningMode): boolean {
  return mode === LEARNING;
}

export function isReviewingMode(mode: LearningMode): boolean {
  return mode === REVIEWING;
}

export function isAddingMode(mode: LearningMode): boolean {
  return mode === ADDING;
}

// Validation function for string input (e.g., from localStorage, URL params)
export function validateLearningMode(mode: string): LearningMode | null {
  switch (mode) {
    case LEARNING:
    case REVIEWING:
    case ADDING:
      return mode;
    default:
      return null;
  }
}

// Mode display information
export const MODE_INFO = {
  [LEARNING]: {
    label: 'Learning',
    fullLabel: 'Learning (Passive & Active)',
    icon: 'book'
  },
  [REVIEWING]: {
    label: 'Reviewing',
    fullLabel: 'Review learned words',
    icon: 'clock'
  },
  [ADDING]: {
    label: 'Add Words',
    fullLabel: 'Add New Words',
    icon: 'plus'
  }
} as const;

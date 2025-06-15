// Learning mode constants
export const LEARNING_FORWARD = 'learning-forward' as const;
export const LEARNING_BACKWARD = 'learning-backward' as const;
export const REVIEWING = 'reviewing' as const;
export const ADDING = 'adding' as const;
export const LEVEL_A1 = 'A1' as const;
export const LEVEL_A2 = 'A2' as const;
export const LEVEL_B1 = 'B1' as const;
export const LEVEL_B2 = 'B2' as const;

// Mode type
export type LearningMode =
  | typeof LEARNING_FORWARD
  | typeof LEARNING_BACKWARD
  | typeof REVIEWING
  | typeof ADDING;

// Mode type
export type Level = typeof LEVEL_A1 | typeof LEVEL_A2 | typeof LEVEL_B1 | typeof LEVEL_B2;

// Helper functions
export function isLearningForwardMode(mode: string): mode is typeof LEARNING_FORWARD {
  return mode === LEARNING_FORWARD;
}

export function isLearningBackwardMode(mode: string): mode is typeof LEARNING_BACKWARD {
  return mode === LEARNING_BACKWARD;
}

export function isLearningMode(
  mode: string
): mode is typeof LEARNING_FORWARD | typeof LEARNING_BACKWARD {
  return isLearningForwardMode(mode) || isLearningBackwardMode(mode);
}

export function isReviewingMode(mode: string): mode is typeof REVIEWING {
  return mode === REVIEWING;
}

export function isAddingMode(mode: string): mode is typeof ADDING {
  return mode === ADDING;
}

// Mode display information
export const MODE_INFO = {
  [LEARNING_FORWARD]: {
    label: 'Pecepitive',
    fullLabel: 'Learning (French to Russian)',
    icon: 'book'
  },
  [LEARNING_BACKWARD]: {
    label: 'Productive',
    fullLabel: 'Learning (Russian to French)',
    icon: 'book'
  },
  [REVIEWING]: {
    label: 'Reviewing',
    fullLabel: 'Recap learned words',
    icon: 'clock'
  },
  [ADDING]: {
    label: 'Add Words',
    fullLabel: 'Add New Words',
    icon: 'plus'
  }
} as const;

// Learning mode constants
export const LEARNING_FORWARD = 'learning-forward' as const;
export const LEARNING_BACKWARD = 'learning-backward' as const;
export const RECAP_7 = 'recap7' as const;
export const RECAP_14 = 'recap14' as const;
export const RECAP_30 = 'recap30' as const;
export const ADDING = 'adding' as const;

// Mode type
export type LearningMode =
  | typeof LEARNING_FORWARD
  | typeof LEARNING_BACKWARD
  | typeof RECAP_7
  | typeof RECAP_14
  | typeof RECAP_30
  | typeof ADDING;

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

export function isRecap7Mode(mode: string): mode is typeof RECAP_7 {
  return mode === RECAP_7;
}

export function isRecap14Mode(mode: string): mode is typeof RECAP_14 {
  return mode === RECAP_14;
}

export function isRecap30Mode(mode: string): mode is typeof RECAP_30 {
  return mode === RECAP_30;
}

export function isRecapMode(
  mode: string
): mode is typeof RECAP_7 | typeof RECAP_14 | typeof RECAP_30 {
  return isRecap7Mode(mode) || isRecap14Mode(mode) || isRecap30Mode(mode);
}

export function isAddingMode(mode: string): mode is typeof ADDING {
  return mode === ADDING;
}

// Mode display information
export const MODE_INFO = {
  [LEARNING_FORWARD]: {
    label: 'Forward',
    fullLabel: 'Learning (French to Russian)',
    icon: 'book'
  },
  [LEARNING_BACKWARD]: {
    label: 'Backward',
    fullLabel: 'Learning (Russian to French)',
    icon: 'book'
  },
  [RECAP_7]: {
    label: '7-day',
    fullLabel: '7-day Recap',
    icon: 'clock'
  },
  [RECAP_14]: {
    label: '14-day',
    fullLabel: '14-day Recap',
    icon: 'clock'
  },
  [RECAP_30]: {
    label: '30-day',
    fullLabel: '30-day Recap',
    icon: 'clock'
  },
  [ADDING]: {
    label: 'Add Words',
    fullLabel: 'Add New Words',
    icon: 'plus'
  }
} as const;

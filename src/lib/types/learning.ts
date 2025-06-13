// Core learning state interface with optimized data structures
export interface LearningState {
  // User level data
  detectedLevel: 'A1' | 'A2' | 'B1' | 'B2';
  levelTestResults: Array<{ wordId: number; known: boolean }>;

  // Progress tracking
  progress: number; // Highest word index in queue system
  wordsLearned: number; // Count in learnedList + recap30
  wordsReviewed: number; // Successful recap queue progressions

  // Queue management (storing only word indices)
  forwardQueue: WordInQueue[];
  backwardQueue: WordInQueue[];

  // Spaced repetition queues
  recap7: RecapWord[];
  recap14: RecapWord[];
  recap30: RecapWord[];

  // Learned words tracking (just indices)
  learnedList: number[]; // Word indices that are fully learned

  // Current app state
  currentMode: 'learning' | 'reviews';
  currentDirection: 'forward' | 'backward';

  // Session tracking
  lastActivity: number;
  sessionStartTime: number;
  todayStats: DailyStats;
}

// Optimized queue item - only stores word index and metadata
export interface WordInQueue {
  wordIndex: number; // Index in the main words array
  addedAt: number;
  attempts: number;
}

// Recap word extends queue item with review-specific data
export interface RecapWord extends WordInQueue {
  dueDate: number;
  direction: 'forward' | 'backward';
  reviewCount: number;
  lastReviewAt: number;
}

export interface DailyStats {
  date: string;
  newWords: number;
  reviewWords: number;
  timeSpent: number;
  streakDays: number;
}

// UI-focused interfaces that combine word data with queue metadata
export interface CurrentCard {
  wordIndex: number;
  word: string;
  props: string[];
  translations: string[];
  direction: 'forward' | 'backward';
  attempts?: number;
  isReview?: boolean;
  reviewType?: '7' | '14' | '30';
}

export interface QueueStats {
  forwardCount: number;
  backwardCount: number;
  dueReviewsCount: number;
  totalReviewsCount: number;
  recap7Count: number;
  recap14Count: number;
  recap30Count: number;
}

// Settings interface
export interface AppSettings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  soundEffects: boolean;
  autoAdvance: boolean;
  dailyGoal: number;
}

// Session data for analytics
export interface SessionData {
  startTime: number;
  endTime?: number;
  cardsStudied: number;
  newCards: number;
  reviewCards: number;
  correctAnswers: number;
  totalAnswers: number;
}

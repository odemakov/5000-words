import type { Level } from '$lib/constants/modes';

// Learning stages in order of progression
export type LearningStage = 'passive' | 'active' | 'review1' | 'review2' | 'review3';

// Unified learning queue item structure
export interface WordLearningItem {
  wordId: number;                    // Reference to word index in vocabulary
  stage: LearningStage;              // Current learning stage
  consecutiveCorrect: number;        // Consecutive "I know" responses (0-2)
  consecutiveWrong: number;          // Consecutive "I don't know" responses (0-2)
  showAfter: number;                 // Timestamp when word becomes available for review
  attempts: number;                  // Total attempts made (for analytics)
  addedAt: number;                   // When word was first added to queue
  lastSeen: number;                  // Last time word was shown to user
}

// Simplified learning state with unified queue
export interface UnifiedLearningState {
  // User level data
  detectedLevel: Level;
  levelTestResults: Array<{ wordId: number; known: boolean }>;

  // Progress tracking
  progress: number;                  // Highest word index reached
  wordsLearned: number;              // Count of fully mastered words
  wordsReviewed: number;             // Total successful progressions

  // Unified queue management
  learningQueue: WordLearningItem[]; // Single queue for all stages
  learnedWords: number[];            // Fully mastered word IDs

  // Current app state
  currentMode: 'learning' | 'reviewing' | 'adding';

  // Session tracking
  lastActivity: number;
  sessionStartTime: number;
  todayStats: DailyStats;
}

// Daily statistics tracking
export interface DailyStats {
  date: string;
  newWords: number;                  // Words added to queue
  reviewWords: number;               // Words reviewed
  timeSpent: number;                 // Time spent learning (ms)
  streakDays: number;                // Consecutive days of activity
}

// Card direction for UI display
export enum CardDirection {
  PASSIVE = 'passive',               // Learning language → Native language (French → Russian)
  ACTIVE = 'active'                  // Native language → Learning language (Russian → French)
}

// Current card interface for UI
export interface CurrentCard {
  wordId: number;
  word: string;
  props: string[];
  translations: string[];
  direction: CardDirection;
  stage: LearningStage;
  attempts: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
}

// Queue statistics for UI display
export interface QueueStats {
  passive: {
    available: number;               // Ready to study now
    scheduled: number;               // Scheduled for later
    total: number;
  };
  active: {
    available: number;
    scheduled: number;
    total: number;
  };
  review1: {
    available: number;
    scheduled: number;
    total: number;
  };
  review2: {
    available: number;
    scheduled: number;
    total: number;
  };
  review3: {
    available: number;
    scheduled: number;
    total: number;
  };
  learned: number;                   // Fully mastered words
}

// Response interface for card interactions
export interface CardResponse {
  wordId: number;
  known: boolean;
  responseTime: number;              // Time taken to respond (ms)
  timestamp: number;                 // When response was given
}

// Stage progression constants
export const STAGE_PROGRESSION: Record<LearningStage, LearningStage | null> = {
  passive: 'active',
  active: 'review1',
  review1: 'review2',
  review2: 'review3',
  review3: null                      // Next step is learned
};

export const STAGE_REGRESSION: Record<LearningStage, LearningStage | null> = {
  passive: null,                     // Can't go back from passive
  active: 'passive',
  review1: 'active',
  review2: 'review1',
  review3: 'review2'
};

// Required consecutive correct answers to advance
export const REQUIRED_CONSECUTIVE_CORRECT = 3;

// Required consecutive wrong answers to regress
export const REQUIRED_CONSECUTIVE_WRONG = 3;

// Default spacing intervals in milliseconds for each stage
export const DEFAULT_SPACING_INTERVALS = {
  passive: 0,                        // No delay for new passive words
  active: 1000 * 60 * 60,           // 1 hour
  review1: 1000 * 60 * 60 * 24,     // 1 day
  review2: 1000 * 60 * 60 * 24 * 3, // 3 days
  review3: 1000 * 60 * 60 * 24 * 7  // 7 days
};

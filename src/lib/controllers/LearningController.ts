import {
  isLearningBackwardMode,
  isLearningForwardMode,
  isLearningMode,
  isReviewingMode,
  LEVEL_A1,
  LEVEL_A2,
  LEVEL_B1,
  LEVEL_B2,
  type LearningMode,
  type Level
} from '$lib/constants/modes';
import {
  getNextPool,
  getPreviousPool,
  getReviewDueDate,
  isReviewDue,
  POOLS,
  type ReviewPool
} from '$lib/constants/review';
import {
  CardDirection,
  type CurrentCard,
  type LearningState,
  type ReviewWord,
  type WordInQueue
} from '$lib/types/learning';
import { derived, get, writable } from 'svelte/store';
import { Storage, type WordData } from '../storage.js';

// Initialize default learning state
const createDefaultState = (): LearningState => ({
  detectedLevel: LEVEL_A1,
  levelTestResults: [],
  progress: 0,
  wordsLearned: 0,
  wordsReviewed: 0,
  forwardQueue: [],
  backwardQueue: [],
  reviewQueue: [],
  learnedList: [],
  currentMode: 'learning-forward',
  lastActivity: Date.now(),
  sessionStartTime: Date.now(),
  todayStats: {
    date: new Date().toISOString().split('T')[0],
    newWords: 0,
    reviewWords: 0,
    timeSpent: 0,
    streakDays: 1
  }
});

// Learning state store
// Initialize with a default state, but will be properly loaded on first access
export const learningState = writable<LearningState>(createDefaultState());

// Initialize the learning state from storage on module load
function initializeLearningState(): void {
  const savedState = Storage.getLearningState() as LearningState | null;
  if (savedState) {
    console.log('LearningController: Loading saved state on initialization');
    learningState.set(savedState);
  }
}

// Call initialization when module loads
initializeLearningState();

// Cache for word data to avoid repeated storage calls
let wordsCache: WordData[] | null = null;

function getWordsData(): WordData[] {
  if (!wordsCache) {
    wordsCache = Storage.getWords() || [];
  }
  return wordsCache;
}

export function getWordByIndex(index: number): WordData | null {
  const words = getWordsData();
  return words[index] || null;
}

// Clear the words cache (for testing)
export function clearWordsCache(): void {
  wordsCache = null;
}

// Derived store for current card with full word data
export const currentCard = derived<typeof learningState, CurrentCard | null>(
  learningState,
  ($state) => {
    const { currentMode, forwardQueue, backwardQueue, reviewQueue } = $state;

    if (isLearningMode(currentMode)) {
      // Learning mode - handle forward and backward queues
      if (isLearningForwardMode(currentMode) && forwardQueue.length > 0) {
        const queueItem = forwardQueue[0];
        const wordData = getWordByIndex(queueItem.wordIndex);
        if (wordData) {
          return {
            wordIndex: queueItem.wordIndex,
            word: wordData.word,
            props: wordData.props,
            translations: wordData.translations,
            direction: CardDirection.FORWARD,
            attempts: queueItem.attempts
          };
        }
      } else if (isLearningBackwardMode(currentMode) && backwardQueue.length > 0) {
        const queueItem = backwardQueue[0];
        const wordData = getWordByIndex(queueItem.wordIndex);
        if (wordData) {
          return {
            wordIndex: queueItem.wordIndex,
            word: wordData.word,
            props: wordData.props,
            translations: wordData.translations,
            direction: CardDirection.BACKWARD,
            attempts: queueItem.attempts
          };
        }
      }
    } else if (isReviewingMode(currentMode)) {
      // Review mode - show due words from review queue

      // Get due words from the review queue
      const dueWords = reviewQueue
        .filter((word) => isReviewDue(word.addedAt, word.pool))
        .sort((a, b) => getReviewDueDate(a.addedAt, a.pool) - getReviewDueDate(b.addedAt, b.pool));

      if (dueWords.length > 0) {
        const reviewItem = dueWords[0];
        const wordData = getWordByIndex(reviewItem.wordIndex);
        if (wordData) {
          return {
            wordIndex: reviewItem.wordIndex,
            word: wordData.word,
            props: wordData.props,
            translations: wordData.translations,
            direction: Math.random() < 0.5 ? CardDirection.FORWARD : CardDirection.BACKWARD,
            attempts: reviewItem.attempts,
            isReview: true,
            reviewPool: reviewItem.pool
          };
        }
      }
    }

    return null;
  }
);

// Derived store for queue statistics
// Helper function to get due reviews count
export function getDueReviewsCount(): number {
  const state = get(learningState);
  return state.reviewQueue.filter((word) => isReviewDue(word.addedAt, word.pool)).length;
}

// Helper function to get reviews count by interval
export function getReviewsCountByPool(pool: ReviewPool): {
  ready: number;
  notReady: number;
  total: number;
} {
  const state = get(learningState);
  const wordsInPool = state.reviewQueue.filter((word) => word.pool === pool);
  const ready = wordsInPool.filter((word) => isReviewDue(word.addedAt, word.pool)).length;
  const notReady = wordsInPool.length - ready;
  return { ready, notReady, total: wordsInPool.length };
}

export function getLearningForwardCount(): number {
  const state = get(learningState);
  return state.forwardQueue.length;
}

export function getLearningBackwardCount(): number {
  const state = get(learningState);
  return state.backwardQueue.length;
}

// Learning Controller class with static methods
export class LearningController {
  static getStartingIndexForLevel(level: Level): number {
    switch (level) {
      case LEVEL_A1:
        return 0;
      case LEVEL_A2:
        return 800;
      case LEVEL_B1:
        return 2000;
      case LEVEL_B2:
        return 4000;
      default:
        return 0;
    }
  }

  static getMaxIndexForLevel(level: Level): number {
    switch (level) {
      case LEVEL_A1:
        return 799;
      case LEVEL_A2:
        return 1999;
      case LEVEL_B1:
        return 3999;
      case LEVEL_B2:
        return 4999;
      default:
        return 799;
    }
  }

  static async initializeLearning(
    detectedLevel: Level,
    testResults: Array<{ wordId: number; known: boolean }>
  ) {
    const startingIndex = this.getStartingIndexForLevel(detectedLevel);
    const now = Date.now();

    // Create initial state
    const initialState: LearningState = {
      ...createDefaultState(),
      detectedLevel,
      levelTestResults: testResults,
      progress: startingIndex,
      sessionStartTime: now,
      lastActivity: now
    };

    learningState.set(initialState);

    this.saveState();
  }

  static async processCardResponse(known: boolean) {
    const state = get(learningState);
    const card = get(currentCard);

    if (!card) return;

    const now = Date.now();

    if (isLearningForwardMode(state.currentMode)) {
      this.processForwardQueueResponse(card, known);
    } else if (isLearningBackwardMode(state.currentMode)) {
      this.processBackwardQueueResponse(card, known);
    } else if (isReviewingMode(state.currentMode)) {
      this.processReviewResponse(card, known);
    }

    // Update session stats and activity
    learningState.update((state) => ({
      ...state,
      lastActivity: now,
      todayStats: {
        ...state.todayStats,
        timeSpent: Math.floor((now - state.sessionStartTime) / 1000)
      }
    }));

    this.saveState();
  }

  static processForwardQueueResponse(card: CurrentCard, known: boolean) {
    learningState.update((state) => {
      const newForwardQueue = state.forwardQueue.slice(1); // Remove current card
      const now = Date.now();

      if (known) {
        // Move to backward queue
        const backwardItem: WordInQueue = {
          wordIndex: card.wordIndex,
          addedAt: now,
          attempts: (card.attempts || 0) + 1
        };

        // Don't automatically refill, just update queue
        return {
          ...state,
          forwardQueue: newForwardQueue,
          backwardQueue: [...state.backwardQueue, backwardItem],
          todayStats: {
            ...state.todayStats,
            newWords: state.todayStats.newWords + 1
          }
        };
      } else {
        // Reinsert randomly into second half of the queue
        const queueLength = newForwardQueue.length;
        const updatedItem: WordInQueue = {
          wordIndex: card.wordIndex,
          addedAt: now,
          attempts: (card.attempts || 0) + 1
        };

        let insertPosition: number;
        if (queueLength < 4) {
          insertPosition = queueLength;
        } else {
          const halfLength = Math.floor(queueLength / 2);
          insertPosition = halfLength + Math.floor(Math.random() * (queueLength - halfLength + 1));
        }

        const newQueue = [
          ...newForwardQueue.slice(0, insertPosition),
          updatedItem,
          ...newForwardQueue.slice(insertPosition)
        ];

        return {
          ...state,
          forwardQueue: newQueue
        };
      }
    });
  }

  static processBackwardQueueResponse(card: CurrentCard, known: boolean) {
    learningState.update((state) => {
      const now = Date.now();
      const newBackwardQueue = state.backwardQueue.slice(1);

      if (known) {
        // Move to review queue with POOL1
        // Cards from backward queue should be reviewed in backward direction
        const reviewItem: ReviewWord = {
          wordIndex: card.wordIndex,
          addedAt: now,
          attempts: card.attempts || 0,
          pool: POOLS.POOL1
        };

        return {
          ...state,
          backwardQueue: newBackwardQueue,
          reviewQueue: [...state.reviewQueue, reviewItem],
          wordsLearned: state.wordsLearned + 1,
          todayStats: {
            ...state.todayStats,
            newWords: state.todayStats.newWords + 1
          }
        };
      } else {
        // Reinsert randomly into second half of the queue
        const queueLength = newBackwardQueue.length;
        const updatedItem: WordInQueue = {
          wordIndex: card.wordIndex,
          addedAt: state.backwardQueue.find((w) => w.wordIndex === card.wordIndex)?.addedAt || now,
          attempts: (card.attempts || 0) + 1
        };

        let insertPosition: number;
        if (queueLength < 4) {
          insertPosition = queueLength;
        } else {
          const halfLength = Math.floor(queueLength / 2);
          insertPosition = halfLength + Math.floor(Math.random() * (queueLength - halfLength + 1));
        }

        const newQueue = [
          ...newBackwardQueue.slice(0, insertPosition),
          updatedItem,
          ...newBackwardQueue.slice(insertPosition)
        ];

        return {
          ...state,
          backwardQueue: newQueue
        };
      }
    });
  }

  static processReviewResponse(card: CurrentCard, known: boolean) {
    learningState.update((state) => {
      const now = Date.now();
      const wordIndex = card.wordIndex;

      // Find and remove from review queue
      const currentWord = state.reviewQueue.find((w) => w.wordIndex === wordIndex);
      const newReviewQueue = state.reviewQueue.filter((w) => w.wordIndex !== wordIndex);

      if (!currentWord) return state;

      if (known) {
        // Promote to next pool or mark as learned
        const nextPool = getNextPool(currentWord.pool);

        if (nextPool) {
          // Move to next pool
          // Promote to next pool
          const updatedReviewItem: ReviewWord = {
            ...currentWord,
            addedAt: now,
            pool: nextPool
          };
          newReviewQueue.push(updatedReviewItem);
        } else {
          // Already in POOL3, move to learned list
          return {
            ...state,
            reviewQueue: newReviewQueue,
            learnedList: [...state.learnedList, wordIndex],
            wordsReviewed: state.wordsReviewed + 1,
            todayStats: {
              ...state.todayStats,
              reviewWords: state.todayStats.reviewWords + 1
            }
          };
        }

        return {
          ...state,
          reviewQueue: newReviewQueue,
          wordsReviewed: state.wordsReviewed + 1,
          todayStats: {
            ...state.todayStats,
            reviewWords: state.todayStats.reviewWords + 1
          }
        };
      } else {
        // Demote or return to learning
        const previousPool = getPreviousPool(currentWord.pool);

        if (previousPool) {
          // Move back to previous pool
          // Demote to previous pool
          const updatedReviewItem: ReviewWord = {
            ...currentWord,
            addedAt: now,
            pool: previousPool
          };
          newReviewQueue.push(updatedReviewItem);
        } else {
          // Already in POOL1, move back to appropriate learning queue
          const queueItem: WordInQueue = {
            wordIndex: currentWord.wordIndex,
            addedAt: now,
            attempts: currentWord.attempts + 1
          };

          // Move back to forward queue by default when failing review
          return {
            ...state,
            reviewQueue: newReviewQueue,
            forwardQueue: [...state.forwardQueue, queueItem],
            todayStats: {
              ...state.todayStats,
              reviewWords: state.todayStats.reviewWords + 1
            }
          };
        }

        return {
          ...state,
          reviewQueue: newReviewQueue,
          todayStats: {
            ...state.todayStats,
            reviewWords: state.todayStats.reviewWords + 1
          }
        };
      }
    });
  }

  static switchMode(mode: LearningMode) {
    if (mode === 'adding') {
      // Adding mode is handled by the page component
      return;
    }
    learningState.update((state) => ({ ...state, currentMode: mode }));
    this.saveState();
  }

  static saveState() {
    const state = get(learningState);
    console.log('LearningController: Saving state with queues:', {
      forward: state.forwardQueue.length,
      backward: state.backwardQueue.length,
      review: state.reviewQueue.length
    });
    Storage.saveLearningState(state);
  }

  static loadState(): LearningState | null {
    const savedState = Storage.getLearningState() as LearningState | null;
    if (savedState) {
      console.log('LearningController: Loading state with queues:', {
        forward: savedState.forwardQueue?.length || 0,
        backward: savedState.backwardQueue?.length || 0,
        review: savedState.reviewQueue?.length || 0
      });
      // Update the store immediately when loading
      learningState.set(savedState);
    }
    return savedState;
  }

  static resetProgress() {
    learningState.set(createDefaultState());
    this.saveState();
  }

  static exportData(): string {
    const state = get(learningState);
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        learningState: state
      },
      null,
      2
    );
  }

  // Queue filling methods for initial population
  static async initializeQueueFilling(
    detectedLevel: Level,
    testResults: Array<{ wordId: number; known: boolean }>
  ) {
    const startingIndex = this.getStartingIndexForLevel(detectedLevel);
    const now = Date.now();

    // Create initial state without auto-filling queue
    const initialState: LearningState = {
      ...createDefaultState(),
      detectedLevel,
      levelTestResults: testResults,
      progress: startingIndex,
      sessionStartTime: now,
      lastActivity: now,
      currentMode: 'learning-forward' // Will be used for queue filling initially
    };

    learningState.set(initialState);
    this.saveState();
  }

  static getCurrentQueueFillingWord(): {
    word: string;
    props: string[];
    translations: string[];
    index: number;
  } | null {
    const state = get(learningState);
    const words = getWordsData();
    const maxIndex = this.getMaxIndexForLevel(state.detectedLevel);

    const allUsedIndices = new Set([
      ...state.forwardQueue.map((w) => w.wordIndex),
      ...state.backwardQueue.map((w) => w.wordIndex),
      ...state.reviewQueue.map((w) => w.wordIndex),
      ...state.learnedList
    ]);

    // Find next unused word starting from current progress
    let currentIndex = state.progress;
    while (currentIndex <= maxIndex) {
      if (!allUsedIndices.has(currentIndex) && currentIndex < words.length) {
        const wordData = words[currentIndex];
        if (wordData) {
          return {
            word: wordData.word,
            props: wordData.props,
            translations: wordData.translations,
            index: currentIndex
          };
        }
      }
      currentIndex++;
    }

    return null; // No more words available
  }

  static addWordToQueue(wordIndex: number) {
    const now = Date.now();
    learningState.update((state) => ({
      ...state,
      forwardQueue: [
        ...state.forwardQueue,
        {
          wordIndex,
          addedAt: now,
          attempts: 0
        }
      ],
      progress: Math.max(state.progress, wordIndex + 1),
      lastActivity: now
    }));
    this.saveState();
  }

  static addWordToLearned(wordIndex: number) {
    const now = Date.now();
    learningState.update((state) => ({
      ...state,
      learnedList: [...state.learnedList, wordIndex],
      progress: Math.max(state.progress, wordIndex + 1),
      wordsLearned: state.wordsLearned + 1,
      lastActivity: now
    }));
    this.saveState();
  }

  static canStartLearning(): boolean {
    const state = get(learningState);
    return state.forwardQueue.length >= 10;
  }

  static getQueueFillingStats() {
    const state = get(learningState);
    return {
      learnedCount: state.learnedList.length,
      canSwitchToLearning: this.canStartLearning()
    };
  }
}

import { derived, get, writable } from 'svelte/store';
import { Storage, type WordData } from '../storage.js';
import type {
  CurrentCard,
  LearningState,
  QueueStats,
  RecapWord,
  WordInQueue
} from '../types/learning.js';

// Initialize default learning state
const createDefaultState = (): LearningState => ({
  detectedLevel: 'A1',
  levelTestResults: [],
  progress: 0,
  wordsLearned: 0,
  wordsReviewed: 0,
  forwardQueue: [],
  backwardQueue: [],
  recap7: [],
  recap14: [],
  recap30: [],
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
export const learningState = writable<LearningState>(createDefaultState());

// Cache for word data to avoid repeated storage calls
let wordsCache: WordData[] | null = null;

function getWordsData(): WordData[] {
  if (!wordsCache) {
    wordsCache = Storage.getWords() || [];
  }
  return wordsCache;
}

function getWordByIndex(index: number): WordData | null {
  const words = getWordsData();
  return words[index] || null;
}

// Derived store for current card with full word data
export const currentCard = derived<typeof learningState, CurrentCard | null>(
  learningState,
  ($state) => {
    const { currentMode, forwardQueue, backwardQueue, recap7, recap14, recap30 } = $state;

    if (currentMode === 'learning-forward' || currentMode === 'learning-backward') {
      // Check forward direction first
      if ($state.currentMode === 'learning-forward' && forwardQueue.length > 0) {
        const queueItem = forwardQueue[0];
        const wordData = getWordByIndex(queueItem.wordIndex);
        if (wordData) {
          return {
            wordIndex: queueItem.wordIndex,
            word: wordData.word,
            props: wordData.props,
            translations: wordData.translations,
            direction: 'forward' as const,
            attempts: queueItem.attempts
          };
        }
      } else if ($state.currentMode === 'learning-backward' && backwardQueue.length > 0) {
        const queueItem = backwardQueue[0];
        const wordData = getWordByIndex(queueItem.wordIndex);
        if (wordData) {
          return {
            wordIndex: queueItem.wordIndex,
            word: wordData.word,
            props: wordData.props,
            translations: wordData.translations,
            direction: 'backward' as const,
            attempts: queueItem.attempts
          };
        }
      }
    } else {
      // Reviews mode - prioritize oldest due words
      const allDueWords = [...recap7, ...recap14, ...recap30]
        .filter((word) => word.dueDate <= Date.now())
        .sort((a, b) => a.dueDate - b.dueDate);

      if (allDueWords.length > 0) {
        const reviewItem = allDueWords[0];
        const wordData = getWordByIndex(reviewItem.wordIndex);
        if (wordData) {
          // Determine review type
          let reviewType: '7' | '14' | '30' = '7';
          if (recap30.some((w) => w.wordIndex === reviewItem.wordIndex)) reviewType = '30';
          else if (recap14.some((w) => w.wordIndex === reviewItem.wordIndex)) reviewType = '14';

          return {
            wordIndex: reviewItem.wordIndex,
            word: wordData.word,
            props: wordData.props,
            translations: wordData.translations,
            direction: reviewItem.direction,
            attempts: reviewItem.attempts,
            isReview: true,
            reviewType
          };
        }
      }
    }

    return null;
  }
);

// Derived store for queue statistics
export const queueStats = derived<typeof learningState, QueueStats>(learningState, ($state) => {
  const now = Date.now();
  const dueWords = [...$state.recap7, ...$state.recap14, ...$state.recap30].filter(
    (word) => word.dueDate <= now
  );

  return {
    forwardCount: $state.forwardQueue.length,
    backwardCount: $state.backwardQueue.length,
    dueReviewsCount: dueWords.length,
    totalReviewsCount: $state.recap7.length + $state.recap14.length + $state.recap30.length,
    recap7Count: $state.recap7.length,
    recap14Count: $state.recap14.length,
    recap30Count: $state.recap30.length
  };
});

// Learning Controller class with static methods
export class LearningController {
  static getStartingIndexForLevel(level: 'A1' | 'A2' | 'B1' | 'B2'): number {
    switch (level) {
      case 'A1':
        return 0;
      case 'A2':
        return 800;
      case 'B1':
        return 2000;
      case 'B2':
        return 4000;
      default:
        return 0;
    }
  }

  static getMaxIndexForLevel(level: 'A1' | 'A2' | 'B1' | 'B2'): number {
    switch (level) {
      case 'A1':
        return 799;
      case 'A2':
        return 1999;
      case 'B1':
        return 3999;
      case 'B2':
        return 4999;
      default:
        return 799;
    }
  }

  static async initializeLearning(
    detectedLevel: 'A1' | 'A2' | 'B1' | 'B2',
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

    if (state.currentMode === 'learning-forward') {
      this.processForwardQueueResponse(card, known);
    } else if (state.currentMode === 'learning-backward') {
      this.processBackwardQueueResponse(card, known);
    } else {
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

    // Auto-switch mode if needed
    this.updateCurrentMode();

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
      const newBackwardQueue = state.backwardQueue.slice(1); // Remove current card
      const now = Date.now();

      if (known) {
        // Move to recap7 with 7-day due date
        const recapItem: RecapWord = {
          wordIndex: card.wordIndex,
          addedAt: card.attempts
            ? state.forwardQueue.find((w) => w.wordIndex === card.wordIndex)?.addedAt || now
            : now,
          attempts: (card.attempts || 0) + 1,
          dueDate: now + 7 * 24 * 60 * 60 * 1000, // 7 days from now
          direction: 'forward', // Default direction for first review
          reviewCount: 1,
          lastReviewAt: now
        };

        return {
          ...state,
          backwardQueue: newBackwardQueue,
          recap7: [...state.recap7, recapItem],
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

      // Remove from current recap queue
      const newRecap7 = state.recap7.filter((w) => w.wordIndex !== wordIndex);
      const newRecap14 = state.recap14.filter((w) => w.wordIndex !== wordIndex);
      const newRecap30 = state.recap30.filter((w) => w.wordIndex !== wordIndex);

      if (known) {
        // Promote to next level or mark as learned
        if (card.reviewType === '7') {
          // Move to recap14
          const currentWord = state.recap7.find((w) => w.wordIndex === wordIndex);
          if (currentWord) {
            const recap14Item: RecapWord = {
              ...currentWord,
              dueDate: now + 14 * 24 * 60 * 60 * 1000,
              reviewCount: currentWord.reviewCount + 1,
              lastReviewAt: now
            };
            newRecap14.push(recap14Item);
          }
        } else if (card.reviewType === '14') {
          // Move to recap30
          const currentWord = state.recap14.find((w) => w.wordIndex === wordIndex);
          if (currentWord) {
            const recap30Item: RecapWord = {
              ...currentWord,
              dueDate: now + 30 * 24 * 60 * 60 * 1000,
              reviewCount: currentWord.reviewCount + 1,
              lastReviewAt: now
            };
            newRecap30.push(recap30Item);
          }
        } else if (card.reviewType === '30') {
          // Move to learned list
          state.learnedList.push(wordIndex);
        }

        return {
          ...state,
          recap7: newRecap7,
          recap14: newRecap14,
          recap30: newRecap30,
          wordsReviewed: state.wordsReviewed + 1,
          todayStats: {
            ...state.todayStats,
            reviewWords: state.todayStats.reviewWords + 1
          }
        };
      } else {
        // Demote or return to learning
        if (card.reviewType === '30') {
          // Move back to recap14
          const currentWord = state.recap30.find((w) => w.wordIndex === wordIndex);
          if (currentWord) {
            const recap14Item: RecapWord = {
              ...currentWord,
              dueDate: now + 14 * 24 * 60 * 60 * 1000,
              reviewCount: currentWord.reviewCount + 1,
              lastReviewAt: now
            };
            newRecap14.push(recap14Item);
          }
        } else if (card.reviewType === '14') {
          // Move back to recap7
          const currentWord = state.recap14.find((w) => w.wordIndex === wordIndex);
          if (currentWord) {
            const recap7Item: RecapWord = {
              ...currentWord,
              dueDate: now + 7 * 24 * 60 * 60 * 1000,
              reviewCount: currentWord.reviewCount + 1,
              lastReviewAt: now
            };
            newRecap7.push(recap7Item);
          }
        } else {
          // Move back to appropriate learning queue
          const currentWord = state.recap7.find((w) => w.wordIndex === wordIndex);
          if (currentWord) {
            const queueItem: WordInQueue = {
              wordIndex: currentWord.wordIndex,
              addedAt: now,
              attempts: currentWord.attempts + 1
            };

            if (currentWord.direction === 'forward') {
              state.forwardQueue.push(queueItem);
            } else {
              state.backwardQueue.push(queueItem);
            }
          }
        }

        return {
          ...state,
          recap7: newRecap7,
          recap14: newRecap14,
          recap30: newRecap30,
          todayStats: {
            ...state.todayStats,
            reviewWords: state.todayStats.reviewWords + 1
          }
        };
      }
    });
  }

  static updateCurrentMode() {
    learningState.update((state) => {
      // Auto-switch to the queue that has cards available
      if (state.currentMode === 'learning-forward' || state.currentMode === 'learning-backward') {
        if (
          state.currentMode === 'learning-forward' &&
          state.forwardQueue.length === 0 &&
          state.backwardQueue.length > 0
        ) {
          return { ...state, currentMode: 'learning-backward' };
        } else if (
          state.currentMode === 'learning-backward' &&
          state.backwardQueue.length === 0 &&
          state.forwardQueue.length > 0
        ) {
          return { ...state, currentMode: 'learning-forward' };
        }
      }
      return state;
    });
  }

  static switchMode(mode: 'learning-forward' | 'learning-backward' | 'reviews') {
    learningState.update((state) => ({ ...state, currentMode: mode }));
  }

  static switchDirection(direction: 'forward' | 'backward') {
    learningState.update((state) => ({
      ...state,
      currentDirection: direction
    }));
    this.saveState();
  }

  static canSwitchToReviews(): boolean {
    const stats = get(queueStats);
    return stats.dueReviewsCount >= 10;
  }

  static canSwitchToLearning(): boolean {
    const stats = get(queueStats);
    return stats.forwardCount > 0 || stats.backwardCount > 0;
  }

  static saveState() {
    const state = get(learningState);
    Storage.saveLearningState(state);
  }

  static loadState(): LearningState | null {
    return Storage.getLearningState() as LearningState | null;
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
    detectedLevel: 'A1' | 'A2' | 'B1' | 'B2',
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
      ...state.recap7.map((w) => w.wordIndex),
      ...state.recap14.map((w) => w.wordIndex),
      ...state.recap30.map((w) => w.wordIndex),
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

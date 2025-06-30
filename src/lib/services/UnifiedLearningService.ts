import { Storage, type WordData } from '$lib/storage';
import {
  CardDirection,
  type CardResponse,
  type CurrentCard,
  type QueueStats,
  type UnifiedLearningState,
  type WordLearningItem
} from '$lib/types/queue';
import { derived, get, writable } from 'svelte/store';
import { QueueManager } from './QueueManager';

// Create default unified learning state
const createDefaultUnifiedState = (): UnifiedLearningState => ({
  detectedLevel: 'A1',
  levelTestResults: [],
  progress: 0,
  wordsLearned: 0,
  wordsReviewed: 0,
  learningQueue: [],
  learnedWords: [],
  currentMode: 'learning',
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

// Unified learning state store
export const unifiedLearningState = writable<UnifiedLearningState>(createDefaultUnifiedState());

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

export function clearWordsCache(): void {
  wordsCache = null;
}

// Derived store for current card
export const currentCard = derived<typeof unifiedLearningState, CurrentCard | null>(
  unifiedLearningState,
  ($state) => {
    if ($state.currentMode !== 'learning' && $state.currentMode !== 'reviewing') {
      return null;
    }

    const nextWord = QueueManager.getNextWordToStudy($state.learningQueue);
    if (!nextWord) {
      return null;
    }

    const wordData = getWordByIndex(nextWord.wordId);
    if (!wordData) {
      return null;
    }

    // Determine card direction based on stage
    let direction: CardDirection;
    if (nextWord.stage === 'passive') {
      direction = CardDirection.PASSIVE; // Learning language → Native
    } else {
      direction = CardDirection.ACTIVE; // Native → Learning language
    }

    return {
      wordId: nextWord.wordId,
      word: wordData.word,
      props: wordData.props,
      translations: wordData.translations,
      direction,
      stage: nextWord.stage,
      attempts: nextWord.attempts,
      consecutiveCorrect: nextWord.consecutiveCorrect,
      consecutiveWrong: nextWord.consecutiveWrong
    };
  }
);

// Derived store for queue statistics
export const queueStats = derived<typeof unifiedLearningState, QueueStats>(
  unifiedLearningState,
  ($state) => {
    return QueueManager.generateQueueStats($state.learningQueue, $state.learnedWords);
  }
);

/**
 * Unified Learning Service - Manages the new unified queue system
 */
export class UnifiedLearningService {
  /**
   * Initialize the unified learning system
   */
  static async initialize(): Promise<void> {
    // Load existing state if available
    this.loadState();

    // Ensure we have word data
    const words = getWordsData();
    if (words.length === 0) {
      console.warn('No word data available for learning');
    }
  }

  /**
   * Add a new word to the learning queue
   */
  static addWordToQueue(wordId: number): void {
    unifiedLearningState.update((state) => {
      // Check if word is already in queue or learned
      const existsInQueue = state.learningQueue.some((item) => item.wordId === wordId);
      const existsInLearned = state.learnedWords.includes(wordId);

      if (existsInQueue || existsInLearned) {
        return state; // Word already exists, no change
      }

      const newItem = QueueManager.addWordToQueue(wordId);

      return {
        ...state,
        learningQueue: [...state.learningQueue, newItem],
        progress: Math.max(state.progress, wordId),
        todayStats: {
          ...state.todayStats,
          newWords: state.todayStats.newWords + 1
        }
      };
    });
  }

  /**
   * Process user response to a card
   */
  static processCardResponse(response: CardResponse): void {
    unifiedLearningState.update((state) => {
      const itemIndex = state.learningQueue.findIndex((item) => item.wordId === response.wordId);
      if (itemIndex === -1) {
        console.warn(`Word ${response.wordId} not found in queue`);
        return state;
      }

      const currentItem = state.learningQueue[itemIndex];
      const result = QueueManager.processCardResponse(currentItem, response);

      // Update the queue
      let newQueue = [...state.learningQueue];

      if (result.wasLearned) {
        // Remove from queue and add to learned list
        newQueue = QueueManager.removeWordFromQueue(newQueue, response.wordId);
        const newLearnedWords = [...state.learnedWords, response.wordId];

        return {
          ...state,
          learningQueue: newQueue,
          learnedWords: newLearnedWords,
          wordsLearned: state.wordsLearned + 1,
          lastActivity: response.timestamp,
          todayStats: {
            ...state.todayStats,
            reviewWords: state.todayStats.reviewWords + 1
          }
        };
      } else {
        // Update the item in queue
        newQueue[itemIndex] = result.updatedItem;

        const statsUpdate = response.known
          ? result.wasPromoted
            ? { newWords: state.todayStats.newWords + 1 }
            : {}
          : {};

        return {
          ...state,
          learningQueue: newQueue,
          wordsReviewed: result.stageChanged ? state.wordsReviewed + 1 : state.wordsReviewed,
          lastActivity: response.timestamp,
          todayStats: {
            ...state.todayStats,
            reviewWords: state.todayStats.reviewWords + 1,
            ...statsUpdate
          }
        };
      }
    });
  }

  /**
   * Get next word to study
   */
  static getNextWord(): WordLearningItem | null {
    const state = get(unifiedLearningState);
    return QueueManager.getNextWordToStudy(state.learningQueue);
  }

  /**
   * Get queue statistics
   */
  static getQueueStats(): QueueStats {
    const state = get(unifiedLearningState);
    return QueueManager.generateQueueStats(state.learningQueue, state.learnedWords);
  }

  /**
   * Get available words count
   */
  static getAvailableWordsCount(): number {
    const state = get(unifiedLearningState);
    return QueueManager.getAvailableWords(state.learningQueue).length;
  }

  /**
   * Get overdue words count
   */
  static getOverdueWordsCount(): number {
    const state = get(unifiedLearningState);
    return QueueManager.getOverdueWords(state.learningQueue).length;
  }

  /**
   * Switch learning mode
   */
  static switchMode(mode: 'learning' | 'reviewing' | 'adding'): void {
    unifiedLearningState.update((state) => ({
      ...state,
      currentMode: mode,
      lastActivity: Date.now()
    }));
  }

  /**
   * Reset word progress (for debugging/manual intervention)
   */
  static resetWordProgress(wordId: number): void {
    unifiedLearningState.update((state) => {
      const itemIndex = state.learningQueue.findIndex((item) => item.wordId === wordId);
      if (itemIndex === -1) {
        return state;
      }

      const newQueue = [...state.learningQueue];
      newQueue[itemIndex] = QueueManager.resetWordProgress(newQueue[itemIndex]);

      return {
        ...state,
        learningQueue: newQueue
      };
    });
  }

  /**
   * Reschedule word for later study
   */
  static rescheduleWord(wordId: number, newShowAfter: number): void {
    unifiedLearningState.update((state) => {
      const itemIndex = state.learningQueue.findIndex((item) => item.wordId === wordId);
      if (itemIndex === -1) {
        return state;
      }

      const newQueue = [...state.learningQueue];
      newQueue[itemIndex] = QueueManager.rescheduleWord(newQueue[itemIndex], newShowAfter);

      return {
        ...state,
        learningQueue: newQueue
      };
    });
  }

  /**
   * Get words by stage
   */
  static getWordsByStage(
    stage: 'passive' | 'active' | 'review1' | 'review2' | 'review3'
  ): WordLearningItem[] {
    const state = get(unifiedLearningState);
    return QueueManager.getWordsByStage(state.learningQueue, stage);
  }

  /**
   * Save state to localStorage
   */
  static saveState(): void {
    try {
      const state = get(unifiedLearningState);
      localStorage.setItem('unified-learning-state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save unified learning state:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  static loadState(): void {
    try {
      const savedState = localStorage.getItem('unified-learning-state');
      if (savedState) {
        const parsedState = JSON.parse(savedState) as UnifiedLearningState;

        // Validate and migrate if needed
        const validatedState = this.validateAndMigrateState(parsedState);
        unifiedLearningState.set(validatedState);
      }
    } catch (error) {
      console.error('Failed to load unified learning state:', error);
      // Fall back to default state
      unifiedLearningState.set(createDefaultUnifiedState());
    }
  }

  /**
   * Validate and migrate state for compatibility
   */
  private static validateAndMigrateState(state: any): UnifiedLearningState {
    const defaultState = createDefaultUnifiedState();

    // Ensure all required properties exist
    const validatedState: UnifiedLearningState = {
      detectedLevel: state.detectedLevel || defaultState.detectedLevel,
      levelTestResults: Array.isArray(state.levelTestResults)
        ? state.levelTestResults
        : defaultState.levelTestResults,
      progress: typeof state.progress === 'number' ? state.progress : defaultState.progress,
      wordsLearned:
        typeof state.wordsLearned === 'number' ? state.wordsLearned : defaultState.wordsLearned,
      wordsReviewed:
        typeof state.wordsReviewed === 'number' ? state.wordsReviewed : defaultState.wordsReviewed,
      learningQueue: Array.isArray(state.learningQueue)
        ? state.learningQueue.filter((item: any) => QueueManager.validateQueueItem(item).isValid)
        : defaultState.learningQueue,
      learnedWords: Array.isArray(state.learnedWords)
        ? state.learnedWords
        : defaultState.learnedWords,
      currentMode: ['learning', 'reviewing', 'adding'].includes(state.currentMode)
        ? state.currentMode
        : defaultState.currentMode,
      lastActivity:
        typeof state.lastActivity === 'number' ? state.lastActivity : defaultState.lastActivity,
      sessionStartTime:
        typeof state.sessionStartTime === 'number' ? state.sessionStartTime : Date.now(),
      todayStats: {
        date:
          typeof state.todayStats?.date === 'string'
            ? state.todayStats.date
            : defaultState.todayStats.date,
        newWords:
          typeof state.todayStats?.newWords === 'number'
            ? state.todayStats.newWords
            : defaultState.todayStats.newWords,
        reviewWords:
          typeof state.todayStats?.reviewWords === 'number'
            ? state.todayStats.reviewWords
            : defaultState.todayStats.reviewWords,
        timeSpent:
          typeof state.todayStats?.timeSpent === 'number'
            ? state.todayStats.timeSpent
            : defaultState.todayStats.timeSpent,
        streakDays:
          typeof state.todayStats?.streakDays === 'number'
            ? state.todayStats.streakDays
            : defaultState.todayStats.streakDays
      }
    };

    return validatedState;
  }

  /**
   * Reset all progress (for testing or complete restart)
   */
  static resetProgress(): void {
    unifiedLearningState.set(createDefaultUnifiedState());
    this.saveState();
  }

  /**
   * Export learning data for backup
   */
  static exportData(): string {
    const state = get(unifiedLearningState);
    return JSON.stringify(
      {
        ...state,
        exportedAt: Date.now(),
        version: '1.0'
      },
      null,
      2
    );
  }

  /**
   * Import learning data from backup
   */
  static importData(jsonData: string): boolean {
    try {
      const importedData = JSON.parse(jsonData);
      const validatedState = this.validateAndMigrateState(importedData);
      unifiedLearningState.set(validatedState);
      this.saveState();
      return true;
    } catch (error) {
      console.error('Failed to import learning data:', error);
      return false;
    }
  }

  /**
   * Add word directly to learned list (for level test results)
   */
  static addWordToLearned(wordId: number): void {
    unifiedLearningState.update((state) => {
      // Check if word is already learned
      if (state.learnedWords.includes(wordId)) {
        return state; // Word already learned, no change
      }

      return {
        ...state,
        learnedWords: [...state.learnedWords, wordId],
        wordsLearned: state.wordsLearned + 1,
        progress: Math.max(state.progress, wordId + 1)
      };
    });
  }

  /**
   * Update detected level
   */
  static updateDetectedLevel(level: string): void {
    unifiedLearningState.update((state) => ({
      ...state,
      detectedLevel: level
    }));
  }

  /**
   * Get learning analytics
   */
  static getAnalytics(): {
    totalWords: number;
    wordsLearned: number;
    averageAttemptsPerStage: Record<string, number>;
    learningEfficiency: number;
  } {
    const state = get(unifiedLearningState);
    const totalWords = state.learningQueue.length + state.learnedWords.length;

    // Calculate average attempts per stage
    const stageAttempts: Record<string, { total: number; count: number }> = {
      passive: { total: 0, count: 0 },
      active: { total: 0, count: 0 },
      review1: { total: 0, count: 0 },
      review2: { total: 0, count: 0 },
      review3: { total: 0, count: 0 }
    };

    state.learningQueue.forEach((item) => {
      if (stageAttempts[item.stage]) {
        stageAttempts[item.stage].total += item.attempts;
        stageAttempts[item.stage].count += 1;
      }
    });

    const averageAttemptsPerStage: Record<string, number> = {};
    Object.keys(stageAttempts).forEach((stage) => {
      const data = stageAttempts[stage];
      averageAttemptsPerStage[stage] = data.count > 0 ? data.total / data.count : 0;
    });

    // Calculate learning efficiency (learned words / total attempts)
    const totalAttempts = state.learningQueue.reduce((sum, item) => sum + item.attempts, 0);
    const learningEfficiency = totalAttempts > 0 ? state.learnedWords.length / totalAttempts : 0;

    return {
      totalWords,
      wordsLearned: state.learnedWords.length,
      averageAttemptsPerStage,
      learningEfficiency
    };
  }
}

// Auto-save state on changes
unifiedLearningState.subscribe(() => {
  UnifiedLearningService.saveState();
});

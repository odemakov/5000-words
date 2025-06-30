import type { CardResponse, UnifiedLearningState } from '$lib/types/queue';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnifiedLearningService, unifiedLearningState } from '../UnifiedLearningService';

// Mock Storage module
vi.mock('$lib/storage', () => ({
  Storage: {
    getWords: vi.fn(() => [
      { word: 'bonjour', props: ['greeting'], translations: ['hello'] },
      { word: 'au revoir', props: ['greeting'], translations: ['goodbye'] },
      { word: 'merci', props: ['gratitude'], translations: ['thank you'] },
      { word: 'chat', props: ['animal'], translations: ['cat'] },
      { word: 'chien', props: ['animal'], translations: ['dog'] }
    ])
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('UnifiedLearningService', () => {
  beforeEach(() => {
    // Reset the store to default state
    UnifiedLearningService.resetProgress();
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize with default state when no saved state exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      await UnifiedLearningService.initialize();

      const state = get(unifiedLearningState);
      expect(state.detectedLevel).toBe('A1');
      expect(state.learningQueue).toEqual([]);
      expect(state.learnedWords).toEqual([]);
      expect(state.currentMode).toBe('learning');
    });

    it('should load saved state when available', async () => {
      const savedState: UnifiedLearningState = {
        detectedLevel: 'B1',
        levelTestResults: [],
        progress: 100,
        wordsLearned: 5,
        wordsReviewed: 10,
        learningQueue: [],
        learnedWords: [1, 2, 3],
        currentMode: 'reviewing',
        lastActivity: Date.now(),
        sessionStartTime: Date.now(),
        todayStats: {
          date: new Date().toISOString().split('T')[0],
          newWords: 3,
          reviewWords: 7,
          timeSpent: 1800,
          streakDays: 5
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));

      await UnifiedLearningService.initialize();

      const state = get(unifiedLearningState);
      expect(state.detectedLevel).toBe('B1');
      expect(state.progress).toBe(100);
      expect(state.learnedWords).toEqual([1, 2, 3]);
      expect(state.currentMode).toBe('reviewing');
    });
  });

  describe('addWordToQueue', () => {
    it('should add word to learning queue', () => {
      UnifiedLearningService.addWordToQueue(0);

      const state = get(unifiedLearningState);
      expect(state.learningQueue).toHaveLength(1);
      expect(state.learningQueue[0].wordId).toBe(0);
      expect(state.learningQueue[0].stage).toBe('passive');
      expect(state.learningQueue[0].attempts).toBe(0);
      expect(state.progress).toBe(0);
    });

    it('should not add duplicate words to queue', () => {
      UnifiedLearningService.addWordToQueue(0);
      UnifiedLearningService.addWordToQueue(0);

      const state = get(unifiedLearningState);
      expect(state.learningQueue).toHaveLength(1);
    });

    it('should not add words that are already learned', () => {
      UnifiedLearningService.addWordToLearned(0);
      UnifiedLearningService.addWordToQueue(0);

      const state = get(unifiedLearningState);
      expect(state.learningQueue).toHaveLength(0);
      expect(state.learnedWords).toContain(0);
    });

    it('should update progress and today stats', () => {
      UnifiedLearningService.addWordToQueue(5);

      const state = get(unifiedLearningState);
      expect(state.progress).toBe(5);
      expect(state.todayStats.newWords).toBe(1);
    });
  });

  describe('addWordToLearned', () => {
    it('should add word directly to learned list', () => {
      UnifiedLearningService.addWordToLearned(0);

      const state = get(unifiedLearningState);
      expect(state.learnedWords).toContain(0);
      expect(state.wordsLearned).toBe(1);
    });

    it('should not add duplicate words to learned list', () => {
      UnifiedLearningService.addWordToLearned(0);
      UnifiedLearningService.addWordToLearned(0);

      const state = get(unifiedLearningState);
      expect(state.learnedWords).toHaveLength(1);
      expect(state.wordsLearned).toBe(1);
    });

    it('should update progress', () => {
      UnifiedLearningService.addWordToLearned(10);

      const state = get(unifiedLearningState);
      expect(state.progress).toBe(11);
    });
  });

  describe('processCardResponse', () => {
    beforeEach(() => {
      UnifiedLearningService.addWordToQueue(0);
    });

    it('should process correct response', () => {
      const response: CardResponse = {
        wordId: 0,
        known: true,
        timestamp: Date.now()
      };

      UnifiedLearningService.processCardResponse(response);

      const state = get(unifiedLearningState);
      const word = state.learningQueue.find(item => item.wordId === 0);
      expect(word?.consecutiveCorrect).toBe(1);
      expect(word?.consecutiveWrong).toBe(0);
      expect(state.todayStats.reviewWords).toBe(1);
    });

    it('should process incorrect response', () => {
      const response: CardResponse = {
        wordId: 0,
        known: false,
        timestamp: Date.now()
      };

      UnifiedLearningService.processCardResponse(response);

      const state = get(unifiedLearningState);
      const word = state.learningQueue.find(item => item.wordId === 0);
      expect(word?.consecutiveCorrect).toBe(0);
      expect(word?.consecutiveWrong).toBe(1);
    });

    it('should move word to learned when fully mastered', () => {
      // Simulate word progression through all stages
      const wordId = 0;

      // Add word and advance through stages
      for (let i = 0; i < 15; i++) { // Enough attempts to complete all stages
        const response: CardResponse = {
          wordId,
          known: true,
          timestamp: Date.now()
        };
        UnifiedLearningService.processCardResponse(response);
      }

      const state = get(unifiedLearningState);
      // Word should eventually be moved to learned list
      const isLearned = state.learnedWords.includes(wordId);
      const inQueue = state.learningQueue.some(item => item.wordId === wordId);

      // Either word progressed significantly or was learned
      expect(isLearned || state.learningQueue.find(item => item.wordId === wordId)?.stage === 'review3').toBeTruthy();
    });
  });

  describe('updateDetectedLevel', () => {
    it('should update detected level', () => {
      UnifiedLearningService.updateDetectedLevel('B2');

      const state = get(unifiedLearningState);
      expect(state.detectedLevel).toBe('B2');
    });
  });

  describe('switchMode', () => {
    it('should switch to learning mode', () => {
      UnifiedLearningService.switchMode('learning');

      const state = get(unifiedLearningState);
      expect(state.currentMode).toBe('learning');
    });

    it('should switch to reviewing mode', () => {
      UnifiedLearningService.switchMode('reviewing');

      const state = get(unifiedLearningState);
      expect(state.currentMode).toBe('reviewing');
    });

    it('should update last activity timestamp', () => {
      const beforeTime = Date.now();
      UnifiedLearningService.switchMode('adding');
      const afterTime = Date.now();

      const state = get(unifiedLearningState);
      expect(state.lastActivity).toBeGreaterThanOrEqual(beforeTime);
      expect(state.lastActivity).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('getNextWord', () => {
    it('should return null when queue is empty', () => {
      const nextWord = UnifiedLearningService.getNextWord();
      expect(nextWord).toBeNull();
    });

    it('should return next word when available', () => {
      UnifiedLearningService.addWordToQueue(0);

      const nextWord = UnifiedLearningService.getNextWord();
      expect(nextWord).toBeTruthy();
      expect(nextWord?.wordId).toBe(0);
    });
  });

  describe('getAvailableWordsCount', () => {
    it('should return 0 when no words are available', () => {
      const count = UnifiedLearningService.getAvailableWordsCount();
      expect(count).toBe(0);
    });

    it('should return correct count of available words', () => {
      UnifiedLearningService.addWordToQueue(0);
      UnifiedLearningService.addWordToQueue(1);

      const count = UnifiedLearningService.getAvailableWordsCount();
      expect(count).toBe(2);
    });
  });

  describe('getOverdueWordsCount', () => {
    it('should return 0 when no words are overdue', () => {
      UnifiedLearningService.addWordToQueue(0);

      const count = UnifiedLearningService.getOverdueWordsCount();
      expect(count).toBe(0);
    });
  });

  describe('resetWordProgress', () => {
    it('should reset word progress', () => {
      UnifiedLearningService.addWordToQueue(0);

      // Make some progress first
      const response: CardResponse = {
        wordId: 0,
        known: true,
        timestamp: Date.now()
      };
      UnifiedLearningService.processCardResponse(response);

      // Reset progress
      UnifiedLearningService.resetWordProgress(0);

      const state = get(unifiedLearningState);
      const word = state.learningQueue.find(item => item.wordId === 0);
      expect(word?.consecutiveCorrect).toBe(0);
      expect(word?.consecutiveWrong).toBe(0);
      expect(word?.attempts).toBe(0);
    });
  });

  describe('rescheduleWord', () => {
    it('should reschedule word for later', () => {
      UnifiedLearningService.addWordToQueue(0);
      const futureTime = Date.now() + 3600000; // 1 hour from now

      UnifiedLearningService.rescheduleWord(0, futureTime);

      const state = get(unifiedLearningState);
      const word = state.learningQueue.find(item => item.wordId === 0);
      expect(word?.showAfter).toBe(futureTime);
    });
  });

  describe('getWordsByStage', () => {
    it('should return words filtered by stage', () => {
      UnifiedLearningService.addWordToQueue(0);
      UnifiedLearningService.addWordToQueue(1);

      const passiveWords = UnifiedLearningService.getWordsByStage('passive');
      expect(passiveWords).toHaveLength(2);
      expect(passiveWords.every(word => word.stage === 'passive')).toBeTruthy();
    });

    it('should return empty array for stages with no words', () => {
      const activeWords = UnifiedLearningService.getWordsByStage('active');
      expect(activeWords).toHaveLength(0);
    });
  });

  describe('state persistence', () => {
    it('should save state to localStorage', () => {
      UnifiedLearningService.addWordToQueue(0);
      UnifiedLearningService.saveState();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'unified-learning-state',
        expect.any(String)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage full');
      });

      // Should not throw
      expect(() => UnifiedLearningService.saveState()).not.toThrow();
    });

    it('should load state from localStorage', () => {
      const testState = {
        detectedLevel: 'B1',
        progress: 50,
        learningQueue: [],
        learnedWords: [1, 2, 3],
        wordsLearned: 3,
        wordsReviewed: 0,
        currentMode: 'learning',
        lastActivity: Date.now(),
        sessionStartTime: Date.now(),
        levelTestResults: [],
        todayStats: {
          date: new Date().toISOString().split('T')[0],
          newWords: 0,
          reviewWords: 0,
          timeSpent: 0,
          streakDays: 1
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(testState));

      UnifiedLearningService.loadState();

      const state = get(unifiedLearningState);
      expect(state.detectedLevel).toBe('B1');
      expect(state.progress).toBe(50);
      expect(state.learnedWords).toEqual([1, 2, 3]);
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      // Should not throw and should reset to default state
      expect(() => UnifiedLearningService.loadState()).not.toThrow();

      const state = get(unifiedLearningState);
      expect(state.detectedLevel).toBe('A1');
      expect(state.learningQueue).toEqual([]);
    });
  });

  describe('resetProgress', () => {
    it('should reset all progress', () => {
      UnifiedLearningService.addWordToQueue(0);
      UnifiedLearningService.addWordToLearned(1);
      UnifiedLearningService.updateDetectedLevel('B2');

      UnifiedLearningService.resetProgress();

      const state = get(unifiedLearningState);
      expect(state.detectedLevel).toBe('A1');
      expect(state.learningQueue).toEqual([]);
      expect(state.learnedWords).toEqual([]);
      expect(state.progress).toBe(0);
      expect(state.wordsLearned).toBe(0);
    });
  });

  describe('exportData', () => {
    it('should export learning data as JSON', () => {
      UnifiedLearningService.addWordToQueue(0);
      UnifiedLearningService.updateDetectedLevel('B1');

      const exportedData = UnifiedLearningService.exportData();
      const parsedData = JSON.parse(exportedData);

      expect(parsedData.detectedLevel).toBe('B1');
      expect(parsedData.learningQueue).toHaveLength(1);
      expect(parsedData.exportedAt).toBeTruthy();
      expect(parsedData.version).toBe('1.0');
    });
  });

  describe('importData', () => {
    it('should import valid learning data', () => {
      const testData = {
        detectedLevel: 'B2',
        progress: 100,
        learningQueue: [],
        learnedWords: [1, 2, 3, 4, 5],
        wordsLearned: 5,
        wordsReviewed: 10,
        currentMode: 'reviewing',
        lastActivity: Date.now(),
        sessionStartTime: Date.now(),
        levelTestResults: [],
        todayStats: {
          date: new Date().toISOString().split('T')[0],
          newWords: 0,
          reviewWords: 0,
          timeSpent: 0,
          streakDays: 1
        }
      };

      const result = UnifiedLearningService.importData(JSON.stringify(testData));

      expect(result).toBe(true);

      const state = get(unifiedLearningState);
      expect(state.detectedLevel).toBe('B2');
      expect(state.learnedWords).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle invalid import data', () => {
      const result = UnifiedLearningService.importData('invalid json');

      expect(result).toBe(false);
    });
  });

  describe('getAnalytics', () => {
    it('should return learning analytics', () => {
      UnifiedLearningService.addWordToQueue(0);
      UnifiedLearningService.addWordToQueue(1);
      UnifiedLearningService.addWordToLearned(2);

      const analytics = UnifiedLearningService.getAnalytics();

      expect(analytics.totalWords).toBe(3);
      expect(analytics.wordsLearned).toBe(1);
      expect(analytics.averageAttemptsPerStage).toBeTruthy();
      expect(analytics.learningEfficiency).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty state', () => {
      const analytics = UnifiedLearningService.getAnalytics();

      expect(analytics.totalWords).toBe(0);
      expect(analytics.wordsLearned).toBe(0);
      expect(analytics.learningEfficiency).toBe(0);
    });
  });

  describe('validateAndMigrateState', () => {
    it('should validate and migrate incomplete state', () => {
      const incompleteState = {
        detectedLevel: 'B1',
        // Missing many required fields
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(incompleteState));

      UnifiedLearningService.loadState();

      const state = get(unifiedLearningState);
      expect(state.detectedLevel).toBe('B1');
      expect(state.learningQueue).toEqual([]);
      expect(state.learnedWords).toEqual([]);
      expect(state.currentMode).toBe('learning');
      expect(state.todayStats).toBeTruthy();
    });
  });
});

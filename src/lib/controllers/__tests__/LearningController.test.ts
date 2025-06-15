import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LEVEL_A1 } from '../../constants/modes';
import type { WordData } from '../../storage';
import { Storage } from '../../storage';
import type { LearningState } from '../../types/learning';
import {
  clearWordsCache,
  getLearningForwardCount,
  getWordByIndex,
  LearningController,
  learningState
} from '../LearningController';

// Mock storage
vi.mock('../../storage', () => ({
  Storage: {
    getWords: vi.fn(),
    saveLearningState: vi.fn(),
    getLearningState: vi.fn()
  }
}));

// Mock word data
const mockWords: WordData[] = [
  { id: 0, word: 'le', props: ['m'], translations: ['the'] },
  { id: 1, word: 'être', props: ['v'], translations: ['to be'] },
  { id: 2, word: 'avoir', props: ['v'], translations: ['to have'] },
  { id: 3, word: 'je', props: ['pron'], translations: ['I'] },
  { id: 4, word: 'de', props: ['prep'], translations: ['of, from'] },
  { id: 5, word: 'ne', props: ['adv'], translations: ['not'] },
  { id: 6, word: 'pas', props: ['adv'], translations: ['not'] },
  { id: 7, word: 'pour', props: ['prep'], translations: ['for'] },
  { id: 8, word: 'que', props: ['conj'], translations: ['that'] },
  { id: 9, word: 'qui', props: ['pron'], translations: ['who'] },
  { id: 10, word: 'dans', props: ['prep'], translations: ['in'] },
  { id: 11, word: 'ce', props: ['pron'], translations: ['this'] },
  { id: 12, word: 'il', props: ['pron'], translations: ['he'] },
  { id: 13, word: 'un', props: ['det'], translations: ['a, an'] },
  { id: 14, word: 'sur', props: ['prep'], translations: ['on'] }
];

describe('LearningController', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup default mock behavior
    vi.mocked(Storage.getWords).mockReturnValue(mockWords);
    vi.mocked(Storage.getLearningState).mockReturnValue(null);

    // Reset state to default
    const defaultState: LearningState = {
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
    };
    learningState.set(defaultState);
  });

  describe('getWordByIndex', () => {
    it('should return word data for valid index', () => {
      const word = getWordByIndex(0);
      expect(word).toEqual(mockWords[0]);
    });

    it('should return null for invalid index', () => {
      const word = getWordByIndex(999);
      expect(word).toBeNull();
    });

    it('should return null for negative index', () => {
      const word = getWordByIndex(-1);
      expect(word).toBeNull();
    });

    it('should cache words data after first call', () => {
      // Clear cache before test
      clearWordsCache();

      getWordByIndex(0);
      getWordByIndex(1);
      getWordByIndex(2);

      // Should only call getWords once due to caching
      expect(Storage.getWords).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLearningForwardCount', () => {
    it('should return 0 when forwardQueue is empty', () => {
      expect(getLearningForwardCount()).toBe(0);
    });

    it('should return correct count when forwardQueue has items', () => {
      learningState.update((state) => ({
        ...state,
        forwardQueue: [
          { wordIndex: 0, addedAt: Date.now(), attempts: 0 },
          { wordIndex: 1, addedAt: Date.now(), attempts: 0 },
          { wordIndex: 2, addedAt: Date.now(), attempts: 0 }
        ]
      }));

      expect(getLearningForwardCount()).toBe(3);
    });
  });

  describe('addWordToQueue', () => {
    it('should add word to forwardQueue', () => {
      LearningController.addWordToQueue(5);

      const state = get(learningState);
      expect(state.forwardQueue).toHaveLength(1);
      expect(state.forwardQueue[0].wordIndex).toBe(5);
      expect(state.forwardQueue[0].attempts).toBe(0);
    });

    it('should update progress when adding word', () => {
      LearningController.addWordToQueue(10);

      const state = get(learningState);
      expect(state.progress).toBe(11); // wordIndex + 1
    });

    it('should maintain highest progress', () => {
      LearningController.addWordToQueue(5);
      LearningController.addWordToQueue(3);

      const state = get(learningState);
      expect(state.progress).toBe(6); // Should keep highest value
    });

    it('should update lastActivity timestamp', () => {
      const before = Date.now();
      LearningController.addWordToQueue(0);
      const after = Date.now();

      const state = get(learningState);
      expect(state.lastActivity).toBeGreaterThanOrEqual(before);
      expect(state.lastActivity).toBeLessThanOrEqual(after);
    });

    it('should save state after adding word', () => {
      LearningController.addWordToQueue(0);
      expect(Storage.saveLearningState).toHaveBeenCalled();
    });
  });

  describe('addWordToLearned', () => {
    it('should add word to learnedList', () => {
      LearningController.addWordToLearned(7);

      const state = get(learningState);
      expect(state.learnedList).toContain(7);
      expect(state.learnedList).toHaveLength(1);
    });

    it('should increment wordsLearned count', () => {
      LearningController.addWordToLearned(7);

      const state = get(learningState);
      expect(state.wordsLearned).toBe(1);
    });

    it('should update progress when adding learned word', () => {
      LearningController.addWordToLearned(12);

      const state = get(learningState);
      expect(state.progress).toBe(13); // wordIndex + 1
    });

    it('should update lastActivity timestamp', () => {
      const before = Date.now();
      LearningController.addWordToLearned(0);
      const after = Date.now();

      const state = get(learningState);
      expect(state.lastActivity).toBeGreaterThanOrEqual(before);
      expect(state.lastActivity).toBeLessThanOrEqual(after);
    });

    it('should save state after adding learned word', () => {
      LearningController.addWordToLearned(0);
      expect(Storage.saveLearningState).toHaveBeenCalled();
    });
  });

  describe('canStartLearning', () => {
    it('should return false when forwardQueue has less than 10 words', () => {
      learningState.update((state) => ({
        ...state,
        forwardQueue: [
          { wordIndex: 0, addedAt: Date.now(), attempts: 0 },
          { wordIndex: 1, addedAt: Date.now(), attempts: 0 }
        ]
      }));

      expect(LearningController.canStartLearning()).toBe(false);
    });

    it('should return true when forwardQueue has exactly 10 words', () => {
      const queue = Array.from({ length: 10 }, (_, i) => ({
        wordIndex: i,
        addedAt: Date.now(),
        attempts: 0
      }));

      learningState.update((state) => ({
        ...state,
        forwardQueue: queue
      }));

      expect(LearningController.canStartLearning()).toBe(true);
    });

    it('should return true when forwardQueue has more than 10 words', () => {
      const queue = Array.from({ length: 15 }, (_, i) => ({
        wordIndex: i,
        addedAt: Date.now(),
        attempts: 0
      }));

      learningState.update((state) => ({
        ...state,
        forwardQueue: queue
      }));

      expect(LearningController.canStartLearning()).toBe(true);
    });
  });

  describe('Queue interaction scenarios', () => {
    it('should handle adding multiple words in sequence', () => {
      LearningController.addWordToQueue(0);
      LearningController.addWordToQueue(1);
      LearningController.addWordToQueue(2);
      LearningController.addWordToLearned(3);
      LearningController.addWordToLearned(4);

      const state = get(learningState);
      expect(state.forwardQueue).toHaveLength(3);
      expect(state.learnedList).toHaveLength(2);
      expect(state.progress).toBe(5); // Highest index (4) + 1
      expect(state.wordsLearned).toBe(2);
    });

    it('should not allow learning to start with mixed queue and learned words under 10 total', () => {
      // Add 5 to queue
      for (let i = 0; i < 5; i++) {
        LearningController.addWordToQueue(i);
      }

      // Add 4 to learned
      for (let i = 5; i < 9; i++) {
        LearningController.addWordToLearned(i);
      }

      // Total is 9, but only 5 in queue
      expect(LearningController.canStartLearning()).toBe(false);
    });
  });
});

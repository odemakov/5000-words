import type { CardResponse, LearningStage, WordLearningItem } from '$lib/types/queue';
import { beforeEach, describe, expect, it } from 'vitest';
import { QueueManager } from '../QueueManager';

describe('QueueManager', () => {
  let mockCurrentTime: number;
  let testWord: WordLearningItem;
  let testQueue: WordLearningItem[];

  beforeEach(() => {
    mockCurrentTime = 1700000000000; // Fixed timestamp for consistent testing
    testWord = {
      wordId: 1,
      stage: 'passive',
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      showAfter: mockCurrentTime,
      attempts: 0,
      addedAt: mockCurrentTime,
      lastSeen: 0
    };

    testQueue = [
      {
        wordId: 1,
        stage: 'passive',
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
        showAfter: mockCurrentTime,
        attempts: 0,
        addedAt: mockCurrentTime,
        lastSeen: 0
      },
      {
        wordId: 2,
        stage: 'active',
        consecutiveCorrect: 1,
        consecutiveWrong: 0,
        showAfter: mockCurrentTime - 1000,
        attempts: 5,
        addedAt: mockCurrentTime - 10000,
        lastSeen: mockCurrentTime - 1000
      },
      {
        wordId: 3,
        stage: 'review1',
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
        showAfter: mockCurrentTime + 1000,
        attempts: 10,
        addedAt: mockCurrentTime - 20000,
        lastSeen: mockCurrentTime - 5000
      },
      {
        wordId: 4,
        stage: 'review2',
        consecutiveCorrect: 2,
        consecutiveWrong: 0,
        showAfter: mockCurrentTime - 5000,
        attempts: 15,
        addedAt: mockCurrentTime - 30000,
        lastSeen: mockCurrentTime - 8000
      },
      {
        wordId: 5,
        stage: 'review3',
        consecutiveCorrect: 1,
        consecutiveWrong: 0,
        showAfter: mockCurrentTime + 5000,
        attempts: 20,
        addedAt: mockCurrentTime - 40000,
        lastSeen: mockCurrentTime - 10000
      }
    ];
  });

  describe('addWordToQueue', () => {
    it('should create a new word learning item with correct initial values', () => {
      const newWord = QueueManager.addWordToQueue(42, mockCurrentTime);

      expect(newWord).toEqual({
        wordId: 42,
        stage: 'passive',
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
        showAfter: mockCurrentTime,
        attempts: 0,
        addedAt: mockCurrentTime,
        lastSeen: 0
      });
    });

    it('should use current time when no time is provided', () => {
      const before = Date.now();
      const newWord = QueueManager.addWordToQueue(42);
      const after = Date.now();

      expect(newWord.addedAt).toBeGreaterThanOrEqual(before);
      expect(newWord.addedAt).toBeLessThanOrEqual(after);
      expect(newWord.showAfter).toBe(newWord.addedAt);
    });
  });

  describe('processCardResponse', () => {
    describe('correct responses', () => {
      it('should increment consecutiveCorrect and reset consecutiveWrong', () => {
        const response: CardResponse = {
          wordId: 1,
          known: true,
          responseTime: 2000,
          timestamp: mockCurrentTime + 1000
        };

        const result = QueueManager.processCardResponse(testWord, response);

        expect(result.updatedItem.consecutiveCorrect).toBe(1);
        expect(result.updatedItem.consecutiveWrong).toBe(0);
        expect(result.updatedItem.attempts).toBe(1);
        expect(result.updatedItem.lastSeen).toBe(response.timestamp);
      });

      it('should promote word after 3 consecutive correct answers', () => {
        const wordReadyForPromotion = {
          ...testWord,
          consecutiveCorrect: 2 // One more correct will trigger promotion
        };

        const response: CardResponse = {
          wordId: 1,
          known: true,
          responseTime: 2000,
          timestamp: mockCurrentTime + 1000
        };

        const result = QueueManager.processCardResponse(wordReadyForPromotion, response);

        expect(result.stageChanged).toBe(true);
        expect(result.wasPromoted).toBe(true);
        expect(result.updatedItem.stage).toBe('active');
        expect(result.updatedItem.consecutiveCorrect).toBe(0); // Reset after promotion
        expect(result.updatedItem.showAfter).toBeGreaterThan(response.timestamp);
      });

      it('should mark word as learned when advancing from review3', () => {
        const review3Word = {
          ...testWord,
          stage: 'review3' as const,
          consecutiveCorrect: 2
        };

        const response: CardResponse = {
          wordId: 1,
          known: true,
          responseTime: 2000,
          timestamp: mockCurrentTime + 1000
        };

        const result = QueueManager.processCardResponse(review3Word, response);

        expect(result.wasLearned).toBe(true);
        expect(result.stageChanged).toBe(false); // No stage change, word is learned
      });
    });

    describe('incorrect responses', () => {
      it('should increment consecutiveWrong and reset consecutiveCorrect', () => {
        const wordWithProgress = {
          ...testWord,
          consecutiveCorrect: 2
        };

        const response: CardResponse = {
          wordId: 1,
          known: false,
          responseTime: 5000,
          timestamp: mockCurrentTime + 1000
        };

        const result = QueueManager.processCardResponse(wordWithProgress, response);

        expect(result.updatedItem.consecutiveWrong).toBe(1);
        expect(result.updatedItem.consecutiveCorrect).toBe(0); // Reset
        expect(result.updatedItem.showAfter).toBe(response.timestamp + 1000 * 60 * 5); // 5 minute delay
      });

      it('should demote word after 3 consecutive wrong answers', () => {
        const activeWordReadyForDemotion = {
          ...testWord,
          stage: 'active' as const,
          consecutiveWrong: 2
        };

        const response: CardResponse = {
          wordId: 1,
          known: false,
          responseTime: 3000,
          timestamp: mockCurrentTime + 1000
        };

        const result = QueueManager.processCardResponse(activeWordReadyForDemotion, response);

        expect(result.stageChanged).toBe(true);
        expect(result.wasDemoted).toBe(true);
        expect(result.updatedItem.stage).toBe('passive');
        expect(result.updatedItem.consecutiveWrong).toBe(0); // Reset after demotion
      });

      it('should not demote from passive stage', () => {
        const passiveWord = {
          ...testWord,
          consecutiveWrong: 2
        };

        const response: CardResponse = {
          wordId: 1,
          known: false,
          responseTime: 3000,
          timestamp: mockCurrentTime + 1000
        };

        const result = QueueManager.processCardResponse(passiveWord, response);

        expect(result.stageChanged).toBe(false);
        expect(result.wasDemoted).toBe(false);
        expect(result.updatedItem.stage).toBe('passive');
        expect(result.updatedItem.consecutiveWrong).toBe(0); // Reset since can't demote
      });
    });
  });

  describe('calculateNextShowTime', () => {
    it('should return immediate time for passive stage', () => {
      const nextTime = QueueManager.calculateNextShowTime('passive', mockCurrentTime);
      expect(nextTime).toBe(mockCurrentTime); // No delay for passive
    });

    it('should add 1 hour for active stage', () => {
      const nextTime = QueueManager.calculateNextShowTime('active', mockCurrentTime);
      expect(nextTime).toBe(mockCurrentTime + 1000 * 60 * 60); // 1 hour
    });

    it('should add 1 day for review1 stage', () => {
      const nextTime = QueueManager.calculateNextShowTime('review1', mockCurrentTime);
      expect(nextTime).toBe(mockCurrentTime + 1000 * 60 * 60 * 24); // 1 day
    });

    it('should add 3 days for review2 stage', () => {
      const nextTime = QueueManager.calculateNextShowTime('review2', mockCurrentTime);
      expect(nextTime).toBe(mockCurrentTime + 1000 * 60 * 60 * 24 * 3); // 3 days
    });

    it('should add 7 days for review3 stage', () => {
      const nextTime = QueueManager.calculateNextShowTime('review3', mockCurrentTime);
      expect(nextTime).toBe(mockCurrentTime + 1000 * 60 * 60 * 24 * 7); // 7 days
    });
  });

  describe('getAvailableWords', () => {
    it('should return words that are ready for study', () => {
      const available = QueueManager.getAvailableWords(testQueue, mockCurrentTime);

      // Should include words with showAfter <= mockCurrentTime
      expect(available).toHaveLength(3);
      expect(available.map((w) => w.wordId)).toEqual([1, 2, 4]);
    });

    it('should return empty array when no words are available', () => {
      const futureQueue = testQueue.map((word) => ({
        ...word,
        showAfter: mockCurrentTime + 10000
      }));

      const available = QueueManager.getAvailableWords(futureQueue, mockCurrentTime);
      expect(available).toHaveLength(0);
    });
  });

  describe('getScheduledWords', () => {
    it('should return words scheduled for later', () => {
      const scheduled = QueueManager.getScheduledWords(testQueue, mockCurrentTime);

      // Should include words with showAfter > mockCurrentTime
      expect(scheduled).toHaveLength(2);
      expect(scheduled.map((w) => w.wordId)).toEqual([3, 5]);
    });
  });

  describe('getWordsByStage', () => {
    it('should return words filtered by stage', () => {
      const passiveWords = QueueManager.getWordsByStage(testQueue, 'passive');
      expect(passiveWords).toHaveLength(1);
      expect(passiveWords[0].wordId).toBe(1);

      const review1Words = QueueManager.getWordsByStage(testQueue, 'review1');
      expect(review1Words).toHaveLength(1);
      expect(review1Words[0].wordId).toBe(3);
    });

    it('should return empty array for stage with no words', () => {
      const nonExistentStage = QueueManager.getWordsByStage([], 'active');
      expect(nonExistentStage).toHaveLength(0);
    });
  });

  describe('getNextWordToStudy', () => {
    it('should return most overdue word first', () => {
      const nextWord = QueueManager.getNextWordToStudy(testQueue, mockCurrentTime);

      // Word 4 (review2) is most overdue (showAfter: mockCurrentTime - 5000)
      expect(nextWord?.wordId).toBe(4);
    });

    it('should prioritize by stage order when equally overdue', () => {
      const equallyAvailableQueue = [
        {
          wordId: 1,
          stage: 'review1' as const,
          consecutiveCorrect: 0,
          consecutiveWrong: 0,
          showAfter: mockCurrentTime,
          attempts: 0,
          addedAt: mockCurrentTime,
          lastSeen: 0
        },
        {
          wordId: 2,
          stage: 'passive' as const,
          consecutiveCorrect: 0,
          consecutiveWrong: 0,
          showAfter: mockCurrentTime,
          attempts: 0,
          addedAt: mockCurrentTime,
          lastSeen: 0
        },
        {
          wordId: 3,
          stage: 'active' as const,
          consecutiveCorrect: 0,
          consecutiveWrong: 0,
          showAfter: mockCurrentTime,
          attempts: 0,
          addedAt: mockCurrentTime,
          lastSeen: 0
        }
      ];

      const nextWord = QueueManager.getNextWordToStudy(equallyAvailableQueue, mockCurrentTime);

      // Should prioritize passive first
      expect(nextWord?.wordId).toBe(2);
    });

    it('should return null when no words are available', () => {
      const futureQueue = testQueue.map((word) => ({
        ...word,
        showAfter: mockCurrentTime + 10000
      }));

      const nextWord = QueueManager.getNextWordToStudy(futureQueue, mockCurrentTime);
      expect(nextWord).toBeNull();
    });
  });

  describe('generateQueueStats', () => {
    it('should generate accurate statistics for all stages', () => {
      const learnedWords = [100, 101, 102];
      const stats = QueueManager.generateQueueStats(testQueue, learnedWords, mockCurrentTime);

      expect(stats.passive.total).toBe(1);
      expect(stats.passive.available).toBe(1);
      expect(stats.passive.scheduled).toBe(0);

      expect(stats.active.total).toBe(1);
      expect(stats.active.available).toBe(1);
      expect(stats.active.scheduled).toBe(0);

      expect(stats.review1.total).toBe(1);
      expect(stats.review1.available).toBe(0);
      expect(stats.review1.scheduled).toBe(1);

      expect(stats.review2.total).toBe(1);
      expect(stats.review2.available).toBe(1);
      expect(stats.review2.scheduled).toBe(0);

      expect(stats.review3.total).toBe(1);
      expect(stats.review3.available).toBe(0);
      expect(stats.review3.scheduled).toBe(1);

      expect(stats.learned).toBe(3);
    });
  });

  describe('removeWordFromQueue', () => {
    it('should remove word with matching wordId', () => {
      const updatedQueue = QueueManager.removeWordFromQueue(testQueue, 2);

      expect(updatedQueue).toHaveLength(4);
      expect(updatedQueue.find((w) => w.wordId === 2)).toBeUndefined();
    });

    it('should return unchanged queue when wordId not found', () => {
      const updatedQueue = QueueManager.removeWordFromQueue(testQueue, 999);

      expect(updatedQueue).toHaveLength(5);
      expect(updatedQueue).toEqual(testQueue);
    });
  });

  describe('getOverdueWords', () => {
    it('should return words that are overdue for review', () => {
      const overdueWords = QueueManager.getOverdueWords(testQueue, mockCurrentTime);

      // Should include words with showAfter < mockCurrentTime (excluding passive stage)
      expect(overdueWords).toHaveLength(2);
      expect(overdueWords.map((w) => w.wordId)).toEqual([2, 4]);
    });
  });

  describe('rescheduleWord', () => {
    it('should update showAfter time', () => {
      const newTime = mockCurrentTime + 5000;
      const rescheduled = QueueManager.rescheduleWord(testWord, newTime);

      expect(rescheduled.showAfter).toBe(newTime);
      expect(rescheduled.wordId).toBe(testWord.wordId); // Other properties preserved
    });
  });

  describe('resetWordProgress', () => {
    it('should reset consecutive counters', () => {
      const wordWithProgress = {
        ...testWord,
        consecutiveCorrect: 2,
        consecutiveWrong: 1
      };

      const resetWord = QueueManager.resetWordProgress(wordWithProgress);

      expect(resetWord.consecutiveCorrect).toBe(0);
      expect(resetWord.consecutiveWrong).toBe(0);
      expect(resetWord.wordId).toBe(testWord.wordId); // Other properties preserved
    });
  });

  describe('getWordEfficiencyMetrics', () => {
    it('should calculate correct efficiency metrics', () => {
      const twoDaysAgo = mockCurrentTime - 1000 * 60 * 60 * 24 * 2;
      const wordWithHistory = {
        ...testWord,
        stage: 'review1' as const,
        attempts: 8,
        addedAt: twoDaysAgo
      };

      // Mock Date.now to return our test time
      const originalDateNow = Date.now;
      Date.now = () => mockCurrentTime;

      const metrics = QueueManager.getWordEfficiencyMetrics(wordWithHistory);

      // Restore Date.now
      Date.now = originalDateNow;

      expect(metrics.attemptsPerStage).toBe(8);
      expect(metrics.daysSinceAdded).toBe(2);
      expect(metrics.progressRate).toBe(0.6); // review1 stage
    });
  });

  describe('validateQueueItem', () => {
    it('should validate correct queue item', () => {
      const validation = QueueManager.validateQueueItem(testWord);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid wordId', () => {
      const invalidWord = { ...testWord, wordId: -1 };
      const validation = QueueManager.validateQueueItem(invalidWord);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('wordId must be non-negative');
    });

    it('should detect invalid stage', () => {
      const invalidWord = { ...testWord, stage: 'invalid' as LearningStage };
      const validation = QueueManager.validateQueueItem(invalidWord);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid stage');
    });

    it('should detect invalid consecutive counters', () => {
      const invalidWord = {
        ...testWord,
        consecutiveCorrect: 5, // Max is 3
        consecutiveWrong: -1
      };
      const validation = QueueManager.validateQueueItem(invalidWord);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('consecutiveCorrect out of valid range');
      expect(validation.errors).toContain('consecutiveWrong out of valid range');
    });

    it('should detect invalid timestamps', () => {
      const futureTime = Date.now() + 10000;
      const invalidWord = {
        ...testWord,
        addedAt: futureTime, // Future timestamp
        showAfter: mockCurrentTime - 1000 // Before addedAt
      };
      const validation = QueueManager.validateQueueItem(invalidWord);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('addedAt cannot be in the future');
      expect(validation.errors).toContain('showAfter cannot be before addedAt');
    });
  });

  describe('stage progression integration', () => {
    it('should handle complete learning journey', () => {
      let word = QueueManager.addWordToQueue(1, mockCurrentTime);

      // Start at passive
      expect(word.stage).toBe('passive');

      // 3 correct answers should promote to active
      for (let i = 0; i < 3; i++) {
        const response: CardResponse = {
          wordId: 1,
          known: true,
          responseTime: 2000,
          timestamp: mockCurrentTime + i * 1000
        };
        const result = QueueManager.processCardResponse(word, response);
        word = result.updatedItem;

        if (i === 2) {
          expect(result.wasPromoted).toBe(true);
          expect(word.stage).toBe('active');
        }
      }

      // 3 more correct answers should promote to review1
      for (let i = 0; i < 3; i++) {
        const response: CardResponse = {
          wordId: 1,
          known: true,
          responseTime: 2000,
          timestamp: mockCurrentTime + 10000 + i * 1000
        };
        const result = QueueManager.processCardResponse(word, response);
        word = result.updatedItem;

        if (i === 2) {
          expect(result.wasPromoted).toBe(true);
          expect(word.stage).toBe('review1');
        }
      }

      // Continue through review stages
      const stages = ['review2', 'review3'];
      for (const expectedStage of stages) {
        for (let i = 0; i < 3; i++) {
          const response: CardResponse = {
            wordId: 1,
            known: true,
            responseTime: 2000,
            timestamp: mockCurrentTime + 20000 + i * 1000
          };
          const result = QueueManager.processCardResponse(word, response);
          word = result.updatedItem;

          if (i === 2) {
            expect(result.wasPromoted).toBe(true);
            expect(word.stage).toBe(expectedStage);
          }
        }
      }

      // Final promotion should mark as learned
      for (let i = 0; i < 3; i++) {
        const response: CardResponse = {
          wordId: 1,
          known: true,
          responseTime: 2000,
          timestamp: mockCurrentTime + 30000 + i * 1000
        };
        const result = QueueManager.processCardResponse(word, response);
        word = result.updatedItem;

        if (i === 2) {
          expect(result.wasLearned).toBe(true);
        }
      }
    });

    it('should handle demotion through stages', () => {
      let word: WordLearningItem = {
        wordId: 1,
        stage: 'review2',
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
        showAfter: mockCurrentTime,
        attempts: 0,
        addedAt: mockCurrentTime,
        lastSeen: 0
      };

      // 3 wrong answers should demote to review1
      for (let i = 0; i < 3; i++) {
        const response: CardResponse = {
          wordId: 1,
          known: false,
          responseTime: 5000,
          timestamp: mockCurrentTime + i * 1000
        };
        const result = QueueManager.processCardResponse(word, response);
        word = result.updatedItem;

        if (i === 2) {
          expect(result.wasDemoted).toBe(true);
          expect(word.stage).toBe('review1');
        }
      }
    });
  });
});

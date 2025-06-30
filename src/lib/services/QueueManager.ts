import {
    type CardResponse,
    DEFAULT_SPACING_INTERVALS,
    type LearningStage,
    type QueueStats,
    REQUIRED_CONSECUTIVE_CORRECT,
    REQUIRED_CONSECUTIVE_WRONG,
    STAGE_PROGRESSION,
    STAGE_REGRESSION,
    type WordLearningItem
} from '$lib/types/queue';

/**
 * QueueManager - Core service for managing the unified learning queue
 * Handles word progression, regression, scheduling, and statistics
 */
export class QueueManager {
  /**
   * Add a new word to the learning queue at passive stage
   */
  static addWordToQueue(wordId: number, currentTime: number = Date.now()): WordLearningItem {
    return {
      wordId,
      stage: 'passive',
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      showAfter: currentTime, // Available immediately for passive learning
      attempts: 0,
      addedAt: currentTime,
      lastSeen: 0
    };
  }

  /**
   * Process user response to a word card
   * Updates consecutive counters and handles stage transitions
   */
  static processCardResponse(
    item: WordLearningItem,
    response: CardResponse
  ): {
    updatedItem: WordLearningItem;
    stageChanged: boolean;
    wasPromoted: boolean;
    wasDemoted: boolean;
    wasLearned: boolean;
  } {
    const updatedItem = { ...item };
    updatedItem.attempts++;
    updatedItem.lastSeen = response.timestamp;

    let stageChanged = false;
    let wasPromoted = false;
    let wasDemoted = false;
    let wasLearned = false;

    if (response.known) {
      // Correct response
      updatedItem.consecutiveCorrect++;
      updatedItem.consecutiveWrong = 0;

      // Check for stage progression
      if (updatedItem.consecutiveCorrect >= REQUIRED_CONSECUTIVE_CORRECT) {
        const nextStage = STAGE_PROGRESSION[updatedItem.stage];
        if (nextStage) {
          updatedItem.stage = nextStage;
          updatedItem.consecutiveCorrect = 0;
          updatedItem.showAfter = this.calculateNextShowTime(nextStage, response.timestamp);
          stageChanged = true;
          wasPromoted = true;
        } else {
          // Word is fully learned
          wasLearned = true;
        }
      }
    } else {
      // Incorrect response
      updatedItem.consecutiveWrong++;
      updatedItem.consecutiveCorrect = 0;

      // Check for stage regression
      if (updatedItem.consecutiveWrong >= REQUIRED_CONSECUTIVE_WRONG) {
        const previousStage = STAGE_REGRESSION[updatedItem.stage];
        if (previousStage) {
          updatedItem.stage = previousStage;
          updatedItem.consecutiveWrong = 0;
          updatedItem.showAfter = this.calculateNextShowTime(previousStage, response.timestamp);
          stageChanged = true;
          wasDemoted = true;
        } else {
          // Reset consecutive wrong counter if can't regress further
          updatedItem.consecutiveWrong = 0;
        }
      } else {
        // For incorrect answers, schedule word for later review (short delay)
        updatedItem.showAfter = response.timestamp + (1000 * 60 * 5); // 5 minute delay
      }
    }

    return {
      updatedItem,
      stageChanged,
      wasPromoted,
      wasDemoted,
      wasLearned
    };
  }

  /**
   * Calculate when a word should next be shown based on its stage
   */
  static calculateNextShowTime(stage: LearningStage, baseTime: number = Date.now()): number {
    const interval = DEFAULT_SPACING_INTERVALS[stage];
    return baseTime + interval;
  }

  /**
   * Get words available for study now (showAfter <= currentTime)
   */
  static getAvailableWords(
    queue: WordLearningItem[],
    currentTime: number = Date.now()
  ): WordLearningItem[] {
    return queue.filter(item => item.showAfter <= currentTime);
  }

  /**
   * Get words scheduled for later (showAfter > currentTime)
   */
  static getScheduledWords(
    queue: WordLearningItem[],
    currentTime: number = Date.now()
  ): WordLearningItem[] {
    return queue.filter(item => item.showAfter > currentTime);
  }

  /**
   * Get words by specific stage
   */
  static getWordsByStage(queue: WordLearningItem[], stage: LearningStage): WordLearningItem[] {
    return queue.filter(item => item.stage === stage);
  }

  /**
   * Get next word to study based on priority rules
   * Priority: overdue words first, then by stage order (passive -> active -> review1 -> review2 -> review3)
   */
  static getNextWordToStudy(
    queue: WordLearningItem[],
    currentTime: number = Date.now()
  ): WordLearningItem | null {
    const availableWords = this.getAvailableWords(queue, currentTime);

    if (availableWords.length === 0) {
      return null;
    }

    // Sort by priority: overdue first, then by stage order, then by showAfter time
    const stageOrder: Record<LearningStage, number> = {
      passive: 1,
      active: 2,
      review1: 3,
      review2: 4,
      review3: 5
    };

    availableWords.sort((a, b) => {
      // First, prioritize overdue words (words that should have been shown earlier)
      const aOverdue = Math.max(0, currentTime - a.showAfter);
      const bOverdue = Math.max(0, currentTime - b.showAfter);

      if (aOverdue !== bOverdue) {
        return bOverdue - aOverdue; // More overdue first
      }

      // Then by stage order
      const stageComparison = stageOrder[a.stage] - stageOrder[b.stage];
      if (stageComparison !== 0) {
        return stageComparison;
      }

      // Finally by show time (earlier first)
      return a.showAfter - b.showAfter;
    });

    return availableWords[0];
  }

  /**
   * Generate comprehensive queue statistics
   */
  static generateQueueStats(
    queue: WordLearningItem[],
    learnedWords: number[],
    currentTime: number = Date.now()
  ): QueueStats {
    const stats: QueueStats = {
      passive: { available: 0, scheduled: 0, total: 0 },
      active: { available: 0, scheduled: 0, total: 0 },
      review1: { available: 0, scheduled: 0, total: 0 },
      review2: { available: 0, scheduled: 0, total: 0 },
      review3: { available: 0, scheduled: 0, total: 0 },
      learned: learnedWords.length
    };

    const stages: LearningStage[] = ['passive', 'active', 'review1', 'review2', 'review3'];

    stages.forEach(stage => {
      const stageWords = this.getWordsByStage(queue, stage);
      const available = stageWords.filter(item => item.showAfter <= currentTime);
      const scheduled = stageWords.filter(item => item.showAfter > currentTime);

      stats[stage] = {
        available: available.length,
        scheduled: scheduled.length,
        total: stageWords.length
      };
    });

    return stats;
  }

  /**
   * Remove a word from the queue (when it becomes fully learned)
   */
  static removeWordFromQueue(queue: WordLearningItem[], wordId: number): WordLearningItem[] {
    return queue.filter(item => item.wordId !== wordId);
  }

  /**
   * Get words due for review (overdue words)
   */
  static getOverdueWords(
    queue: WordLearningItem[],
    currentTime: number = Date.now()
  ): WordLearningItem[] {
    return queue.filter(item => item.showAfter < currentTime && item.stage !== 'passive');
  }

  /**
   * Update word's showAfter time (for manual scheduling adjustments)
   */
  static rescheduleWord(
    item: WordLearningItem,
    newShowAfter: number
  ): WordLearningItem {
    return {
      ...item,
      showAfter: newShowAfter
    };
  }

  /**
   * Reset word's consecutive counters (useful for debugging or manual resets)
   */
  static resetWordProgress(item: WordLearningItem): WordLearningItem {
    return {
      ...item,
      consecutiveCorrect: 0,
      consecutiveWrong: 0
    };
  }

  /**
   * Get learning efficiency metrics for analytics
   */
  static getWordEfficiencyMetrics(item: WordLearningItem): {
    attemptsPerStage: number;
    daysSinceAdded: number;
    progressRate: number; // 0-1 scale based on stage
  } {
    const now = Date.now();
    const daysSinceAdded = (now - item.addedAt) / (1000 * 60 * 60 * 24);

    const stageProgress: Record<LearningStage, number> = {
      passive: 0.2,
      active: 0.4,
      review1: 0.6,
      review2: 0.8,
      review3: 1.0
    };

    return {
      attemptsPerStage: item.attempts,
      daysSinceAdded,
      progressRate: stageProgress[item.stage]
    };
  }

  /**
   * Validate queue item integrity
   */
  static validateQueueItem(item: WordLearningItem): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (item.wordId < 0) {
      errors.push('wordId must be non-negative');
    }

    if (!['passive', 'active', 'review1', 'review2', 'review3'].includes(item.stage)) {
      errors.push('Invalid stage');
    }

    if (item.consecutiveCorrect < 0 || item.consecutiveCorrect > REQUIRED_CONSECUTIVE_CORRECT) {
      errors.push('consecutiveCorrect out of valid range');
    }

    if (item.consecutiveWrong < 0 || item.consecutiveWrong > REQUIRED_CONSECUTIVE_WRONG) {
      errors.push('consecutiveWrong out of valid range');
    }

    if (item.attempts < 0) {
      errors.push('attempts must be non-negative');
    }

    if (item.addedAt > Date.now()) {
      errors.push('addedAt cannot be in the future');
    }

    if (item.showAfter < item.addedAt) {
      errors.push('showAfter cannot be before addedAt');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

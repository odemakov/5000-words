# Unified Queue System Documentation

This document describes the new unified queue system that replaces the previous forward/backward/review queue architecture with a simpler, more maintainable approach.

## Overview

The new system uses a single queue with clear learning stages:
- **Passive**: Learning language → Native language (French → Russian)
- **Active**: Native language → Learning language (Russian → French)  
- **Review1**: Short-term spaced repetition (1 day)
- **Review2**: Medium-term spaced repetition (3 days)
- **Review3**: Long-term spaced repetition (7 days)

## Key Features

- **3 consecutive correct answers** required to advance each stage
- **3 consecutive wrong answers** demotes to previous stage
- **Single data structure** for all learning stages
- **Intelligent scheduling** with spaced repetition
- **Clear progression path**: passive → active → review1 → review2 → review3 → learned

## Core Services

### QueueManager
Static utility class for queue operations:
```typescript
import { QueueManager } from '$lib/services/QueueManager';

// Add new word to queue
const newItem = QueueManager.addWordToQueue(42);

// Process user response
const response = { wordId: 42, known: true, responseTime: 2000, timestamp: Date.now() };
const result = QueueManager.processCardResponse(item, response);

// Get next word to study
const nextWord = QueueManager.getNextWordToStudy(queue);

// Generate statistics
const stats = QueueManager.generateQueueStats(queue, learnedWords);
```

### UnifiedLearningService
Main service for learning state management:
```typescript
import { UnifiedLearningService } from '$lib/services/UnifiedLearningService';

// Initialize the system
await UnifiedLearningService.initialize();

// Add word to learning queue
UnifiedLearningService.addWordToQueue(42);

// Process card response
const response = { wordId: 42, known: true, responseTime: 2000, timestamp: Date.now() };
UnifiedLearningService.processCardResponse(response);

// Get queue statistics
const stats = UnifiedLearningService.getQueueStats();

// Switch modes
UnifiedLearningService.switchMode('reviewing');
```

## Svelte Stores

### unifiedLearningState
Main reactive store containing all learning data:
```typescript
import { unifiedLearningState } from '$lib/services/UnifiedLearningService';

// Subscribe to state changes
unifiedLearningState.subscribe(state => {
  console.log('Queue length:', state.learningQueue.length);
  console.log('Words learned:', state.learnedWords.length);
});
```

### currentCard
Derived store for the current card to display:
```typescript
import { currentCard } from '$lib/services/UnifiedLearningService';

// Use in Svelte component
$: if ($currentCard) {
  console.log('Current word:', $currentCard.word);
  console.log('Direction:', $currentCard.direction);
  console.log('Stage:', $currentCard.stage);
}
```

### queueStats
Derived store for queue statistics:
```typescript
import { queueStats } from '$lib/services/UnifiedLearningService';

// Display statistics
$: console.log('Available words:', $queueStats.passive.available + $queueStats.active.available);
```

## Components

### QueueStatsDisplay
Reusable component for showing queue statistics:
```svelte
<script>
  import QueueStatsDisplay from '$lib/components/QueueStatsDisplay.svelte';
  import { queueStats } from '$lib/services/UnifiedLearningService';
</script>

<!-- Full display -->
<QueueStatsDisplay stats={$queueStats} />

<!-- Compact display -->
<QueueStatsDisplay stats={$queueStats} compact={true} />

<!-- Without labels -->
<QueueStatsDisplay stats={$queueStats} showLabels={false} />
```

## Data Types

### WordLearningItem
Core data structure for words in the queue:
```typescript
interface WordLearningItem {
  wordId: number;                    // Reference to word index
  stage: LearningStage;              // Current learning stage
  consecutiveCorrect: number;        // Consecutive "I know" responses (0-2)
  consecutiveWrong: number;          // Consecutive "I don't know" responses (0-2)
  showAfter: number;                 // Timestamp when available for review
  attempts: number;                  // Total attempts made
  addedAt: number;                   // When first added to queue
  lastSeen: number;                  // Last time shown to user
}
```

### QueueStats
Statistics for UI display:
```typescript
interface QueueStats {
  passive: { available: number; scheduled: number; total: number };
  active: { available: number; scheduled: number; total: number };
  review1: { available: number; scheduled: number; total: number };
  review2: { available: number; scheduled: number; total: number };
  review3: { available: number; scheduled: number; total: number };
  learned: number;
}
```

## Usage Examples

### Basic Learning Flow
```typescript
// 1. Initialize system
await UnifiedLearningService.initialize();

// 2. Add words to queue
[1, 2, 3, 4, 5].forEach(wordId => {
  UnifiedLearningService.addWordToQueue(wordId);
});

// 3. Study loop
const studySession = async () => {
  const nextWord = UnifiedLearningService.getNextWord();
  if (!nextWord) {
    console.log('No words available for study');
    return;
  }

  // Show card to user and get response
  const userKnowsWord = await showCardToUser(nextWord);
  
  // Process response
  const response = {
    wordId: nextWord.wordId,
    known: userKnowsWord,
    responseTime: 2000,
    timestamp: Date.now()
  };
  
  UnifiedLearningService.processCardResponse(response);
};
```

### Svelte Component Integration
```svelte
<script lang="ts">
  import { currentCard, queueStats } from '$lib/services/UnifiedLearningService';
  import { UnifiedLearningService } from '$lib/services/UnifiedLearningService';
  import QueueStatsDisplay from '$lib/components/QueueStatsDisplay.svelte';

  function handleResponse(known: boolean) {
    if (!$currentCard) return;
    
    const response = {
      wordId: $currentCard.wordId,
      known,
      responseTime: Date.now() - sessionStart,
      timestamp: Date.now()
    };
    
    UnifiedLearningService.processCardResponse(response);
  }

  let sessionStart = Date.now();
</script>

<main>
  <QueueStatsDisplay stats={$queueStats} compact />
  
  {#if $currentCard}
    <div class="flashcard">
      <h2>{$currentCard.word}</h2>
      <p>Stage: {$currentCard.stage}</p>
      <p>Direction: {$currentCard.direction}</p>
      
      <div class="actions">
        <button on:click={() => handleResponse(false)}>Don't Know</button>
        <button on:click={() => handleResponse(true)}>Know</button>
      </div>
    </div>
  {:else}
    <p>No cards available for study</p>
  {/if}
</main>
```

## Migration from Old System

The new system is designed to coexist with the old system during transition:

1. **Data Migration**: Old queue data can be converted to new format
2. **Gradual Adoption**: Components can be migrated one by one
3. **Fallback Support**: Old endpoints remain functional during transition

### Converting Old Data
```typescript
// Example migration function
function migrateOldQueueData(oldState: LearningState): UnifiedLearningState {
  const learningQueue: WordLearningItem[] = [];
  
  // Convert forward queue (passive stage)
  oldState.forwardQueue.forEach(item => {
    learningQueue.push({
      wordId: item.wordIndex,
      stage: 'passive',
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      showAfter: Date.now(),
      attempts: item.attempts,
      addedAt: item.addedAt,
      lastSeen: 0
    });
  });
  
  // Convert backward queue (active stage)
  oldState.backwardQueue.forEach(item => {
    learningQueue.push({
      wordId: item.wordIndex,
      stage: 'active',
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      showAfter: Date.now(),
      attempts: item.attempts,
      addedAt: item.addedAt,
      lastSeen: 0
    });
  });
  
  // Convert review queues
  oldState.reviewQueue.forEach(item => {
    const stage = item.pool === 'POOL1' ? 'review1' : 
                  item.pool === 'POOL2' ? 'review2' : 'review3';
    
    learningQueue.push({
      wordId: item.wordIndex,
      stage,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      showAfter: Date.now(),
      attempts: item.attempts,
      addedAt: item.addedAt,
      lastSeen: 0
    });
  });
  
  return {
    // ... other properties
    learningQueue,
    learnedWords: oldState.learnedList
  };
}
```

## Testing

The system includes comprehensive tests covering:
- Queue item creation and manipulation
- Stage progression and regression
- Response processing
- Statistics generation
- Edge cases and error handling

Run tests with:
```bash
npm test -- src/lib/services/__tests__/QueueManager.test.ts
```

## Benefits of New System

1. **Simplicity**: Single data structure instead of multiple queues
2. **Clarity**: Clear stage names (passive/active vs forward/backward)
3. **Consistency**: Same logic applies to all stages
4. **Maintainability**: Easier to debug and extend
5. **Requirements Fit**: Native support for 3-consecutive logic
6. **Performance**: More efficient filtering and sorting
7. **Testing**: Easier to test with predictable behavior

## Future Enhancements

- **Custom Intervals**: User-configurable spacing intervals
- **Priority Weights**: Different priorities for different word types
- **Batch Operations**: Bulk queue operations for efficiency
- **Analytics**: Detailed learning analytics and insights
- **Sync Support**: Cloud synchronization capabilities
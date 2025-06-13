# Main Learning Interface

## Purpose

Primary learning screen with spaced repetition system using multiple queues. Users can switch between learning new words and reviewing previously learned words at their own pace.

## Learning Flow

### Initial Queue Filling
- User is shown words starting from their detected level
- Two options for each word:
  - Swipe right: "I know this word" → move to recap7
  - Swipe left: "I don't know this word" → move to currentQueue
- Continue until currentQueue reaches 30 words

### Learning Modes

**Three main modes available:**
- **Forward (French → Russian)** - Learn new words
- **Reverse (Russian → French)** - Reverse learning (mandatory)
- **Reviews** - Work on recap queues

### Queue System

**currentQueue (30 words max):**
- Intensive learning phase
- Swipe right: "I know this word" → move to recap7
- Swipe left: "I don't know this word" → shuffle back to positions 10-30
- Auto-refills to 30 words when user continues learning

**Queue Refill Logic:**
- **80%**: Next words in frequency order
- **20%**: Ready recap words (past their review date)
- When user reaches word 5000: 100% recap words only
- If no recap words available: force user to reviews mode

**Recap Queues (spaced repetition):**
- **recap7** - Review after 7 days
- **recap14** - Review after 14 days
- **recap30** - Review after 30 days
- Swipe right: Move to next stage (recap7→recap14→recap30→fully learned)
- Swipe left: Demote back to currentQueue

### Reverse Learning (Mandatory)
- Words that graduate from currentQueue to recap7 automatically enter currentQueueReverse
- Same queue system applies: currentQueueReverse → recap7Reverse → recap14Reverse → recap30Reverse
- User must learn reverse direction for complete mastery

### Mode Switching
- User can switch between modes anytime
- **Forward/Reverse**: Available if respective currentQueue has words
- **Reviews**: Available if sum of words in recap queues is 10+
- No forced sessions - user controls their own learning pace
- Exception: Force reviews mode when no new words available

### Progress Tracking
- **Forward Progress**: Highest word index in currentQueue
- **Reverse Progress**: Highest word index in currentQueueReverse
- **New Words Learned**: currentQueue → recap7 progressions
- **Words Reviewed**: All successful recap queue progressions
- Display: "New: 156 words | Reviewed: 342 words"
- Separate progress tracking for each direction

## Key Features

- Flexible, user-controlled learning pace
- Spaced repetition with backward movement for forgotten words
- Mandatory bidirectional learning
- No time limits or daily restrictions
- Continuous progress tracking across all learning activities
- State management for seamless transitions between modes and queues
- Automatic state persistence after every user action

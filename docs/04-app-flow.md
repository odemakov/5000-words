# Application Flow

## Core Data Structures

```javascript
{
  // User level data
  detectedLevel: "A1", // "A1", "A2", "B1", or "B2"
  levelTestResults: [
    { wordId: 24, known: true },
    { wordId: 156, known: false },
    // etc.
  ],

  // Learning progress tracking
  progress: 156, // Highest word index in queue system
  wordsLearned: 156, // Count in learnedList + recap30
  wordsReviewed: 342, // Successful recap queue progressions

  // Queue management
  forwardQueue: [/* word objects */], // Primary learning queue (FR→RU)
  backwardQueue: [/* word objects */], // Backward learning queue (RU→FR)

  // Spaced repetition queues
  recap7: [/* {wordObj, dueDate} */],  // 7-day review queue
  recap14: [/* {wordObj, dueDate} */], // 14-day review queue
  recap30: [/* {wordObj, dueDate} */], // 30-day review queue

  // Learned words tracking
  learnedList: [/* word IDs */], // Fully learned words

  // Current app state
  currentMode: "learning", // "learning" or "reviews"
  currentDirection: "forward", // "forward" or "backward"

  // Last activity timestamp
  lastActivity: 1623456789000 // Used for calculating due dates
}

# Startup Flow

1. **Application Launch**:
   - Check localStorage for existing user data
   - If data exists → Resume learning (load state)
   - If no data → Begin level detection

2. **Level Detection**:
   - Present 10 random words from each 100-word batch
   - Continue until batch score < 70%
   - Set detected level (A1: 1-800, A2: 801-2000, B1: 2001-4000, B2: 4001-5000)
   - Initialize empty queues
   - Transition to initial queue filling

3. **Initial Queue Filling**:
   - Present words sequentially starting from detected level
   - User swipes right ("know") → Add to learnedList
   - User swipes left ("don't know") → Add to forwardQueue
   - Continue until forwardQueue has at least 10 words
   - Transition to main learning flow

## Main Learning Flow

1. **Queue Selection Logic**:
   - If reviews are due (recap words past due date) and ≥ 10 review words available → Force reviews mode
   - Otherwise, use user's selected mode:
     - Learning mode: Check forwardQueue, then backwardQueue
     - Reviews mode: Check recap7, recap14, then recap30 for due words

2. **Direction Management**:
   - In forwardQueue → Show French word, reveal Russian translation (currentDirection = "forward")
   - In backwardQueue → Show Russian word, reveal French translation (currentDirection = "backward")
   - In recap queues → Show direction based on due review card's direction flag

3. **Card Processing**:
   - User taps card to reveal translation
   - User swipes right ("know") or left ("don't know")
   - Process based on current queue:
     - **forwardQueue + right swipe** → Move to backwardQueue
     - **forwardQueue + left swipe** → Reinsert randomly into positions 10-30 of forwardQueue
     - **backwardQueue + right swipe** → Move to recap7 with 7-day due date
     - **backwardQueue + left swipe** → Reinsert randomly into positions 10-30 of backwardQueue
     - **recap7 + right swipe** → Move to recap14 with 14-day due date
     - **recap7 + left swipe** → Move to forwardQueue (if forward direction) or backwardQueue (if backward direction)
     - **recap14 + right swipe** → Move to recap30 with 30-day due date
     - **recap14 + left swipe** → Move to recap7 with new 7-day due date
     - **recap30 + right swipe** → Move to learnedList (fully learned)
     - **recap30 + left swipe** → Move to recap14 with new 14-day due date

4. **Queue Refill Logic**:
   - Maintain 30 cards in forwardQueue and backwardQueue
   - When card is removed from forwardQueue, add replacement:
     - 80% chance: Next word in frequency order (not in any queue/learnedList)
     - 20% chance: Word from recap queues that's past due date (prioritize oldest)
   - When all 5000 words are in system: 100% recap words for refill
   - If no new words and no recap words: Display "Congratulations" message

## Mode Switching

1. **Learning Mode**:
   - User works through forwardQueue and backwardQueue
   - System automatically selects appropriate queue and direction
   - Available if either queue has words
   - Displays card count for each direction in UI

2. **Reviews Mode**:
   - User works through due words from recap7, recap14, recap30
   - System selects oldest due word first
   - Available if sum of due words ≥ 10
   - Displays total due cards count in UI
   - Forced when no new words available for learning

## Edge Cases & Special Handling

1. **Empty Queue Handling**:
   - If forwardQueue empty → Check backwardQueue
   - If backwardQueue empty → Check recap queues for due words
   - If all queues empty → Display "Congratulations" message

2. **Due Date Calculation**:
   - Due dates calculated from time of right swipe
   - Word considered "due" when current time > due date
   - App recalculates due words on startup and after each action

3. **Extended Absence Handling**:
   - If user returns after >14 days absence:
     - Offer "quick review" of random sample from recap queues
     - Option to reset recap due dates to avoid overwhelming queue

4. **Progress Calculation**:
   - Progress = Highest word index across all queues
   - Level progress shown as: "A1: 342/800" (or appropriate level)

5. **Vocabulary Completion**:
   - When progress reaches 5000:
     - Display special congratulations
     - Continue with recap-only mode indefinitely

6. **State Persistence**:
   - Save state to localStorage after every user action
   - Implement throttling if needed for performance
   - Include version number in stored data for future compatibility

7. **Queue Size Management**:
   - Forward/backward queues: 30 cards max
   - Recap queues: Unlimited size
   - If recap queues grow very large, implement pagination in reviews mode

8. **Word Direction Tracking**:
   - Each word in recap queues includes direction flag
   - Enables correct presentation during reviews
   - Ensures user must learn both directions for complete mastery

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
   - Continue until user switch to learning mode
   - Transition to main learning flow

## Main Learning Flow

1. **Queue Selection Logic**:
   - User's selected mode:
     - Receptive Learning mode: use forwardQueue
     - Productive Learning mode: then backwardQueue
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
     - **forwardQueue + left swipe** → Reinsert randomly into second half of the queue
     - **backwardQueue + right swipe** → Move to recap7 with 7-day due date
     - **backwardQueue + left swipe** → Reinsert randomly into second half of the queue
     - **recap7 + right swipe** → Move to recap14 with 14-day due date
     - **recap7 + left swipe** → Move to forwardQueue (if forward direction) or backwardQueue (if backward direction)
     - **recap14 + right swipe** → Move to recap30 with 30-day due date
     - **recap14 + left swipe** → Move to recap7 with new 7-day due date
     - **recap30 + right swipe** → Move to learnedList (fully learned)
     - **recap30 + left swipe** → Move to recap14 with new 14-day due date

4. **Queue Refill Logic**:
   - User controls cards in forwardQueue
   - backwardQueue is filling from forward queue
   - If no new words and no recap words: Display "Congratulations" message

## Mode Switching

1. **Recepitive Learning Mode**:
   - User works through forwardQueue
   - Available if queue has words
   - Displays card count in UI

2. **Productve  Learning Mode**:
   - User works through backwardQueue
   - Available if queue has words
   - Displays card count in UI

3. **Reviews Mode**:
   - User works through due words from recap7, recap14, recap30
   - System selects oldest due word first
   - Available if queues have ready to repeat words
   - Displays total cards ready to repeat count/total cards in UI

## Edge Cases & Special Handling

1. **Due Date Calculation**:
   - Due dates calculated from time of right swipe
   - Word considered "due" when current time > due date
   - App recalculates due words on startup and after each action

2. **Extended Absence Handling**:
   - If user returns after >7 days absence:
     - Offer "quick review" of random sample from recap queues
     - Option to reset recap due dates to avoid overwhelming queue

3. **Progress Calculation**:
   - Progress = Highest word index across all queues
   - Level progress shown as: "A1: 342/800" (or appropriate level)

4. **Vocabulary Completion**:
   - When progress reaches 5000:
   - Display special congratulations

5. **State Persistence**:
   - Save state to localStorage after every user action
   - Implement throttling if needed for performance
   - Include version number in stored data for future compatibility

6. **Queue Size Management**:
   - Forward/backward queues: Unlimited size
   - Recap queues: Unlimited size

7. **Word Direction Tracking**:
   - Each word in recap queues includes direction flag
   - Enables correct presentation during reviews
   - Ensures user must learn both directions for complete mastery

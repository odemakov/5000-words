# Main Learning Interface

## Purpose

Primary learning screen with spaced repetition system using multiple queues. Users can control their learning experience by populating their own forwardQueue, then progressing through the full learning pipeline: forwardQueue → backwardQueue → spaced repetition reviews.

## Learning Flow

### Initial Queue Filling
- **Entry Point**: After completing the level test, users are directed to `/queue-filling?level=X`
- **Word Presentation**: Words are shown starting from the detected level's index (A1: 0, A2: 800, B1: 2000, B2: 4000)
- **User Actions per Word**:
  - Swipe left: "I don't know this word" → add to forwardQueue
  - Swipe right: "I know this word" → add to learned list
  - Skip: Move to next word without adding anywhere
- **Progress Tracking**: Live counter shows forwardQueue size and learned count
- **Minimum Threshold**: After forwardQueue reaches 10 cards, "Start Learning" button appears
- **User Control**: Can continue adding more words or begin learning at any time
- **Re-entry**: Users can return to queue filling anytime via "Add Words" mode in main interface

### Learning Modes

**Three main modes available:**
- **Learning** - Work on forwardQueue and backwardQueue
- **Reviews** - Work on spaced repetition queues (recap7, recap14, recap30)
- **Add Words** - Return to queue filling interface to expand forwardQueue

### Queue System

**forwardQueue (10 words min):**
- Intensive learning phase for French → Russian direction
- **Known Response**: Move word to backwardQueue for reverse learning
- **Unknown Response**: 
  - If queue has < 4 cards: Place at end of queue
  - If queue has ≥ 4 cards: Shuffle to random position in second half
- **No Auto-Fill**: Queue will not automatically add new words when it gets low
- **Manual Expansion**: User must switch to "Add Words" mode to expand queue

**backwardQueue (user-defined length, default 30):**
- Reverse learning phase for Russian → French direction
- **Known Response**: Graduate word to recap7 (7-day review cycle)
- **Unknown Response**: 
  - If queue has < 4 cards: Place at end of queue
  - If queue has ≥ 4 cards: Shuffle to random position in second half
- **Size Control**: Users can adjust backwardQueue length in settings (10-100 words)

**Queue Management:**
- **No Automatic Refill**: Queues do not automatically add words
- **User-Controlled**: Users must actively choose to add words via "Add Words" mode
- **Queue Minimum**: Learning mode requires at least 10 words in forwardQueue
- **Shuffle Logic**: Unknown words shuffle to random position in second half of queue

**Recap Queues (spaced repetition):**
- **recap7** - Review after 7 days
- **recap14** - Review after 14 days
- **recap30** - Review after 30 days
- Swipe right: Move to next stage (recap7→recap14→recap30→learnedList)
- Swipe left: Demote back to forwardQueue

### Mode Switching
- **Complete User Control**: Switch between modes anytime without restrictions
- **Learning Mode**: Available when forwardQueue OR backwardQueue has words
  - **Direction Switching**: Click on forward/backward queue buttons to switch learning direction
  - **Automatic Fallback**: If current direction queue is empty, shows cards from other direction
- **Reviews Mode**: Available when recap queues have 10+ due words
- **Add Words Mode**: Always available to expand forwardQueue
- **Visual Indicators**: Mode selector shows current queue sizes and due review counts
- **Smart Defaults**: System suggests optimal mode but never forces transitions

### Progress Tracking
- **Forward Progress**: Highest word index in forwardQueue
- **Reverse Progress**: Highest word index in backwardQueue
- **New Words Learned**: Count of learnedList + count of recap30
- **Words Reviewed**: All successful recap queue progressions
- Display: "New: 156 words | Reviewed: 342 words"
- **Live Queue Counts**: UI continuously displays word counts for all queues
- **Queue Stats Component**: Shows forwardQueue, backwardQueue, and all recap queue sizes
- **Progress Indicators**: Visual progress bars and counters throughout the interface
- **Settings Integration**: Backward queue length is user-configurable via settings panel

## Key Features

- **User-Controlled Queue Building**: Complete control over which words enter the learning pipeline
- **Flexible Learning Modes**: Seamless switching between Learning, Reviews, and Add Words modes
- **Configurable Queue Sizes**: User-defined backward queue length (10-100 words)
- **Comprehensive Progress Tracking**: Live counters for all queues and learning statistics
- **Intelligent Word Progression**: forwardQueue → backwardQueue → recap7 → recap14 → recap30 → learned
- **No Forced Progression**: Users control their own pace and can expand queues anytime
- **Persistent State Management**: All actions automatically saved with seamless resume capability
- **Visual Feedback**: Progress bars, queue counters, and mode indicators throughout the interface

## Technical Implementation

- **New Components**: QueueFilling.svelte for initial word population
- **Enhanced ModeSelector**: Added "Add Words" mode with queue count indicators
- **Enhanced QueueStats**: Direction switching buttons for forward/backward learning
- **Extended LearningController**: 
  - Queue filling and word management methods
  - `switchDirection()` method for changing learning direction
  - Smart card placement logic based on queue size
- **Route Integration**: /queue-filling page for initial setup and re-entry
- **Settings Integration**: Backward queue length configuration in settings panel

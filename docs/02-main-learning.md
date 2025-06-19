# Main Learning Interface

## Purpose

Primary learning screen implementing receptive and productive language learning with user-controlled queue management and spaced repetition. Users build their own vocabulary pipeline through manual word selection, then progress through: receptive learning → productive learning → spaced repetition mastery.

## Learning Flow

### Initial Queue Building (Add Words Mode)
- **Entry Point**: After level detection, users access add words interface
- **Word Presentation**: Sequential presentation starting from detected level index
  - A1: words 0-799, A2: words 800-1999, B1: words 2000-3999, B2: words 4000-4999
- **User Decision per Word**:
  - **Swipe left**: "I don't know" → Add to forwardQueue for receptive learning
  - **Swipe right**: "I already know" → Add directly to learnedList
- **Continuous Access**: Users can return to Add Words mode anytime to expand vocabulary. User controls forwardQueue size by himself.

### Primary Learning Modes

#### Receptive Learning (French → Russian)
- **Purpose**: Comprehension and recognition of French vocabulary
- **Queue**: forwardQueue, user-populated
- **Card Format**: French word → Russian translation(s)
- **Learning Actions**:
  - **Known (swipe right)**: Move to backwardQueue for productive learning
  - **Learning (swipe left)**: Reinsert into second half of current queue
- **No Auto-Population**: Queue expansion requires manual action via Add Words mode

#### Productive Learning (Russian → French)
- **Purpose**: Active recall and production of French vocabulary
- **Queue**: backwardQueue
- **Card Format**: Russian word(s) → French production
- **Learning Actions**:
  - **Known (swipe right)**: Graduate to recap7 spaced repetition cycle
  - **Learning (swipe left)**: Reinsert into second half of current queue
- **Queue Source**: Words marked as "known" during receptive learning

### Spaced Repetition Reviews
- **reviewQueue**: Pool-based review system with configurable intervals
  - **POOL1**: Short-term review (default 7 days)
  - **POOL2**: Medium-term review (default 14 days)
  - **POOL3**: Long-term review (default 30 days)
- **Review Actions**:
  - **Known (swipe right)**: Advance to next spaced interval or mark as fully learned
  - **Learning (swipe left)**: Demote back to appropriate learning queue
- **Smart Scheduling**: Reviews appear based on due dates, prioritizing overdue words

### Mode Control System

#### Three-Mode Architecture
1. **Learning Mode**
   - **Receptive Focus**: Work primarily on forwardQueue (French → Russian)
   - **Productive Focus**: Work primarily on backwardQueue (Russian → French)

2. **Reviews Mode**
   - **Unified Review Interface**: Handle all spaced repetition queues
   - **Priority Scheduling**: Oldest overdue words first, regardless of interval

3. **Add Words Mode**
   - **Vocabulary Expansion**: Access queue filling interface to grow forwardQueue
   - **Unlimited Access**: Available anytime without restrictions
   - **Progress Continuation**: Resume from last position or explore new ranges

### Smart Queue Management

#### Queue Behavior Logic
- **Small Queue Shuffling** (< 4 cards): Unknown words placed at end
- **Large Queue Shuffling** (≥ 4 cards): Unknown words randomly placed in second half
- **No Automatic Refill**: All queues require manual population by user
- **User-Controlled Growth**: Vocabulary expansion only through deliberate Add Words sessions

#### Configurable Settings
- **Progress Tracking**: Separate counters for receptive vs productive learning

### Progress Tracking & Statistics

#### Learning Metrics
- **Receptive Progress**: Highest word index successfully processed in forwardQueue
- **Productive Progress**: Highest word index successfully processed in backwardQueue
- **New Words Learned**: Total count progressing from forwardQueue → backwardQueue → recap7
- **Words Reviewed**: Successful progressions through spaced repetition cycles
- **Queue Statistics**: Live counters for all active queues and due reviews

#### Visual Indicators
- **Queue Status Display**: Real-time word counts for forwardQueue, backwardQueue, and all recap queues
- **Due Review Counters**: Number of words ready for review in each spaced repetition interval
- **Session Statistics**: New words added, reviews completed, time spent learning

## Key Features

### User Autonomy & Control
- **Self-Directed Learning**: Complete control over vocabulary selection and pacing
- **Flexible Mode Switching**: Change between Learning, Reviews, and Add Words without restrictions
- **Manual Queue Building**: No forced vocabulary additions or automatic progressions
- **Configurable Experience**: Adjust queue sizes and learning preferences in settings

### Comprehensive Learning Pipeline
- **Receptive → Productive → Spaced Repetition**: Complete mastery pathway for each word
- **Bidirectional Learning**: Separate progress tracking for comprehension vs production skills
- **Intelligent Scheduling**: Spaced repetition based on proven memory retention intervals
- **Persistent State**: Seamless resume capability with automatic progress saving

### Advanced Queue Management
- **Smart Word Placement**: Unknown words strategically reinserted for optimal review timing
- **Queue Size Optimization**: User-configurable backward queue size for personalized learning
- **No Auto-Population**: Prevents overwhelming users with unwanted vocabulary additions
- **Manual Expansion**: Users actively choose when and which words to add to their learning pipeline

## Technical Implementation Notes

- **Enhanced LearningController**: Extended with queue filling, direction switching, and smart placement methods
- **New Component Architecture**: QueueFilling.svelte for Add Words mode, enhanced ModeSelector for three-way switching
- **Persistent State Management**: All user actions automatically saved with granular progress tracking
- **Configurable Settings**: Backward queue length and learning preferences stored in user settings
- **Smart Card Delivery**: Context-aware card presentation based on current mode and available content

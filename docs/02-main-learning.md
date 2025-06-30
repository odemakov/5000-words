# Main Learning Interface

## Purpose

Primary learning screen implementing passive and active language learning with unified queue management and spaced repetition. Users build their own vocabulary pipeline through manual word selection, then progress through: passive learning → active learning → spaced repetition mastery using a 3-consecutive success system.

## Learning Flow

### Initial Queue Building (Add Words Mode)
- **Entry Point**: After level detection, users access add words interface
- **Word Presentation**: Sequential presentation starting from detected level index
  - A1: words 0-799, A2: words 800-1999, B1: words 2000-3999, B2: words 4000-4999
- **User Decision per Word**:
  - **Swipe left**: "I don't know" → Add to learningQueue at passive stage
  - **Swipe right**: "I already know" → Add directly to learnedWords
- **Continuous Access**: Users can return to Add Words mode anytime to expand vocabulary. User controls learning queue size themselves.

### Primary Learning Modes

#### Passive Learning (French → Russian)
- **Purpose**: Comprehension and recognition of French vocabulary
- **Queue**: learningQueue (passive stage), user-populated
- **Card Format**: French word → Russian translation(s)
- **Learning Actions**:
  - **Known (swipe right)**: Increment consecutiveCorrect counter (3 required to advance to active stage)
  - **Learning (swipe left)**: Increment consecutiveWrong counter, reset consecutiveCorrect
- **Stage Progression**: 3 consecutive correct answers advance to active stage

#### Active Learning (Russian → French)
- **Purpose**: Active recall and production of French vocabulary
- **Queue**: learningQueue (active stage)
- **Card Format**: Russian word(s) → French production
- **Learning Actions**:
  - **Known (swipe right)**: Increment consecutiveCorrect counter (3 required to advance to review1 stage)
  - **Learning (swipe left)**: Increment consecutiveWrong counter (3 consecutive wrong demotes to passive stage)
- **Stage Progression**: Words advance from passive stage after 3 consecutive successes

### Spaced Repetition Reviews
- **learningQueue**: Stage-based review system with configurable intervals
  - **review1**: Short-term review (default 1 day)
  - **review2**: Medium-term review (default 3 days)
  - **review3**: Long-term review (default 7 days)
- **Review Actions**:
  - **Known (swipe right)**: Increment consecutiveCorrect counter (3 required to advance to next stage)
  - **Learning (swipe left)**: Increment consecutiveWrong counter (3 consecutive wrong demotes to previous stage)
- **Smart Scheduling**: Reviews appear based on showAfter timestamps, prioritizing overdue words
- **Final Mastery**: 3 consecutive successes in review3 stage marks word as fully learned

### Mode Control System

#### Three-Mode Architecture
1. **Learning Mode**
   - **Unified Interface**: Handle both passive and active stages from single learningQueue
   - **Stage-Based Display**: Cards show appropriate direction based on current stage

2. **Reviews Mode**
   - **Unified Review Interface**: Handle all review stages (review1, review2, review3)
   - **Priority Scheduling**: Overdue words first, then by stage order

3. **Add Words Mode**
   - **Vocabulary Expansion**: Access queue filling interface to grow learningQueue
   - **Unlimited Access**: Available anytime without restrictions
   - **Progress Continuation**: Resume from last position or explore new ranges

### Smart Queue Management

#### Queue Behavior Logic
- **Consecutive Tracking**: Each word tracks consecutive correct/wrong responses
- **Stage Progression**: 3 consecutive correct responses advance to next stage
- **Stage Regression**: 3 consecutive wrong responses demote to previous stage (except passive stage)
- **Intelligent Scheduling**: Words scheduled based on stage intervals, with overdue prioritization
- **User-Controlled Growth**: Vocabulary expansion only through deliberate Add Words sessions

#### Configurable Settings
- **Interval Configuration**: Customizable timing for each review stage
- **Progress Tracking**: Comprehensive analytics across all learning stages

### Progress Tracking & Statistics

#### Learning Metrics
- **Stage Distribution**: Count of words in each learning stage (passive, active, review1, review2, review3)
- **Progression Analytics**: Track advancement and regression patterns
- **New Words Learned**: Total count progressing through full learning pipeline
- **Words Reviewed**: Successful progressions through spaced repetition cycles
- **Queue Statistics**: Live counters for available vs scheduled words in each stage

#### Visual Indicators
- **Unified Queue Display**: Real-time statistics for all learning stages with available/scheduled breakdown
- **Due Review Counters**: Number of words ready for review in each stage
- **Session Statistics**: New words added, stage progressions, reviews completed, time spent learning

## Key Features

### User Autonomy & Control
- **Self-Directed Learning**: Complete control over vocabulary selection and pacing
- **Flexible Mode Switching**: Change between Learning, Reviews, and Add Words without restrictions
- **Manual Queue Building**: No forced vocabulary additions or automatic progressions
- **Configurable Experience**: Adjust review intervals and learning preferences in settings

### Comprehensive Learning Pipeline
- **Passive → Active → Review Stages**: Complete mastery pathway for each word
- **3-Consecutive System**: Reliable progression requiring consistent demonstration of knowledge
- **Intelligent Scheduling**: Spaced repetition with stage-based intervals and overdue prioritization
- **Persistent State**: Seamless resume capability with automatic progress saving

### Advanced Queue Management
- **Consecutive Tracking**: Sophisticated tracking of correct/incorrect response patterns
- **Stage-Based Scheduling**: Intelligent timing based on learning stage and performance
- **No Auto-Population**: Prevents overwhelming users with unwanted vocabulary additions
- **Manual Expansion**: Users actively choose when and which words to add to their learning pipeline

## Technical Implementation Notes

- **UnifiedLearningService**: New service architecture with single queue management and stage-based progression
- **QueueManager**: Core utilities for queue manipulation, statistics, and validation
- **New Component Architecture**: QueueStatsDisplay.svelte for unified statistics, enhanced components for stage-based learning
- **Persistent State Management**: All user actions automatically saved with comprehensive analytics
- **Configurable Settings**: Review intervals and learning preferences stored in user settings
- **Smart Card Delivery**: Context-aware card presentation based on learning stage and overdue prioritization

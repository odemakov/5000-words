# French-Russian Flashcard App Specification

## Data Structure

- 5000 French words sorted by frequency with Russian translations
- Each word has multiple possible translations
- Format: `{"id": 239, "word": "région", "props": ["noun", "feminine"], "translations": ["область", "район", "регион"]}`

## Learning Levels

- **A1:** Words 1-800
- **A2:** Words 801-2000
- **B1:** Words 2001-4000
- **B2:** Words 4001-5000

## Landing Mode (Level Detection)

- Test 10 random words from each 100-word batch (1-100, 101-200, etc.)
- Continue until user scores <70% correct
- Use receptive direction only (French→Russian)
- Save all test results and detected level

## Learning Modes

### Receptive Learning (French → Russian)

- **Queue:** forwardQueue with user-controlled size
- **Starting point:** From detected level via queue filling interface

#### Gestures

- **Tap:** Flip card to show translation
- **Swipe right:** "I know this word" (move to backwardQueue for productive learning)
- **Swipe left:** "Don't know" (reinsert at random position on second half of queue)

#### Queue Management

- **Manual population:** Users add words via "Add Words" mode
- **No auto-refill:** Queue requires manual expansion by user
- **Card placement:** Unknown words shuffle to second half of queue

### Productive Learning (Russian → French)

- **Queue:** backwardQueue
- **Activation:** Words from forwardQueue that user marked as "known"
- **Direction:** Russian prompt → French production

#### Gestures

- **Tap:** Flip card to show correct French word
- **Swipe right:** "I know this word" (move to recap7 spaced repetition)
- **Swipe left:** "Don't know" (reinsert at random position on second half of queue)

#### Queue Replacement

- **Source:** Words marked as "known" in receptive learning
- **Size control:** User-controlled
- **No auto-refill:** Relies on user progress through receptive learning

## Progress Tracking

- **Receptive Progress:** Highest word index in forwardQueue
- **Productive Progress:** Highest word index in backwardQueue
- **Display:** Separate progress bars for each learning direction
- **Level celebrations:** Popup when completing receptive/productive milestones

## Spaced Repetition System

- Words mastered in productive learning enter spaced repetition cycle
- **recap7** → **recap14** → **recap30** → **learnedList**
- During reviews:
  - Swipe right → Advance to next stage
  - Swipe left → Demote back to appropriate learning queue

## Learning Flow Control

### Three 6 Modes

1. **Learning receptive mode**
   - Work on forwardQueue
   - Direction switching via UI buttons

3. **Learning production mode**
   - Work on backwardQueue
   - Direction switching via UI buttons

2. **Reviews7/14/30 Mode**
   - Focus on spaced repetition queues
   - Shows oldest due words first

3. **Add Words Mode**
   - Queue filling interface for expanding forwardQueue
   - User controls which words enter the learning pipeline
   - Re-accessible anytime to add more vocabulary

### User Control Principles

- **Complete autonomy:** Switch modes without restrictions
- **Manual queue building:** Users decide which words to learn
- **Flexible pacing:** No forced transitions between modes
- **Persistent state:** All progress automatically saved

## UI Elements

- **Mode selector:** 3-way toggle (2 Learning modes + Review)
- **Add words button**
- **Queue counters:** Live display of all queue sizes
- **Progress indicators:** Tracking of user's progress

## Technical Notes

- All state management via localStorage
- No backend synchronization
- Automatic state persistence after every user action
- Separate progress tracking for receptive and productive directions
- Smart queue management prevents auto-population
- User-driven vocabulary expansion through Add Words mode

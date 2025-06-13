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
- Use French→Russian direction only
- Save all test results and detected level

## Learning Modes

### French → Russian (Primary)

- **Queue:** Always 30 cards
- **Starting point:** From detected level

#### Gestures

- **Tap:** Flip card to show translation
- **Swipe right:** "I know this word" (move to recap7)
- **Swipe left:** "Don't know" (reinsert at random position 10-30)

#### Queue Replacement (when card removed)

- **80%:** Next words in frequency order
- **20%:** Ready recap words (past their review date)
- **End of vocabulary:** 100% recap words only, force reviews mode if none available

### Russian → French (Reverse)

- **Activate requirement:** Words marked as "known" in primary mode
- **Queue source:** Words marked as "known" in primary mode
- **Same 30-card queue and gesture system**
- **Same replacement logic** (sourced from known words pool)

## Progress Tracking

- **Progress calculation:** Highest word index in respective currentQueue
- **Display:** Tiny progress bar showing current level progress (e.g., "B1: 162/2000")
- **Separate progress** for each direction (forward/reverse)

## Recap System

- Words marked "known" (swipe right) enter recap cycle
- During recap:
  - Swipe right → Move to next stage (recap7→recap14→recap30→fully learned)
  - Swipe left → Return to currentQueue

## UI Elements

- **Mode switch:** Three modes available (Forward, Reverse, Reviews)
- **Progress bar:** Bottom of main interface showing current level progress
- **Level celebrations:** Popup when completing a level (A1→A2, etc.)
- **State persistence:** All changes saved immediately after each swipe

## Technical Notes

- All state management via localStorage
- No backend synchronization
- Automatic state persistence after every user action
- Separate progress tracking for forward and reverse directions

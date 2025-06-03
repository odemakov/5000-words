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
- **Swipe right:** "I know this word" (remove forever)
- **Swipe up:** "I learned this word" (add to recap list)
- **Swipe left:** "Don't know" (reinsert at random position 5-30)

#### Queue Replacement (when card removed)

- **60%:** Next words in frequency order
- **20%:** Previous words (prioritize least-seen)
- **20%:** Recap words (2+ weeks old)

### Russian → French (Reverse)

- **Activate requirement:** 100+ words marked as "known" in primary mode
- **Queue source:** Words marked as "known" in primary mode
- **Same 30-card queue and gesture system**
- **Same replacement logic** (sourced from known words pool)

## Progress Tracking

- **Progress calculation:** Average of last 50 "known" words (swipe right only)
- **Display:** Tiny progress bar showing current level progress (e.g., "B1: 162/2000")
- **Hide progress** if user has <50 "known" words
- **Separate progress** for each direction

## Recap System

- Words marked "learned" (swipe up) enter recap cycle
- During recap:
  - Swipe right → Remove forever (graduated)
  - Swipe up → Stay in recap (longer interval)
  - Swipe left → Return to active learning

## UI Elements

- **Mode switch:** Disabled Russian→French button until 100 words known
- **Tooltip:** "Reverse mode unlocks at 100 known words (currently: 73)"
- **Progress bar:** Bottom of main interface showing current level progress
- **Level celebrations:** Popup when completing a level (A1→A2, etc.)

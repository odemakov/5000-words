# Landing Page

## Purpose

Detect user's French vocabulary level through adaptive testing

## Layout Structure

### Header

- App logo/title
- Current test range: "Testing words 1-100"
- **Undo Button**
  - Reverts last swipe action
  - Brings back previous card with its state

### Main Content Area

- **Card Display**
  - Large French word centered on card
  - Clean, minimal design
  - Word properties (noun, verb, etc.) shown subtly below word

### Interaction Zone

- **Tap to flip:** Shows Russian translations on card back
- **Swipe Gestures**
  - Swipe right: "I know this word"
  - Swipe left: "I don't know this word"
  - Visual hints: subtle arrows or swipe indicators

### Bottom Section

- **Progress Indicator**
  - "Question 3 of 10"
  - Progress bar showing current batch completion

## Flow

1. Show French word card (front)
2. User can tap to flip and see Russian translations
3. User swipes right (know) or left (don't know)
4. Card slides away, next word appears
5. After 10 words → calculate accuracy (right swipes / total)
6. If ≥70% → advance to next 100-word range
7. If <70% → end testing, show results
8. Final screen: "Your level: A2. Starting learning from word 801."

## Key Features

- Trust-based system (relies on user honesty)
- Tap to check translation if unsure
- Simple swipe interaction (same as main learning interface)
- Undo last action capability
- Fast-paced testing

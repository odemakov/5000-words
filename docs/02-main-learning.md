# Main Learning Interface

## Purpose

Primary learning screen where users practice vocabulary with 30-card queue

## Layout Structure

### Header

- **Mode Switch Buttons**
  - [French → Russian] [Russian → French]
  - Russian→French disabled until 100 known words
  - Tooltip on disabled: "Reverse mode unlocks at 100 known words (currently: 73)"
- **Undo Button**
  - Reverts last swipe action
  - Brings back previous card with its state

### Main Content Area

- **Card Display**
  - Large word centered on card
  - French word (or Russian translations array for reverse mode)
  - Word properties shown subtly below
  - Clean flip animation on tap

### Interaction Zone

- **Tap:** Flip card to show translation
- **Swipe Gestures**
  - Swipe right: "I know this word" (remove forever)
  - Swipe up: "I learned this word" (add to recap)
  - Swipe left: "Don't know" (reinsert position 5-30)
- **Visual feedback:** Card animations, gesture hints

### Bottom Section

- **Progress Bar**
  - Tiny bar: "B1: 162/2000"
  - Shows current level progress based on last 50 known words
  - Hidden if <50 known words

## Key Features

- Smooth card transitions
- Immediate gesture feedback
- Undo last action capability
- Level progress motivation
- Mode switching capability
- Trust-based learning system

# Pool-Based Review System Implementation

## Overview
The review system has been refactored from fixed interval-based (7/14/30 days) to a configurable pool-based system with three review pools.

## Key Changes

### 1. New Constants File (`src/lib/constants/review.ts`)
- **Configurable intervals**: Review intervals are now defined in seconds for easy configuration
  - `REVIEW_INTERVALS.FIRST`: 7 days (604,800 seconds)
  - `REVIEW_INTERVALS.SECOND`: 14 days (1,209,600 seconds)
  - `REVIEW_INTERVALS.THIRD`: 30 days (2,592,000 seconds)

- **Review Pools**: Three pools with minimum time requirements
  - `POOL1`: Short-term review (min 3 days, interval 7 days)
  - `POOL2`: Medium-term review (min 5 days, interval 14 days)
  - `POOL3`: Long-term review (min 10 days, interval 30 days)

- **Helper Functions**:
  - `getNextPool()`: Returns the next pool in progression
  - `getPreviousPool()`: Returns the previous pool for demotion
  - `getPoolIntervalMs()`: Returns interval in milliseconds
  - `getPoolMinTimeMs()`: Returns minimum time in milliseconds

### 2. Type Updates (`src/lib/types/learning.ts`)
- `ReviewWord.interval` → `ReviewWord.pool` (now uses `ReviewPool` type)
- `CurrentCard.reviewInterval` → `CurrentCard.reviewPool`

### 3. Learning Controller Updates (`src/lib/controllers/LearningController.ts`)
- New function `getReviewsCountByPool()` replaces interval-based counting
- Review promotion logic uses `getNextPool()` helper
- Review demotion logic uses `getPreviousPool()` helper
- Backward queue graduation creates review items with `pool: 'POOL1'`

### 4. UI Updates (`src/lib/components/ModeSelector.svelte`)
- Variable names updated: `review7Stats` → `pool1Stats`, etc.
- Display text changed from "7-day: X" to "Pool 1: X"
- Import changed to use `getReviewsCountByPool`

### 5. Documentation Updates
- **FEATURES.md**: Updated to reference pool-based system
- **README.md**: Learning flow now shows Pool 1 → Pool 2 → Pool 3
- **docs/02-main-learning.md**: Describes pool-based review queue
- **docs/04-app-flow.md**: Updated queue processing logic for pools

## Benefits
1. **Configurability**: Intervals can be easily adjusted by changing constants
2. **Clarity**: Pool names (POOL1, POOL2, POOL3) are more generic and flexible
3. **Maintainability**: Centralized pool logic in helper functions
4. **Extensibility**: Easy to add more pools or change intervals without major refactoring

## Migration Note
No migration needed as the app is in development state. Existing data structures will need to be recreated with the new pool-based system.
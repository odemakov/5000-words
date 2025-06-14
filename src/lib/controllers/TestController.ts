import { derived, get, writable } from 'svelte/store';
import { LEVEL_A1, LEVEL_A2, LEVEL_B1, LEVEL_B2 } from '../constants/modes';
import { Storage } from '../storage.js';

// Word interface matching the data structure
export interface WordData {
  id: number;
  word: string;
  props: string[];
  translations: string[];
}

// Interface for previous word with response
interface PreviousWord {
  word: WordData;
  response: boolean;
}

// Test state interface
interface TestState {
  words: WordData[];
  currentIndex: number;
  responses: boolean[];
  currentBatch: {
    min: number;
    max: number;
  };
  previousWords: PreviousWord[];
  isCompleted: boolean;
  detectedLevel: string;
}

// Store for current test state
export const testState = writable<TestState>({
  words: [], // Current batch of words
  currentIndex: 0, // Current word index
  responses: [], // User responses (true for correct, false for incorrect)
  currentBatch: {
    // Current batch information
    min: 1,
    max: 100
  },
  previousWords: [], // For undo functionality
  isCompleted: false, // Test completion flag
  detectedLevel: '' // Final detected level
});

// Derived store for current word
export const currentWord = derived<typeof testState, WordData | null>(testState, ($state) => {
  if ($state.words.length > 0 && $state.currentIndex < $state.words.length) {
    return $state.words[$state.currentIndex];
  }
  return null;
});

// Progress interface
interface Progress {
  current: number;
  total: number;
  batchRange: string;
}

// Derived store for progress
export const progress = derived<typeof testState, Progress>(testState, ($state) => {
  return {
    current: $state.responses.length,
    total: 10,
    batchRange: `${$state.currentBatch.min}-${$state.currentBatch.max}`
  };
});

// Functions to get words from a specific range (mock implementation)
// In a real app, this would fetch from an API or local storage
async function getWordsFromRange(min: number, max: number, count = 10): Promise<WordData[]> {
  const words = Storage.getWords(min, max);
  // return random count words from the list
  return words?.sort(() => Math.random() - 0.5).slice(0, count) || [];
}

// Actions
export async function loadTestBatch(min: number, max: number): Promise<boolean> {
  try {
    // In a real app, you'd load this from your vocabulary data
    const words = await getWordsFromRange(min, max);

    testState.update((state) => ({
      ...state,
      words,
      currentIndex: 0,
      responses: [],
      currentBatch: { min, max }
    }));

    return true;
  } catch (error) {
    console.error('Failed to load test batch:', error);
    return false;
  }
}

export function recordResponse(isCorrect: boolean): void {
  const state = get(testState);

  // Save current word for undo
  const previousWords: PreviousWord[] = [
    ...state.previousWords,
    {
      word: state.words[state.currentIndex],
      response: isCorrect
    }
  ];

  // Add response
  const responses: boolean[] = [...state.responses, isCorrect];

  // Check if batch is complete
  if (responses.length >= 10) {
    const accuracy = responses.filter((r) => r).length / responses.length;

    // If accuracy < 70%, test is complete
    if (accuracy < 0.7) {
      testState.update((state) => ({
        ...state,
        responses,
        previousWords,
        isCompleted: true,
        detectedLevel: determineLevel(state.currentBatch.min)
      }));
    } else {
      // Load next batch
      loadTestBatch(state.currentBatch.max + 1, state.currentBatch.max + 100);

      testState.update((state) => ({
        ...state,
        responses,
        previousWords
      }));
    }
  } else {
    testState.update((state) => ({
      ...state,
      responses,
      previousWords,
      currentIndex: state.currentIndex + 1
    }));
  }
}

export function undo(): void {
  testState.update((state) => {
    if (state.previousWords.length === 0) return state;

    const previousWords: PreviousWord[] = [...state.previousWords];
    previousWords.pop();

    const responses: boolean[] = [...state.responses];
    responses.pop();

    return {
      ...state,
      previousWords,
      responses,
      currentIndex: state.currentIndex - 1
    };
  });
}

export function getStartingWordForLevel(level: string): number {
  switch (level) {
    case LEVEL_A1:
      return 1;
    case LEVEL_A2:
      return 801;
    case LEVEL_B1:
      return 2001;
    case LEVEL_B2:
      return 4001;
    default:
      return 1;
  }
}

function determineLevel(lastFailedBatch: number): string {
  if (lastFailedBatch <= 800) return LEVEL_A1;
  if (lastFailedBatch <= 2000) return LEVEL_A2;
  if (lastFailedBatch <= 4000) return LEVEL_B1;
  return LEVEL_B2;
}

export function resetTest(): void {
  testState.set({
    words: [],
    currentIndex: 0,
    responses: [],
    currentBatch: {
      min: 1,
      max: 100
    },
    previousWords: [],
    isCompleted: false,
    detectedLevel: ''
  });

  loadTestBatch(1, 100);
}

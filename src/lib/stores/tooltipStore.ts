import type { LearningMode } from '$lib/constants/modes';
import { writable } from 'svelte/store';

// Store to track which tooltip is currently open (if any)
export const activeTooltip = writable<LearningMode | null>(null);

// Function to open a tooltip (closes any existing one)
export function openTooltip(mode: LearningMode) {
  activeTooltip.set(mode);
}

// Function to close the current tooltip
export function closeTooltip() {
  activeTooltip.set(null);
}

// Function to toggle a tooltip (open if closed, close if open)
export function toggleTooltip(mode: LearningMode) {
  activeTooltip.update(current => current === mode ? null : mode);
}

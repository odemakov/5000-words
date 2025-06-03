# Load Screen

## Purpose

Initial screen that downloads vocabulary data and prepares the app for offline use

## Layout Structure

### Header

- App logo/title
- "Setting up your flashcards..."

### Main Content Area

- **Download Status**
  - Spinner animation
  - Status text: "Loading 5000 French words..."
  - Simple, clean loading indicator

### Bottom Section

- **Start Button**
  - "Begin Level Test" button
  - Only appears and enables after successful download
  - Disabled/hidden during download process

### Error State

- **Error Message**
  - "Download failed. Check connection and retry."
  - Retry button to restart download

## Flow

1. App starts → Check cache for existing word data
2. If cache valid → Skip to start button
3. If no cache or outdated → Start download
4. Show spinner with loading message
5. Download complete → Show "Begin Level Test" button
6. User taps → Navigate to landing test

## Cache Validation

- Check if words.json exists in cache
- Validate cache timestamp/version
- Compare with server version (if online)
- Download only if cache is missing or outdated

## Key Features

- Offline-first architecture setup
- Progress feedback during download
- Error handling with retry capability
- Cache validation for efficient loading
- Clean transition to landing test

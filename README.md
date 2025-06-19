# 5000 Words - French Language Learning App

Yet another app nobody cares about. App helps me learn French words.

## Features

### Core Learning System
- **Level Detection**: Test your starting level (A1-B2)
- **Spaced Repetition**: Review scheduling with configurable pool-based intervals
- **Bidirectional Learning**: Master both way translations
- **Progress Tracking**: Real-time statistics and learning analytics

### Modern User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Progressive Web App**: Installable with offline functionality
- **Touch & Keyboard**: Support for swipe gestures and keyboard shortcuts
- **Dark/Light Theme**: Customizable appearance with system preference detection

### Advanced Features
- **Settings Panel**: ? Customization options
- **Data Export/Import**: ? Backup and restore learning progress
- **Session Analytics**: ? Track daily goals, streaks, and time spent
- **Smart Algorithms**: ? 80/20 new word to review ratio optimization

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)
- 2MB+ available storage space

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd 5000-words

# Install dependencies
npm install

# Start development server
npm run dev
```

### First Launch
1. **Word Loading**: App downloads vocabulary database on first visit
2. **Level Assessment**: Complete the adaptive placement test
3. **Learning Setup**: System initializes personalized learning queues
4. **Begin Study**: Start learning with spaced repetition algorithm

## Learning Methodology

### CEFR Level Structure
- **A1 (Beginner)**: Words 1-800 - Basic everyday expressions
- **A2 (Elementary)**: Words 801-2000 - Common situations and topics
- **B1 (Intermediate)**: Words 2001-4000 - Work, school, leisure contexts
- **B2 (Upper-Intermediate)**: Words 4001-5000 - Complex texts and abstract topics

### Spaced Repetition Algorithm
```
New Word → Forward Queue → Backward Queue → Pool 1 Review → Pool 2 Review → Pool 3 Review → Mastered
```

### Learning Modes
- **Learning Forward Mode**: Study new vocabulary in forward direction
- **Learning Backward Mode**: Study new vocabulary in backward direction
- **Reviews Mode**: Focus on spaced repetition of previously learned words

## Architecture

### Technology Stack
- **Frontend**: SvelteKit with TypeScript
- **Styling**: Tailwind CSS with custom components
- **Storage**: LocalStorage with structured data persistence
- **Build**: Vite with optimized production builds
- **PWA**: Service Worker for offline functionality

### Data Structure
```typescript
interface LearningState {
  detectedLevel: 'A1' | 'A2' | 'B1' | 'B2';
  progress: number;           // Highest word index reached
  wordsLearned: number;       // Total mastered words
  forwardQueue: WordInQueue[]; // French → Russian
  backwardQueue: WordInQueue[]; // Russian → French
  reviewQueue: ReviewWord[];  // Pool-based review system
  learnedList: number[];      // Fully mastered word indices
  currentMode: 'learning-forward' | 'learning-backward' | 'reviews';
  todayStats: DailyStats;     // Session analytics
}
```

## User Interface

### Keyboard Shortcuts
- **← →**: Mark card as unknown/known
- **Space/Enter**: Flip flashcard
- **Ctrl+S**: Open settings panel
- **Escape**: Close modals

### Touch Gestures
- **Tap**: Flip flashcard to reveal translation
- **Swipe Left**: Mark as unknown (red feedback)
- **Swipe Right**: Mark as known (green feedback)

### Visual Design
- **Color System**: Green (success), Red (failure), Blue (primary), Yellow/Orange/Green (review tiers)
- **Typography**: Responsive font scaling with user controls

## Analytics & Progress

### Real-time Metrics
- **Session Duration**: Live study time tracking
- **Daily Goals**: Customizable word targets (5-50 words)
- **Streak Counter**: Consecutive days of study
- **Accuracy Rates**: Success/failure performance ratios

### Progress Tracking
- **Level Progress**: Visual progress bars for each CEFR level
- **Queue Statistics**: Forward/Backward/Review queue counts
- **Learning Curve**: Historical performance data
- **Export Capability**: JSON backup of complete progress

## Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Run type checking
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Building for Production
```bash
npm run build
```

The app is built as a static site and can be deployed to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

### Environment Setup
```bash
# Development with hot reload
npm run dev -- --open

# Production build testing
npm run build && npm run preview
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

### Development Guidelines
- Follow TypeScript strict mode
- Use Prettier for code formatting
- Write descriptive commit messages
- Test across multiple browsers
- Maintain accessibility standards

### Feature Requests
- Open an issue with detailed use case
- Include mockups for UI changes
- Consider performance implications
- Align with CEFR learning objectives

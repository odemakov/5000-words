# 5000 Words - French Language Learning App

A comprehensive French vocabulary learning application featuring spaced repetition, adaptive algorithms, and progressive skill building through the 5000 most frequent French words.

## 🌟 Features

### Core Learning System
- **Adaptive Level Detection**: Intelligent placement test determines your starting level (A1-B2)
- **Spaced Repetition**: Scientific review scheduling with 7/14/30-day intervals
- **Bidirectional Learning**: Master both French→Russian and Russian→French translations
- **Queue Management**: Smart card distribution with 30-card learning queues
- **Progress Tracking**: Real-time statistics and learning analytics

### Modern User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Progressive Web App**: Installable with offline functionality
- **Touch & Keyboard**: Support for swipe gestures and keyboard shortcuts
- **Accessibility**: Screen reader support and high contrast modes
- **Dark/Light Theme**: Customizable appearance with system preference detection

### Advanced Features
- **Settings Panel**: Comprehensive customization options
- **Data Export/Import**: Backup and restore learning progress
- **Session Analytics**: Track daily goals, streaks, and time spent
- **Smart Algorithms**: 80/20 new word to review ratio optimization
- **Visual Feedback**: Color-coded progress indicators and animations

## 🚀 Quick Start

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

## 🎯 Learning Methodology

### CEFR Level Structure
- **A1 (Beginner)**: Words 1-800 - Basic everyday expressions
- **A2 (Elementary)**: Words 801-2000 - Common situations and topics
- **B1 (Intermediate)**: Words 2001-4000 - Work, school, leisure contexts
- **B2 (Upper-Intermediate)**: Words 4001-5000 - Complex texts and abstract topics

### Spaced Repetition Algorithm
```
New Word → Forward Queue → Backward Queue → 7-day Review → 14-day Review → 30-day Review → Mastered
```

### Learning Modes
- **Learning Mode**: Study new vocabulary in both directions
- **Reviews Mode**: Focus on spaced repetition of previously learned words
- **Auto-switching**: System suggests optimal mode based on due reviews

## 🏗️ Architecture

### Technology Stack
- **Frontend**: SvelteKit with TypeScript
- **Styling**: Tailwind CSS with custom components
- **Storage**: LocalStorage with structured data persistence
- **Build**: Vite with optimized production builds
- **PWA**: Service Worker for offline functionality

### Project Structure
```
src/
├── lib/
│   ├── components/          # Reusable UI components
│   │   ├── FlashCard.svelte       # Interactive flashcard system
│   │   ├── ModeSelector.svelte    # Learning/Reviews mode switcher
│   │   ├── QueueStats.svelte      # Statistics dashboard
│   │   ├── ProgressHeader.svelte  # Progress tracking header
│   │   ├── EmptyState.svelte      # Empty state handling
│   │   └── SettingsPanel.svelte   # Settings and analytics
│   ├── controllers/         # Business logic
│   │   ├── LearningController.ts  # Main learning algorithm
│   │   └── TestController.ts      # Level detection system
│   ├── types/              # TypeScript definitions
│   │   └── learning.ts           # Learning system interfaces
│   └── storage.ts          # Data persistence layer
├── routes/
│   ├── learning/           # Main learning interface
│   └── +page.svelte       # Landing page and level test
└── static/                # Static assets and word data
```

### Data Structure
```typescript
interface LearningState {
  detectedLevel: 'A1' | 'A2' | 'B1' | 'B2';
  progress: number;           // Highest word index reached
  wordsLearned: number;       // Total mastered words
  forwardQueue: WordInQueue[]; // French → Russian
  backwardQueue: WordInQueue[]; // Russian → French
  recap7: RecapWord[];        // 7-day reviews
  recap14: RecapWord[];       // 14-day reviews
  recap30: RecapWord[];       // 30-day reviews
  learnedList: number[];      // Fully mastered word indices
  currentMode: 'learning' | 'reviews';
  todayStats: DailyStats;     // Session analytics
}
```

## 🎮 User Interface

### Keyboard Shortcuts
- **← →**: Mark card as unknown/known
- **Space/Enter**: Flip flashcard
- **Ctrl+S**: Open settings panel
- **Escape**: Close modals

### Touch Gestures
- **Tap**: Flip flashcard to reveal translation
- **Swipe Left**: Mark as unknown (red feedback)
- **Swipe Right**: Mark as known (green feedback)
- **Swipe Up**: Alternative action (context-dependent)

### Visual Design
- **Color System**: Green (success), Red (failure), Blue (primary), Yellow/Orange/Green (review tiers)
- **Typography**: Responsive font scaling with user controls
- **Animations**: Smooth 60fps transitions with hardware acceleration
- **Spacing**: 8px grid system for consistent alignment

## 📊 Analytics & Progress

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

## 🔧 Development

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

## 🧪 Testing

### Manual Testing Checklist
- [ ] Level detection test completion
- [ ] Forward/Backward queue functionality
- [ ] Spaced repetition scheduling
- [ ] Settings persistence
- [ ] Data export/import
- [ ] Mobile touch gestures
- [ ] Keyboard navigation
- [ ] Theme switching
- [ ] Offline functionality

### Performance Metrics
- **Initial Load**: < 2 seconds on 3G
- **Card Interactions**: < 100ms response time
- **Memory Usage**: < 50MB for full vocabulary
- **Bundle Size**: < 500KB gzipped

## 🌐 Browser Support

### Minimum Requirements
- **Chrome**: 88+
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 88+

### Progressive Enhancement
- Core functionality works without JavaScript
- Enhanced features require modern browser APIs
- Graceful degradation for older browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript strict mode
2. Use Prettier for code formatting
3. Write descriptive commit messages
4. Test across multiple browsers
5. Maintain accessibility standards

### Feature Requests
- Open an issue with detailed use case
- Include mockups for UI changes
- Consider performance implications
- Align with CEFR learning objectives

## 🔮 Roadmap

### Version 2.0 (Planned)
- [ ] Audio pronunciation with native speakers
- [ ] Sentence examples and context
- [ ] Social features and study groups
- [ ] Advanced analytics dashboard
- [ ] Cloud synchronization
- [ ] Additional language pairs
- [ ] Gamification and achievements

### Performance Optimizations
- [ ] Virtual scrolling for large lists
- [ ] Service Worker caching strategies
- [ ] IndexedDB for large datasets
- [ ] Web Workers for background processing

## 📞 Support

For questions, bug reports, or feature requests:
- Open an issue on GitHub
- Check the [FEATURES.md](FEATURES.md) for detailed documentation
- Review the docs folder for technical specifications

---

**Built with ❤️ for language learners**

*Combining scientific learning principles with modern web technology to make French vocabulary acquisition effective and enjoyable.*
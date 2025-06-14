import { LEVEL_A1, LEVEL_A2, LEVEL_B1, LEVEL_B2 } from './constants/modes';

const prefix = '5000-words:';
const words_data = prefix + 'words_data';
const words_version = prefix + 'words_version';
const user_progress = prefix + 'user_progress';
const user_level = prefix + 'user_level';
const learning_state = prefix + 'learning_state';
const app_settings = prefix + 'app_settings';

export interface WordData {
  id: number;
  word: string;
  props: string[];
  translations: string[];
}

export interface VersionInfo {
  words_version: string;
  last_updated: string;
  total_words: number;
  changelog?: string;
}

export interface AppSettings {
  fontSize: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark';
  soundEffects: boolean;
  dailyGoal: number;
}

export interface UserProgress {
  knownWords: number[];
  learnedWords: number[];
  currentWordIndex: number;
  sessions: Array<{
    date: string;
    wordsLearned: number;
    timeSpent: number;
  }>;
}

export interface UserLevel {
  detectedLevel: number;
  landingResults: Array<{
    wordRange: string;
    wordsTested: number[];
    correctAnswers: number;
    accuracy: number;
  }>;
  timestamp: string;
}

export interface LearningStateData {
  version: string;
  state: unknown; // Will be typed as LearningState when imported
  savedAt: number;
}

export class Storage {
  static save<T>(key: string, data: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Storage save failed:', error);
      return false;
    }
  }

  static load<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Storage load failed:', error);
      return null;
    }
  }

  static remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove failed:', error);
      return false;
    }
  }

  // App-specific methods
  static getWords(min: number = 0, max: number = Infinity): WordData[] | null {
    const words = this.load<WordData[]>(words_data);
    return words?.slice(min, max) || null;
  }

  static saveWords(words: WordData[]): boolean {
    return this.save(words_data, words);
  }

  static getAppSettings(): AppSettings | null {
    return this.load<AppSettings>(app_settings);
  }

  static saveAppSettings(settings: AppSettings): boolean {
    return this.save(app_settings, settings);
  }

  static getVersion(): VersionInfo | null {
    return this.load<VersionInfo>(words_version);
  }

  static saveVersion(version: VersionInfo): boolean {
    return this.save(words_version, version);
  }

  static getUserLevel(): UserLevel | null {
    return this.load<UserLevel>(user_level);
  }

  static saveUserLevel(level: UserLevel): boolean {
    return this.save(user_level, level);
  }

  static setUserLevel(levelName: string): boolean {
    const currentLevel = this.getUserLevel() || {
      detectedLevel: 0,
      landingResults: [],
      timestamp: new Date().toISOString()
    };

    // Map level name to numerical value
    let detectedLevel = 0;
    switch (levelName) {
      case LEVEL_A1:
        detectedLevel = 1;
        break;
      case LEVEL_A2:
        detectedLevel = 2;
        break;
      case LEVEL_B1:
        detectedLevel = 3;
        break;
      case LEVEL_B2:
        detectedLevel = 4;
        break;
    }

    currentLevel.detectedLevel = detectedLevel;
    currentLevel.timestamp = new Date().toISOString();

    return this.saveUserLevel(currentLevel);
  }

  static getUserProgress(): UserProgress {
    return (
      this.load<UserProgress>(user_progress) || {
        knownWords: [],
        learnedWords: [],
        currentWordIndex: 0,
        sessions: []
      }
    );
  }

  static saveUserProgress(progress: UserProgress): boolean {
    return this.save(user_progress, progress);
  }

  static async fetchVersionInfo(): Promise<VersionInfo> {
    console.log('Fetching version info from network...');
    const response = await fetch('/words-version.json', {
      cache: 'no-cache',
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as VersionInfo;
  }

  static async checkForWordsUpdate(): Promise<{
    needsUpdate: boolean;
    version: VersionInfo | null;
  }> {
    try {
      const newVersion = await this.fetchVersionInfo();
      const cachedVersion = this.getVersion();

      // Compare versions
      if (!cachedVersion || cachedVersion.words_version !== newVersion.words_version) {
        console.log(
          `Version update available: ${cachedVersion?.words_version || 'none'} -> ${newVersion.words_version}`
        );
        return { needsUpdate: true, version: newVersion };
      }

      return { needsUpdate: false, version: cachedVersion };
    } catch (error) {
      console.error('Failed to check version:', error);
      // If version check fails, assume update needed if we have no cached words
      return { needsUpdate: !this.getWords(), version: null };
    }
  }

  static async downloadWords(
    versionInfo?: VersionInfo | null
  ): Promise<{ words: WordData[]; version: VersionInfo }> {
    try {
      // If version info wasn't provided, use what we have
      let version = versionInfo;

      if (!version) {
        // Try to get cached version info
        version = this.getVersion();
      }

      // If we still don't have version info, fetch it
      if (!version) {
        console.log('Downloading version info...');
        version = await this.fetchVersionInfo();
      }

      // Download words
      console.log(`Downloading words (version: ${version.words_version})...`);
      const wordsResponse = await fetch('/words.json', { cache: 'no-cache' });

      if (!wordsResponse.ok) {
        throw new Error('Failed to download words file');
      }

      const wordsData = await wordsResponse.json();

      if (!wordsData.words || !Array.isArray(wordsData.words)) {
        throw new Error('Invalid words data structure');
      }

      return { words: wordsData.words, version };
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  // Learning state methods
  static getLearningState(): unknown | null {
    const data = this.load<LearningStateData>(learning_state);
    if (data && data.version === '1.0') {
      return data.state;
    }
    return null;
  }

  static saveLearningState(state: unknown): boolean {
    const data: LearningStateData = {
      version: '1.0',
      state,
      savedAt: Date.now()
    };
    return this.save(learning_state, data);
  }

  static exportLearningData(): string {
    const state = this.getLearningState();
    const words = this.getWords();
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        learningState: state,
        wordsData: words
      },
      null,
      2
    );
  }

  static clearLearningState(): boolean {
    return this.remove(learning_state);
  }
}

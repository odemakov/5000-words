const prefix = '5000-words:';
const words_data = prefix + 'words_data';
const words_version = prefix + 'words_version';
const user_progress = prefix + 'user_progress';
const user_level = prefix + 'user_level';

export interface WordData {
	id: number;
	word: string;
	props: string[];
	translations: string[];
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
	static getWords(): WordData[] | null {
		return this.load<WordData[]>(words_data);
	}

	static saveWords(words: WordData[]): boolean {
		return this.save(words_data, words);
	}

	static getWordsVersion(): string | null {
		return this.load<string>(words_version);
	}

	static saveWordsVersion(version: string): boolean {
		return this.save(words_version, version);
	}

	static getUserLevel(): UserLevel | null {
		return this.load<UserLevel>(user_level);
	}

	static saveUserLevel(level: UserLevel): boolean {
		return this.save(user_level, level);
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

	static shouldCheckForUpdates(): boolean {
		const lastCheck = localStorage.getItem('last_words_check');
		const now = Date.now();
		const oneDayMs = 24 * 60 * 60 * 1000;

		if (!lastCheck || now - parseInt(lastCheck) > oneDayMs) {
			localStorage.setItem('last_words_check', now.toString());
			return true;
		}
		return false;
	}
}

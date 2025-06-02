<script lang="ts">
	import { onMount } from 'svelte';
	import { Storage } from '../lib/storage.js';
	import Loader from '../lib/components/Loader.svelte';

	type AppState = 'loader' | 'landing' | 'learning';
	let currentState = $state<AppState>('loader');

	onMount(() => {
		// Register service worker
		registerServiceWorker();

		// Determine initial state
		const hasWords = Storage.getWords();
		const userLevel = Storage.getUserLevel();

		if (hasWords && userLevel) {
			currentState = 'learning';
		} else if (hasWords) {
			currentState = 'landing';
		} else {
			currentState = 'loader';
		}
	});

	async function registerServiceWorker() {
		if ('serviceWorker' in navigator) {
			try {
				await navigator.serviceWorker.register('/sw.js');
				console.log('Service Worker registered successfully');
			} catch (error) {
				console.log('Service Worker registration failed:', error);
			}
		}
	}

	function handleWordsLoaded() {
		currentState = 'landing';
	}

	function handleLandingComplete() {
		currentState = 'learning';
	}
</script>

<svelte:head>
	<title>5000 Words - French Learning</title>
	<meta name="description" content="Learn French vocabulary with 5000 most frequent words" />
	<meta name="theme-color" content="#2563eb" />
</svelte:head>

<main class="min-h-screen bg-gray-50">
	{#if currentState === 'loader'}
		<Loader on:wordsLoaded={handleWordsLoaded} />
	{:else if currentState === 'landing'}
		<div class="flex min-h-screen items-center justify-center">
			<p class="text-xl text-gray-600">Landing component coming next...</p>
			<button onclick={handleLandingComplete} class="ml-4 rounded bg-blue-500 px-4 py-2 text-white">
				Skip to Learning (temp)
			</button>
		</div>
	{:else if currentState === 'learning'}
		<div class="flex min-h-screen items-center justify-center">
			<p class="text-xl text-gray-600">Learning component coming next...</p>
		</div>
	{/if}
</main>

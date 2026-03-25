<script>
	import { max } from 'd3-array';
	import data from '../data/county_three_parties.csv';
	import Triangle from '$lib/components/Triangle.svelte';
	import StateTriangle from '$lib/components/StateTriangle.svelte';
	import SmallMultiples from '$lib/components/SmallMultiples.svelte';
	import Slider from '$lib/components/Slider.svelte';
	import { groupByState } from '$lib/utils/processData.js';

	const cleaned_data = $derived(
		data.map((d) => ({
			...d,
			year:         +d.year,
			percent:      +d.percent,
			total_voters: +d.total_voters
		}))
	);

	let selectedYear    = $state(2026);
	let playing         = $state(false);

	const yearData        = $derived(cleaned_data.filter((d) => d.year === selectedYear));
	const trailData       = $derived(cleaned_data.filter((d) => d.year < selectedYear));
	const globalMaxVoters      = $derived(max(cleaned_data, (d) => d.total_voters));
	const globalMaxStateVoters = $derived(max(groupByState(cleaned_data), (d) => d.totalVoters));

	$effect(() => {
		if (!playing) return;
		const interval = setInterval(() => {
			if (selectedYear >= 2026) {
				playing = false;
			} else {
				selectedYear += 1;
			}
		}, 900);
		return () => clearInterval(interval);
	});

	function togglePlay() {
		if (selectedYear >= 2026) selectedYear = 2016;
		playing = !playing;
	}
</script>

<div class="controls">
	<button class="play-btn" onclick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
		{#if playing}
			<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
				<rect x="3" y="2" width="4" height="12" rx="1"/>
				<rect x="9" y="2" width="4" height="12" rx="1"/>
			</svg>
		{:else}
			<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
				<path d="M4 2l10 6-10 6V2z"/>
			</svg>
		{/if}
	</button>

	<Slider
		bind:value={selectedYear}
		min={2016}
		max={2026}
		step={1}
		label=""
	/>
</div>

<Triangle
	data={yearData}
	year={selectedYear}
	globalMaxVoters={globalMaxVoters}
	trailData={trailData}
/>

<StateTriangle
	data={yearData}
	year={selectedYear}
	globalMaxStateVoters={globalMaxStateVoters}
	trailData={trailData}
/>

<SmallMultiples
	data={yearData}
	year={selectedYear}
	globalMaxVoters={globalMaxVoters}
	trailData={trailData}
	allData={cleaned_data}
/>

<style>
	.controls {
		display: flex;
		align-items: center;
		gap: 8px;
		max-width: 700px;
		margin: 24px auto 0;
		padding: 0 16px;
	}

	.play-btn {
		width: 36px;
		height: 36px;
		min-width: 36px;
		border: none;
		border-radius: 50%;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #555;
		flex-shrink: 0;
	}

	.play-btn:hover {
		color: #222;
	}
</style>

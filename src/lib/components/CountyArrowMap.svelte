<script>
	import centroids from '../../data/US_Counties_Centroids.csv';
	import { groupByCounty } from '$lib/utils/processData.js';
	import { blendColor } from '$lib/utils/ternary.js';
	import { geoAlbersUsa } from 'd3-geo';
	import { group } from 'd3-array';
	import Slider from './Slider.svelte';

	let { allData } = $props();

	const WIDTH = 960;
	const HEIGHT = 560;
	const ARROW_LENGTH = 12;
	const HEAD_SIZE = 4;
	const SQ3_2 = Math.sqrt(3) / 2;

	// Voter data uses lowercase no-space state names; centroids use 2-letter abbreviations
	const STATE_ABBR = {
		arizona:            'AZ',
		california:         'CA',
		colorado:           'CO',
		connecticut:        'CT',
		delaware:           'DE',
		districtofcolumbia: 'DC',
		florida:            'FL',
		idaho:              'ID',
		iowa:               'IA',
		kansas:             'KS',
		kentucky:           'KY',
		louisiana:          'LA',
		maine:              'ME',
		maryland:           'MD',
		nebraska:           'NE',
		nevada:             'NV',
		newjersey:          'NJ',
		newmexico:          'NM',
		newyork:            'NY',
		northcarolina:      'NC',
		oklahoma:           'OK',
		oregon:             'OR',
		pennsylvania:       'PA',
		rhodeisland:        'RI',
		southdakota:        'SD',
		utah:               'UT',
		westvirginia:       'WV',
		wyoming:            'WY'
	};

	const projection = geoAlbersUsa().scale(1300).translate([WIDTH / 2, HEIGHT / 2]);

	const centroidLookup = new Map(
		centroids.map((d) => [`${d.STATE}__${d.NAME.toUpperCase()}`, [+d.LONGITUDE, +d.LATITUDE]])
	);

	// Own controls
	let selectedYear = $state(2026);
	let playing = $state(false);

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

	// Pre-index all county data by countyId → year → countyObj (computed once from static allData)
	const allCountyData = $derived.by(() => {
		const byYear = group(allData, (d) => d.year);
		const result = new Map(); // Map<countyId, Map<year, countyObj>>

		for (const [yr, rows] of byYear) {
			for (const c of groupByCounty(rows)) {
				if (!result.has(c.id)) result.set(c.id, new Map());
				result.get(c.id).set(yr, c);
			}
		}
		return result;
	});

	const arrows = $derived.by(() => {
		const result = [];

		for (const [, yearMap] of allCountyData) {
			// Use selected year; fall back to most recent prior year if missing
			let c = yearMap.get(selectedYear);
			if (!c) {
				const priorYears = [...yearMap.keys()].filter((y) => y < selectedYear);
				if (!priorYears.length) continue;
				c = yearMap.get(Math.max(...priorYears));
			}

			const abbr = STATE_ABBR[c.state];
			if (!abbr) continue;

			const lonlat = centroidLookup.get(`${abbr}__${c.county.toUpperCase()}`);
			if (!lonlat) continue;

			const projected = projection(lonlat);
			if (!projected) continue;

			const [cx, cy] = projected;

			// Direction vector: barycentric weighting of triangle vertex directions in SVG coords
			// Other → up (0, -1), Dem → bottom-left (-√3/2, +0.5), Rep → bottom-right (+√3/2, +0.5)
			const dx = c.dem * (-SQ3_2) + c.rep * SQ3_2;
			const dy = c.dem * 0.5 + c.rep * 0.5 + c.other * (-1);

			const angle = Math.atan2(dy, dx) * (180 / Math.PI);
			const color = blendColor(c.dem, c.rep, c.other);

			result.push({ cx, cy, angle, color });
		}

		return result;
	});
</script>

<div class="map-wrap">
	<div class="controls">
		<button class="play-btn" onclick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
			{#if playing}
				<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
					<rect x="3" y="2" width="4" height="12" rx="1" />
					<rect x="9" y="2" width="4" height="12" rx="1" />
				</svg>
			{:else}
				<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
					<path d="M4 2l10 6-10 6V2z" />
				</svg>
			{/if}
		</button>
		<Slider bind:value={selectedYear} min={2016} max={2026} step={1} label="" />
	</div>

	<svg width={WIDTH} height={HEIGHT} viewBox="0 0 {WIDTH} {HEIGHT}">
		<text x={WIDTH - 12} y={HEIGHT - 12} text-anchor="end" class="year-label">{selectedYear}</text>
		{#each arrows as a}
			<g transform="translate({a.cx},{a.cy}) rotate({a.angle})">
				<line
					x1="0"
					y1="0"
					x2={ARROW_LENGTH}
					y2="0"
					stroke={a.color}
					stroke-width="1.2"
					stroke-opacity="0.75"
				/>
				<polygon
					points="{ARROW_LENGTH},0 {ARROW_LENGTH - HEAD_SIZE},{-HEAD_SIZE * 0.6} {ARROW_LENGTH - HEAD_SIZE},{HEAD_SIZE * 0.6}"
					fill={a.color}
					fill-opacity="0.85"
				/>
			</g>
		{/each}
	</svg>
</div>

<style>
	.map-wrap {
		max-width: 960px;
		margin: 32px auto 0;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 8px;
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

	svg {
		width: 100%;
		height: auto;
		display: block;
	}

	.year-label {
		font-size: 18px;
		fill: #888;
		font-family: sans-serif;
	}
</style>

<script>
	import centroids from '../../data/US_Counties_Centroids.csv';
	import { groupByCounty } from '$lib/utils/processData.js';
	import { blendColor } from '$lib/utils/ternary.js';
	import { geoAlbersUsa } from 'd3-geo';
	import { group } from 'd3-array';
	import { scaleSqrt, scaleLinear } from 'd3-scale';
	import Slider from './Slider.svelte';

	let { allData } = $props();

	const WIDTH = 960;
	const HEIGHT = 560;
	const SQ3_2 = Math.sqrt(3) / 2;

	// Voter data uses lowercase no-space state names; centroids use 2-letter abbreviations
	const STATE_ABBR = {
		arizona: 'AZ',
		california: 'CA',
		colorado: 'CO',
		connecticut: 'CT',
		delaware: 'DE',
		districtofcolumbia: 'DC',
		florida: 'FL',
		idaho: 'ID',
		iowa: 'IA',
		kansas: 'KS',
		kentucky: 'KY',
		louisiana: 'LA',
		maine: 'ME',
		maryland: 'MD',
		nebraska: 'NE',
		nevada: 'NV',
		newjersey: 'NJ',
		newmexico: 'NM',
		newyork: 'NY',
		northcarolina: 'NC',
		oklahoma: 'OK',
		oregon: 'OR',
		pennsylvania: 'PA',
		rhodeisland: 'RI',
		southdakota: 'SD',
		utah: 'UT',
		westvirginia: 'WV',
		wyoming: 'WY'
	};

	const projection = geoAlbersUsa()
		.scale(1300)
		.translate([WIDTH / 2, HEIGHT / 2]);

	// Louisiana centroids store names as "Acadia Parish", "Allen Parish", etc.
	// Strip the " Parish" suffix so they join with voter data's plain names.
	const centroidLookup = new Map(
		centroids.map((d) => {
			const name = d.NAME.replace(/ Parish$/, '').toUpperCase();
			return [`${d.STATE}__${name}`, [+d.LONGITUDE, +d.LATITUDE]];
		})
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

	// Stable scale anchor: max barycentric change any county ever makes from its first year
	const globalMaxChange = $derived.by(() => {
		let maxChange = 0;
		for (const [, yearMap] of allCountyData) {
			const firstYear = Math.min(...yearMap.keys());
			const c0 = yearMap.get(firstYear);
			const dx0 = c0.dem * -SQ3_2 + c0.rep * SQ3_2;
			const dy0 = c0.dem * 0.5 + c0.rep * 0.5 + c0.other * -1;
			for (const [yr, c] of yearMap) {
				if (yr === firstYear) continue;
				const dx = c.dem * -SQ3_2 + c.rep * SQ3_2;
				const dy = c.dem * 0.5 + c.rep * 0.5 + c.other * -1;
				const dist = Math.sqrt((dx - dx0) ** 2 + (dy - dy0) ** 2);
				if (dist > maxChange) maxChange = dist;
			}
		}
		return maxChange || 1;
	});

	// Arrow length: sqrt scale so mid-range counties are still visible
	// Arrow stroke width: linear scale for a secondary size cue
	const lengthScale = $derived(scaleSqrt().domain([0, globalMaxChange]).range([4, 22]).clamp(true));
	const widthScale = $derived(
		scaleLinear().domain([0, globalMaxChange]).range([0.8, 2.8]).clamp(true)
	);

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

			// Current barycentric position (encodes direction)
			const dx = c.dem * -SQ3_2 + c.rep * SQ3_2;
			const dy = c.dem * 0.5 + c.rep * 0.5 + c.other * -1;
			const angle = Math.atan2(dy, dx) * (180 / Math.PI);

			// Change from this county's first year of data → current position
			const firstYear = Math.min(...yearMap.keys());
			const c0 = yearMap.get(firstYear);
			const dx0 = c0.dem * -SQ3_2 + c0.rep * SQ3_2;
			const dy0 = c0.dem * 0.5 + c0.rep * 0.5 + c0.other * -1;
			const change = Math.sqrt((dx - dx0) ** 2 + (dy - dy0) ** 2);

			const length = lengthScale(change);
			const width = widthScale(change);
			const headSize = length * 0.3;
			const color = blendColor(c.dem, c.rep, c.other);

			result.push({ cx, cy, angle, length, width, headSize, color });
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
					x2={a.length}
					y2="0"
					stroke={a.color}
					stroke-width={a.width}
					stroke-opacity="0.75"
				/>
				<polygon
					points="{a.length},0 {a.length - a.headSize},{-a.headSize * 0.6} {a.length -
						a.headSize},{a.headSize * 0.6}"
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

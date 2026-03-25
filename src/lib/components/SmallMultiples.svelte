<script>
	// @ts-nocheck
	import { group, max } from 'd3-array';
	import { scaleSqrt } from 'd3-scale';
	import { groupByCounty } from '$lib/utils/processData.js';
	import { barycentricToSVG, blendColor } from '$lib/utils/ternary.js';

	let { data, year = 2026, globalMaxVoters = null, trailData = [], allData = [] } = $props();

	const W   = 250;
	const H   = 215;
	const PAD = 16;

	const vertices = {
		other: { x: W / 2, y: PAD },
		dem: { x: PAD, y: H - PAD },
		rep: { x: W - PAD, y: H - PAD }
	};

	const trianglePoints = `${vertices.other.x},${vertices.other.y} ${vertices.dem.x},${vertices.dem.y} ${vertices.rep.x},${vertices.rep.y}`;

	const radiusScale = $derived(
		scaleSqrt()
			.domain([0, globalMaxVoters ?? max(data, (d) => d.total_voters)])
			.range([1, 10])
			.clamp(true)
	);

	// All states ever seen across all years, sorted alphabetically
	const allStates = $derived(
		[...new Set(allData.map((d) => d.state))].sort((a, b) => a.localeCompare(b))
	);

	// Always render every state; fall back to the most recent prior year when
	// the selected year has no data for a given state
	const statePoints = $derived.by(() => {
		const currentByState = group(groupByCounty(data), (d) => d.state);
		const trailByState   = group(trailData, (d) => d.state);

		return allStates.map((state) => {
			let counties = currentByState.get(state);

			if (!counties || counties.length === 0) {
				const stateTrailRows = trailByState.get(state) ?? [];
				if (stateTrailRows.length > 0) {
					const byYear     = group(stateTrailRows, (d) => d.year);
					const latestYear = Math.max(...byYear.keys());
					counties         = groupByCounty(byYear.get(latestYear));
				} else {
					counties = [];
				}
			}

			return {
				state,
				counties: counties.map((d) => ({
					...d,
					...barycentricToSVG(d.dem, d.rep, d.other, vertices),
					r:     radiusScale(d.totalVoters),
					color: blendColor(d.dem, d.rep, d.other)
				}))
			};
		});
	});

	// Build per-county trail paths, grouped by state
	const stateTrails = $derived.by(() => {
		if (!trailData.length) return new Map();

		const byState = group(trailData, (d) => d.state);
		const result = new Map();

		for (const [state, stateRows] of byState) {
			const byCounty = group(stateRows, (d) => `${d.state}__${d.geography_standardized}`);
			const countyMap = new Map();

			for (const [countyId, rows] of byCounty) {
				const byYear = group(rows, (d) => d.year);
				const positions = [];

				for (const [, yearRows] of [...byYear].sort(([a], [b]) => a - b)) {
					const dem = yearRows.find((r) => r.party === 'Democratic');
					const rep = yearRows.find((r) => r.party === 'Republican');
					const other = yearRows.find((r) => r.party === 'Other/Unaffiliated');
					if (!dem || !rep || !other) continue;

					const sum = dem.percent + rep.percent + other.percent;
					positions.push(
						barycentricToSVG(dem.percent / sum, rep.percent / sum, other.percent / sum, vertices)
					);
				}

				if (positions.length) countyMap.set(countyId, positions);
			}

			result.set(state, countyMap);
		}

		return result;
	});

	let hovered = $state(null);
	let tipX = $state(0);
	let tipY = $state(0);
</script>

<div class="grid">
	{#each statePoints as { state, counties }}
		{@const trails = stateTrails.get(state) ?? new Map()}
		<div class="cell">
			<svg viewBox="0 0 {W} {H}" width="100%" style="display:block;">
				<polygon points={trianglePoints} fill="none" stroke="#ccc" stroke-width="0.75" />

				<!-- Trail paths -->
				{#each counties as pt (pt.id)}
					{#if trails.has(pt.id)}
						{@const trail = trails.get(pt.id)}
						{@const allPts = [...trail, { x: pt.x, y: pt.y }]}
						<polyline
							points={allPts.map((p) => `${p.x},${p.y}`).join(' ')}
							fill="none"
							stroke={pt.color}
							stroke-width="0.75"
							stroke-opacity="0.35"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					{/if}
				{/each}

				<!-- County circles -->
				{#each counties as pt (pt.id)}
					<circle
						cx={pt.x}
						cy={pt.y}
						r={pt.r}
						fill={pt.color}
						fill-opacity="0.7"
						stroke="white"
						stroke-width="0.3"
						role="presentation"
						onmouseenter={(e) => {
							hovered = pt;
							tipX = e.clientX;
							tipY = e.clientY;
						}}
						onmousemove={(e) => {
							tipX = e.clientX;
							tipY = e.clientY;
						}}
						onmouseleave={() => {
							hovered = null;
						}}
						style="cursor:pointer;"
					/>
				{/each}
			</svg>
			<div class="state-label">{state}</div>
		</div>
	{/each}
</div>

{#if hovered}
	<div class="tooltip" style="left:{tipX + 14}px; top:{tipY - 8}px;">
		<strong>{hovered.county}, {hovered.state}</strong>
		<div class="rows">
			<span class="dem-label">Democratic</span><span>{(hovered.dem * 100).toFixed(1)}%</span>
			<span class="rep-label">Republican</span><span>{(hovered.rep * 100).toFixed(1)}%</span>
			<span>Other / Unaffiliated</span><span>{(hovered.other * 100).toFixed(1)}%</span>
			<span>Total voters</span><span>{hovered.totalVoters.toLocaleString()}</span>
		</div>
	</div>
{/if}

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 12px 8px;
		padding: 24px 16px;
	}

	.cell {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.state-label {
		font-size: 11px;
		font-family: sans-serif;
		color: #555;
		margin-top: 2px;
		text-align: center;
	}

	.tooltip {
		position: fixed;
		pointer-events: none;
		background: rgba(255, 255, 255, 0.97);
		border: 1px solid #ddd;
		border-radius: 4px;
		padding: 8px 12px;
		font-size: 13px;
		font-family: sans-serif;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		z-index: 100;
		min-width: 180px;
	}

	.tooltip strong {
		display: block;
		margin-bottom: 6px;
		font-size: 14px;
	}

	.rows {
		display: grid;
		grid-template-columns: auto auto;
		gap: 2px 12px;
	}

	.rows span:nth-child(even) {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.dem-label {
		color: #0055a4;
	}
	.rep-label {
		color: #c81e1e;
	}
</style>

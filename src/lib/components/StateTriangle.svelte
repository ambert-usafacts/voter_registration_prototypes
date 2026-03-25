<script>
	// @ts-nocheck
	import { max, group } from 'd3-array';
	import { scaleSqrt } from 'd3-scale';
	import { groupByState } from '$lib/utils/processData.js';
	import { barycentricToSVG, blendColor } from '$lib/utils/ternary.js';

	let { data, year = 2026, globalMaxStateVoters = null, trailData = [] } = $props();

	const SVG_W = 600;
	const SVG_H = 560;
	const PAD = 48;

	const vertices = {
		other: { x: SVG_W / 2, y: PAD },
		dem: { x: PAD, y: SVG_H - PAD },
		rep: { x: SVG_W - PAD, y: SVG_H - PAD }
	};

	const trianglePoints = `${vertices.other.x},${vertices.other.y} ${vertices.dem.x},${vertices.dem.y} ${vertices.rep.x},${vertices.rep.y}`;

	const stateData = $derived(groupByState(data));

	const radiusScale = $derived(
		scaleSqrt()
			.domain([0, globalMaxStateVoters ?? max(stateData, (d) => d.totalVoters)])
			.range([3, 28])
			.clamp(true)
	);

	const statePoints = $derived(
		stateData.map((d) => ({
			...d,
			...barycentricToSVG(d.dem, d.rep, d.other, vertices),
			r: radiusScale(d.totalVoters),
			color: blendColor(d.dem, d.rep, d.other)
		}))
	);

	// Build per-state trail paths from prior-year rows
	const trailPaths = $derived.by(() => {
		if (!trailData.length) return new Map();

		const byYear = group(trailData, (d) => d.year);
		const stateYears = new Map(); // stateId -> [{x,y}, ...]

		for (const [, yearRows] of [...byYear].sort(([a], [b]) => a - b)) {
			for (const s of groupByState(yearRows)) {
				const pts = stateYears.get(s.id) ?? [];
				pts.push(barycentricToSVG(s.dem, s.rep, s.other, vertices));
				stateYears.set(s.id, pts);
			}
		}

		return stateYears;
	});

	let hovered = $state(null);
	let tipX = $state(0);
	let tipY = $state(0);
</script>

<div class="chart-wrapper">
	<svg viewBox="0 0 {SVG_W} {SVG_H}" width="100%" style="display:block;">
		<!-- Triangle border -->
		<polygon points={trianglePoints} fill="none" stroke="#ccc" stroke-width="1.5" />

		<!-- Vertex labels -->
		<text x={vertices.other.x} y={vertices.other.y - 10} text-anchor="middle" class="vertex-label">
			Other / Unaffiliated
		</text>
		<text
			x={vertices.dem.x - 10}
			y={vertices.dem.y + 16}
			text-anchor="end"
			class="vertex-label dem"
		>
			Democratic
		</text>
		<text
			x={vertices.rep.x + 10}
			y={vertices.rep.y + 16}
			text-anchor="start"
			class="vertex-label rep"
		>
			Republican
		</text>

		<!-- Trail paths -->
		{#each statePoints as pt (pt.id)}
			{#if trailPaths.has(pt.id)}
				{@const trail = trailPaths.get(pt.id)}
				{@const allPts = [...trail, { x: pt.x, y: pt.y }]}
				<polyline
					points={allPts.map((p) => `${p.x},${p.y}`).join(' ')}
					fill="none"
					stroke={pt.color}
					stroke-width="1.5"
					stroke-opacity="0.35"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			{/if}
		{/each}

		<!-- State circles -->
		{#each statePoints as pt (pt.id)}
			<circle
				cx={pt.x}
				cy={pt.y}
				r={pt.r}
				fill={pt.color}
				fill-opacity="0.8"
				stroke="white"
				stroke-width="0.75"
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
			<!-- <text
				x={pt.x}
				y={pt.y + pt.r + 10}
				text-anchor="middle"
				class="state-label"
				pointer-events="none"
			>{pt.state}</text> -->
		{/each}
	</svg>

	{#if hovered}
		<div class="tooltip" style="left:{tipX + 14}px; top:{tipY - 8}px;">
			<strong>{hovered.state}</strong>
			<div class="rows">
				<span class="dem-label">Democratic</span><span>{(hovered.dem * 100).toFixed(1)}%</span>
				<span class="rep-label">Republican</span><span>{(hovered.rep * 100).toFixed(1)}%</span>
				<span>Other / Unaffiliated</span><span>{(hovered.other * 100).toFixed(1)}%</span>
				<span>Total voters</span><span>{hovered.totalVoters.toLocaleString()}</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.chart-wrapper {
		position: relative;
		max-width: 700px;
		margin: 0 auto;
	}

	.vertex-label {
		font-size: 13px;
		fill: #555;
		font-family: sans-serif;
	}

	.vertex-label.dem {
		fill: #0055a4;
	}
	.vertex-label.rep {
		fill: #c81e1e;
	}

	.state-label {
		font-size: 9px;
		fill: #444;
		font-family: sans-serif;
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

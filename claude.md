## Coding preferences

- Use individual d3 libraries where appropriate (e.g., instead of loading all of d3 for scales, just import `d3-scale`)

## Project overview

A series of quick chart prototypes visualizing party affiliation among US county-level voters. Data is in `src/data/county_three_parties.csv`. New chart prototypes live as components in `src/lib/components/` and are composed in `src/routes/+page.svelte`.

## Data

`src/data/county_three_parties.csv` — one row per county × party × year.

Columns: `year`, `state`, `geography_standardized` (county name), `party` (`Democratic` / `Republican` / `Other/Unaffiliated`), `total_voters`, `percent`.

- Years: 2016–2026 (11 years)
- ~1,300 counties per year, but **698 counties have incomplete year coverage** (e.g. California counties only appear in even years + 2021). Circles disappear/reappear as a result.
- The three `percent` values per county sum to ~100 but may drift slightly due to floating point — always normalize by dividing by their sum before use.

## Utilities

- `src/lib/utils/processData.js` — `groupByCounty(rows)`: pivots flat CSV rows into one object per county with `{ id, county, state, year, dem, rep, other, totalVoters }`. Fractions are already normalized (0–1).
- `src/lib/utils/ternary.js` — `barycentricToSVG(dem, rep, other, vertices)`: converts party fractions to SVG (x, y) via weighted vertex sum. `blendColor(dem, rep, other)`: returns a CSS `rgb()` string by linearly interpolating party colors (blue / red / muted purple).

## Triangle chart (`src/lib/components/Triangle.svelte`)

An equilateral triangle where each vertex = 100% affiliation with one party:
- Top: Other/Unaffiliated
- Bottom-left: Democratic
- Bottom-right: Republican

Each county is a circle placed via barycentric coordinates (weighted sum of vertex positions by party fractions). Circle area ∝ total voters (`d3-scale` `scaleSqrt`). Color = RGB blend of party colors weighted by share.

**Props:**
- `data` — flat cleaned rows for the selected year (all 3 parties per county)
- `year` — display label only; filtering happens upstream
- `globalMaxVoters` — anchors the radius scale across all years so circle sizes don't jump during animation
- `trailData` — flat cleaned rows for all years before the selected year; used to draw per-county `<polyline>` trail paths

**Animation:** `+page.svelte` holds `selectedYear` ($state), a `Slider` (bits-ui, 2016–2026), and a play/pause button. A `$effect` advances the year every 900ms when playing. Trail paths are rendered as thin polylines in each county's blended color (35% opacity) behind the circles.

## Stack

- SvelteKit 2 + Svelte 5 (runes: `$state`, `$derived`, `$derived.by`, `$effect`, `$props`)
- Vite + `@rollup/plugin-dsv` for direct CSV import
- `bits-ui` for the Slider component (requires `ssr: { noExternal: ['bits-ui'] }` in `vite.config.js`)
- `d3-array`, `d3-scale`, `d3-color`

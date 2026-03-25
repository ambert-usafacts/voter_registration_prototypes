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

- `src/lib/utils/processData.js`
  - `groupByCounty(rows)`: pivots flat CSV rows into one object per county with `{ id, county, state, year, dem, rep, other, totalVoters }`. Fractions are already normalized (0–1).
  - `groupByState(rows)`: aggregates flat CSV rows into one object per state with `{ id, state, year, dem, rep, other, totalVoters }`. Fractions are computed from summed raw voter counts (not averaged percents), so large counties are weighted correctly.
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

## State-level triangle (`src/lib/components/StateTriangle.svelte`)

Same layout as `Triangle.svelte` but each dot = one state (aggregated via `groupByState`). Circle area ∝ total state voters. State abbreviation labels rendered as SVG `<text>` below each circle (currently commented out — dots overlap at this scale). Trail paths work identically: one polyline per state showing prior-year positions.

**Props:**
- `data` — flat cleaned rows for the selected year
- `year` — display label only
- `globalMaxStateVoters` — computed on the page as `max(groupByState(cleaned_data), d => d.totalVoters)`; anchors radius scale across years
- `trailData` — flat cleaned rows for all years before the selected year

**Known issue / next step:** state dots can overlap heavily in the center of the triangle (most states are near the middle). Options to try: force-directed nudging, voronoi-based label placement, or switching to a connected-dot plot where each state is a separate line.

## Small multiples (`src/lib/components/SmallMultiples.svelte`)

Grid of small triangles, one per state (250 px wide, `auto-fill` CSS grid, no max-width). Each cell shows counties for that state. Ghost trails work identically to the main triangle.

**Props:** same as `Triangle.svelte` plus `allData` (full `cleaned_data` across all years) — used to derive the stable state list so states with no data in the selected year still render. When a state has no current-year data, circles are held at the most recent available year's positions.

## Stack

- SvelteKit 2 + Svelte 5 (runes: `$state`, `$derived`, `$derived.by`, `$effect`, `$props`)
- Vite + `@rollup/plugin-dsv` for direct CSV import
- `bits-ui` for the Slider component (requires `ssr: { noExternal: ['bits-ui'] }` in `vite.config.js`)
- `d3-array`, `d3-scale`, `d3-color`

import { group } from 'd3-array';

/**
 * Pivot flat CSV rows (one per county+party) into one object per county.
 * @param {any[]} rows - cleaned CSV rows for a single year
 * @returns {any[]} county objects with dem/rep/other fractions and totalVoters
 */
export function groupByCounty(rows) {
	const byCounty = group(rows, (d) => `${d.state}__${d.geography_standardized}`);
	const result = [];

	for (const [, partyRows] of byCounty) {
		const dem   = partyRows.find((r) => r.party === 'Democratic');
		const rep   = partyRows.find((r) => r.party === 'Republican');
		const other = partyRows.find((r) => r.party === 'Other/Unaffiliated');

		if (!dem || !rep || !other) continue;

		// Normalize to handle floating-point drift (percents may not sum to exactly 100)
		const sum = dem.percent + rep.percent + other.percent;

		result.push({
			id:          `${dem.state}__${dem.geography_standardized}`,
			county:      dem.geography_standardized,
			state:       dem.state,
			year:        dem.year,
			dem:         dem.percent / sum,
			rep:         rep.percent / sum,
			other:       other.percent / sum,
			totalVoters: dem.total_voters + rep.total_voters + other.total_voters
		});
	}

	return result;
}

/**
 * Aggregate flat CSV rows into one object per state, summing voter counts.
 * Fractions are derived from raw totals so large counties aren't double-counted.
 * @param {any[]} rows - cleaned CSV rows for a single year
 * @returns {any[]} state objects with dem/rep/other fractions and totalVoters
 */
export function groupByState(rows) {
	const byState = group(rows, (d) => d.state);
	const result  = [];

	for (const [state, stateRows] of byState) {
		const demRows   = stateRows.filter((r) => r.party === 'Democratic');
		const repRows   = stateRows.filter((r) => r.party === 'Republican');
		const otherRows = stateRows.filter((r) => r.party === 'Other/Unaffiliated');

		if (!demRows.length || !repRows.length || !otherRows.length) continue;

		const demTotal   = demRows.reduce((s, r) => s + r.total_voters, 0);
		const repTotal   = repRows.reduce((s, r) => s + r.total_voters, 0);
		const otherTotal = otherRows.reduce((s, r) => s + r.total_voters, 0);
		const total      = demTotal + repTotal + otherTotal;

		result.push({
			id:          state,
			state,
			year:        demRows[0].year,
			dem:         demTotal  / total,
			rep:         repTotal  / total,
			other:       otherTotal / total,
			totalVoters: total
		});
	}

	return result;
}

import { group } from 'd3-array';

/**
 * Pivot flat CSV rows (one per county+party) into one object per county.
 * @param {Array} rows - cleaned CSV rows for a single year
 * @returns {Array} county objects with dem/rep/other fractions and totalVoters
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

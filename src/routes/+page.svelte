<script>
	import { max } from 'd3-array';
	import data from '../data/county_three_parties.csv';
	import Triangle from '$lib/components/Triangle.svelte';

	const cleaned_data = $derived(
		data.map((d) => ({
			...d,
			year:         +d.year,
			percent:      +d.percent,
			total_voters: +d.total_voters
		}))
	);

	let selectedYear = $state(2026);

	const yearData       = $derived(cleaned_data.filter((d) => d.year === selectedYear));
	const globalMaxVoters = $derived(max(cleaned_data, (d) => d.total_voters));
</script>

<Triangle data={yearData} year={selectedYear} globalMaxVoters={globalMaxVoters} />

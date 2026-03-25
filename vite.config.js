import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import dsv from '@rollup/plugin-dsv';

export default defineConfig({
	plugins: [sveltekit(), dsv()],
	ssr: {
		noExternal: ['bits-ui']
	}
});

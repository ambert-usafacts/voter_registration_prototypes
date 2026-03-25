export const PARTY_COLORS = {
	dem:   { r: 0,   g: 85,  b: 164 },
	rep:   { r: 200, g: 30,  b: 30  },
	other: { r: 128, g: 100, b: 160 }
};

/**
 * Convert barycentric party fractions to SVG (x, y) coordinates.
 * @param {number} dem  - Democratic fraction (0–1)
 * @param {number} rep  - Republican fraction (0–1)
 * @param {number} other - Other/Unaffiliated fraction (0–1)
 * @param {{ dem: {x,y}, rep: {x,y}, other: {x,y} }} vertices
 */
export function barycentricToSVG(dem, rep, other, vertices) {
	return {
		x: dem * vertices.dem.x + rep * vertices.rep.x + other * vertices.other.x,
		y: dem * vertices.dem.y + rep * vertices.rep.y + other * vertices.other.y
	};
}

/**
 * Blend party colors by weighted RGB interpolation.
 * @param {number} dem
 * @param {number} rep
 * @param {number} other
 * @returns {string} CSS rgb() string
 */
export function blendColor(dem, rep, other) {
	const r = Math.round(dem * PARTY_COLORS.dem.r + rep * PARTY_COLORS.rep.r + other * PARTY_COLORS.other.r);
	const g = Math.round(dem * PARTY_COLORS.dem.g + rep * PARTY_COLORS.rep.g + other * PARTY_COLORS.other.g);
	const b = Math.round(dem * PARTY_COLORS.dem.b + rep * PARTY_COLORS.rep.b + other * PARTY_COLORS.other.b);
	return `rgb(${r},${g},${b})`;
}

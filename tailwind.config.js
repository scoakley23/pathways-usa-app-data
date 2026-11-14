/** @type {import('tailwindcss').Config} */
// Every color, font, radius and size comes from src/design/tokens.js (the
// Pathways + Amio style guide, docs/redesign/amio-style-guide.md). Change
// values there, not here.
const plugin = require('tailwindcss/plugin');
const {
	COLORS, HOVER, ALIASES, PW_ALIASES, FONT_STACK, TYPE, RADIUS, SIZES,
} = require('./src/design/tokens.js');

const ALL = { ...COLORS, ...HOVER };
const px = (n) => `${n}px`;
const quote = (f) => (/[\s]/.test(f) ? `"${f}"` : f);
const stack = FONT_STACK.map(quote);

// "#1E2B45" -> "219 40% 19%" for the shadcn CSS variables.
function hsl(hex) {
	const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	let h = 0;
	let s = 0;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
		h *= 60;
	}
	return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// The shadcn components (src/components/ui) read these CSS variables.
const SHADCN = {
	background: 'page',
	foreground: 'navy',
	card: 'white',
	'card-foreground': 'navy',
	popover: 'white',
	'popover-foreground': 'navy',
	primary: 'denim',
	'primary-foreground': 'white',
	secondary: 'tint',
	'secondary-foreground': 'navy',
	muted: 'tint',
	'muted-foreground': 'muted',
	accent: 'tint',
	'accent-foreground': 'navy',
	destructive: 'not-yet',
	'destructive-foreground': 'white',
	border: 'line',
	input: 'line',
	ring: 'denim',
	'chart-1': 'denim',
	'chart-2': 'gold',
	'chart-3': 'navy',
	'chart-4': 'stop-read-write',
	'chart-5': 'mid',
	'sidebar-background': 'navy',
	'sidebar-foreground': 'white',
	'sidebar-primary': 'white',
	'sidebar-primary-foreground': 'navy',
	'sidebar-accent': 'chip-navy',
	'sidebar-accent-foreground': 'white',
	'sidebar-border': 'chip-navy',
	'sidebar-ring': 'white',
};
const SHADCN_DARK = {
	...SHADCN,
	background: 'navy',
	foreground: 'white',
	card: 'chip-navy',
	'card-foreground': 'white',
	popover: 'chip-navy',
	'popover-foreground': 'white',
	primary: 'white',
	'primary-foreground': 'navy',
	secondary: 'chip-navy',
	'secondary-foreground': 'white',
	muted: 'chip-navy',
	'muted-foreground': 'on-navy',
	accent: 'chip-navy',
	'accent-foreground': 'white',
	border: 'chip-navy',
	input: 'chip-navy',
	ring: 'white',
};
const vars = (map) => Object.fromEntries(Object.entries(map).map(([k, name]) => [`--${k}`, hsl(ALL[name])]));

const resolve = (map) => Object.fromEntries(Object.entries(map).map(([k, name]) => [k, ALL[name]]));
const typeSize = ([size, line]) => [px(size), { lineHeight: px(line) }];

module.exports = {
	darkMode: ['class'],
	content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
	theme: {
		extend: {
			fontFamily: {
				sans: stack,
				heading: stack,
				body: stack,
				display: stack,
			},
			fontWeight: {
				// Lexend is loaded at 400-800, so every weight is real.
				normal: '400',
				medium: '500',
				semibold: '600',
				bold: '700',
				extrabold: '800',
				black: '800',
			},
			fontSize: {
				label: ['12px', { lineHeight: '16px', letterSpacing: '0.12em', fontWeight: '600' }],
				small: typeSize(TYPE.small),
				body: typeSize(TYPE.body),
				title: typeSize(TYPE.title),
				question: typeSize(TYPE.question),
				celebrate: typeSize(TYPE.celebrate),
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				card: px(RADIUS.card),
				button: px(RADIUS.button),
				sheet: px(RADIUS.sheet),
			},
			minHeight: {
				tap: px(SIZES.tap),
				main: px(SIZES.button),
			},
			minWidth: {
				tap: px(SIZES.tap),
			},
			boxShadow: {
				// No drop shadows on cards. The main button has a navy "lip";
				// floating layers (menus, dialogs, sheets) keep one soft shadow.
				sm: 'none',
				DEFAULT: 'none',
				md: 'none',
				lg: 'none',
				raised: 'none',
				lift: 'none',
				lip: `0 ${SIZES.lip}px 0 ${COLORS.navy}`,
				'lip-pressed': `0 1px 0 ${COLORS.navy}`,
				xl: '0 12px 32px rgba(30, 43, 69, 0.16)',
				'2xl': '0 12px 32px rgba(30, 43, 69, 0.16)',
				float: '0 12px 32px rgba(30, 43, 69, 0.16)',
			},
			colors: {
				...COLORS,
				...HOVER,
				...resolve(ALIASES),
				pw: resolve(PW_ALIASES),
				muted: {
					DEFAULT: COLORS.muted,
					foreground: 'hsl(var(--muted-foreground))',
				},
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					1: 'hsl(var(--chart-1))',
					2: 'hsl(var(--chart-2))',
					3: 'hsl(var(--chart-3))',
					4: 'hsl(var(--chart-4))',
					5: 'hsl(var(--chart-5))',
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))',
				},
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
	},
	plugins: [
		require('tailwindcss-animate'),
		// The shadcn CSS variables, generated from the tokens (no hex in CSS).
		plugin(({ addBase }) => {
			addBase({
				':root': { ...vars(SHADCN), '--radius': '1rem', '--rule': COLORS.line },
				'.dark': vars(SHADCN_DARK),
			});
		}),
	],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
    theme: {
    	extend: {
    		fontFamily: {
    			// Pathways brand type (docs/redesign/brand-spec.md)
    			sans: ['"Instrument Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
    			heading: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
    			body: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
    			display: ['"Instrument Serif"', 'Georgia', 'serif'],
    			hand: ['Caveat', 'cursive'],
    			form: ['"Courier Prime"', '"Courier New"', 'Courier', 'monospace'],
    			// The official N-400 paper-form replica keeps its own look.
    			typewriter: ['"Courier New"', 'Courier', 'monospace']
    			},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		boxShadow: {
    			// Two soft navy shadows only (style A); standard sizes map onto them.
    			sm: 'none',
    			DEFAULT: 'none',
    			md: '0 8px 24px rgba(20, 38, 74, 0.08)',
    			lg: '0 8px 24px rgba(20, 38, 74, 0.08)',
    			xl: '0 12px 32px rgba(20, 38, 74, 0.14)',
    			'2xl': '0 12px 32px rgba(20, 38, 74, 0.14)',
    			raised: '0 8px 24px rgba(20, 38, 74, 0.08)',
    			lift: '0 12px 32px rgba(20, 38, 74, 0.14)'
    		},
    		colors: {
    			// Pathways brand tokens (docs/redesign/brand-spec.md, see CLAUDE.md)
    			pw: {
    				navy: '#14264A', // Ink
    				'navy-deep': '#0F1B36', // Ink deep
    				ink: '#14264A',
    				'ink-deep': '#0F1B36',
    				red: '#D9483F', // Signal red: the dot and small decor only, never text
    				page: '#F3F5F9', // Mist
    				line: '#DEE4EE',
    				muted: '#3D4F73',
    				linen: '#ECEAE4',
    				slate: '#D5DDEA',
    				manila: '#EFDFB8', // N-400 only
    				sky: '#A9CBEC', // light blue: Writing practice and an N-400 tab; ink text only (white fails)
    				plum: '#5E4A8C', // an N-400 section tab; white text ≈ 7.4:1
    				civics: '#1F4C8F',
    				reading: '#1E6B66',
    				writing: '#2E7D4F',
    				speaking: '#B53A32',
    				soft: '#EEF2F8',
    				'soft-hover': '#E2E8F2',
    				'red-soft': '#FDECEA',
    				'red-ink': '#B53A32',
    				'red-deep': '#962E28',
    				'blue-soft': '#E6EEF9',
    				'blue-ink': '#1F4C8F',
    				'teal-soft': '#E3F2F1',
    				'teal-ink': '#1E6B66',
    				'green-soft': '#E3F4EA',
    				'green-ink': '#2E7D4F',
    				highlight: '#FFF4D6'
    			},
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			slate: {
    				50: '#F3F5F9',
    				100: '#E9EDF4',
    				200: '#DEE4EE',
    				300: '#C7D2E6',
    				400: '#7E90B5',
    				500: '#4A5A78',
    				600: '#3D4F73',
    				700: '#2C3F63',
    				800: '#14213D',
    				900: '#14264A',
    				950: '#0F1B36'
    			},
    			indigo: {
    				50: '#EDF1F9',
    				100: '#DEE7F5',
    				200: '#B9C7E2',
    				300: '#A9C4EE',
    				400: '#6E88BF',
    				500: '#3A568C',
    				600: '#1F3A6B',
    				700: '#1B3263',
    				800: '#14264A',
    				900: '#0E1830',
    				950: '#0A1122'
    			},
    			blue: {
    				50: '#EDF1F9',
    				100: '#DEE7F5',
    				200: '#B9C7E2',
    				300: '#A9C4EE',
    				400: '#6E88BF',
    				500: '#3A568C',
    				600: '#1F3A6B',
    				700: '#1B3263',
    				800: '#14264A',
    				900: '#0E1830',
    				950: '#0A1122'
    			},
    			'hero-label': '#9FB6E3',
    			'hero-muted': '#C3D0EA',
    			'road-dim': '#5F7FB8',
    			'here-label': '#FFB3AC',
    			'road-outline': '#8FA8D6',
    			red: {
    				50: '#FBEAE9',
    				100: '#F6D5D2',
    				200: '#EFB3AE',
    				300: '#E88B83',
    				400: '#E06A60',
    				500: '#D9483F',
    				600: '#C23B33',
    				700: '#A9332C',
    				800: '#8C2B25',
    				900: '#75251F',
    				950: '#4A1713'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			},
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar-background))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				primary: 'hsl(var(--sidebar-primary))',
    				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))'
    			}
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out'
    		}
    	}
    },
    plugins: [require("tailwindcss-animate")],
}

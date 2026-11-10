/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
    theme: {
    	extend: {
    		fontFamily: {
    			// "The Road" type (docs/redesign/road-style-guide.md): Inter for all UI
    			// and body text; Bricolage Grotesque 800 for headings and big numbers
    			// (`font-display`; weight and tracking set in index.css).
    			sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
    			heading: ['"Bricolage Grotesque"', 'Inter', 'system-ui', 'sans-serif'],
    			body: ['Inter', 'system-ui', 'sans-serif'],
    			display: ['"Bricolage Grotesque"', 'Inter', 'system-ui', 'sans-serif'],
    		},
    		fontWeight: {
    			// Inter is loaded at 400/500/600: bold maps to 600 so the browser
    			// never fakes a heavier weight. Headings use Bricolage 800.
    			bold: '600',
    			extrabold: '600',
    			black: '800',
    		},
    		fontSize: {
    			label: ['12px', { lineHeight: '16px', letterSpacing: '0.12em', fontWeight: '600' }],
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)',
    			card: '22px', // cards
    			sheet: '28px', // cream sheet top corners
    		},
    		minHeight: {
    			tap: '44px', // every tap target
    			main: '56px', // the one star-red main action
    		},
    		boxShadow: {
    			// No drop shadows on cards. Floating layers (menus, dialogs, sheets)
    			// keep one soft shadow so they read as above the page.
    			sm: 'none',
    			DEFAULT: 'none',
    			md: 'none',
    			lg: 'none',
    			raised: 'none',
    			lift: 'none',
    			xl: '0 12px 32px rgba(14, 27, 51, 0.16)',
    			'2xl': '0 12px 32px rgba(14, 27, 51, 0.16)',
    			float: '0 12px 32px rgba(14, 27, 51, 0.16)',
    		},
    		colors: {
    			// "The Road" palette (docs/redesign/road-style-guide.md). The hex
    			// values are mirrored in src/lib/theme.js for SVG and charts.
    			navy: {
    				DEFAULT: '#0E1B33', // top areas ("the what"), main dark buttons
    				2: '#1A2B4D', // chips/pills on navy
    				line: '#2E4470', // borders on navy
    				deep: '#08111F', // hover on navy buttons
    			},
    			road: '#22355C', // unfilled road on navy
    			cream: '#F5F3EE', // page and sheet background ("the do")
    			'card-line': '#E2DED4', // border of white cards on cream
    			sand: {
    				DEFAULT: '#E9E5DB', // "officer accepts" boxes, secondary chips on cream
    				hover: '#DDD8CB',
    			},
    			ink: {
    				DEFAULT: '#12203A', // main text on cream ("text")
    				2: '#4E5A72', // secondary text on cream ("text-2")
    				label: '#5A6680', // labels on cream
    			},
    			'on-navy': {
    				DEFAULT: '#FFFFFF',
    				2: '#C9D5EE', // secondary text on navy
    				label: '#9DB1D9', // labels on navy
    			},
    			star: {
    				DEFAULT: '#D63A30', // "you're here" and the ONE main action; never errors, never small text on cream
    				deep: '#B52F27', // hover
    			},
    			sky: '#7FA3E8', // completed stops, filled road (never with white text)
    			correct: {
    				DEFAULT: '#1E7A4F', // always with a check icon and the word "Correct"
    				soft: '#E2F0E8',
    			},
    			'not-correct': {
    				DEFAULT: '#A8460E', // always with an X icon and "Not correct"
    				text: '#943D0C', // "Not correct" heading
    				soft: '#F6E6DC',
    			},
    			// Older names, pointed at the new palette so every page follows it.
    			// Skill colors are gone: dark ones are navy, light ones are sand.
    			// Prefer the names above in new code.
    			pw: {
    				navy: '#0E1B33',
    				'navy-deep': '#08111F',
    				ink: '#12203A',
    				'ink-deep': '#08111F',
    				red: '#D63A30', // star
    				page: '#F5F3EE', // cream
    				line: '#E2DED4',
    				muted: '#4E5A72', // ink-2
    				linen: '#E9E5DB',
    				slate: '#E9E5DB',
    				manila: '#E9E5DB',
    				sky: '#E9E5DB',
    				plum: '#0E1B33',
    				go: '#1E7A4F',
    				almost: '#C9A227',
    				miss: '#A8460E',
    				rule: '#DCE3EE', // ruled-paper lines
    				margin: '#E9C9BD', // ruled-paper margin line
    				civics: '#0E1B33',
    				reading: '#0E1B33',
    				writing: '#0E1B33',
    				speaking: '#0E1B33',
    				soft: '#E9E5DB', // sand
    				'soft-hover': '#DDD8CB',
    				'red-soft': '#F6E6DC', // not-correct soft
    				'red-ink': '#A8460E', // errors, warnings, missed: not-correct
    				'red-deep': '#8A390B',
    				'blue-soft': '#E9E5DB',
    				'blue-ink': '#0E1B33',
    				'teal-soft': '#E9E5DB',
    				'teal-ink': '#0E1B33',
    				'green-soft': '#E2F0E8',
    				'green-ink': '#1E7A4F',
    				highlight: '#F3E7C4'
    			},
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
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

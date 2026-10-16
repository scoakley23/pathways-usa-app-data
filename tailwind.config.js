/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
    theme: {
    	extend: {
    		fontFamily: {
    			sans: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
    			heading: ['Manrope', 'system-ui', 'sans-serif'],
    			body: ['Manrope', 'system-ui', 'sans-serif'],
    			display: ['Manrope', 'system-ui', 'sans-serif']
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		boxShadow: {
    			sm: 'none',
    			DEFAULT: 'none',
    			md: 'none',
    			lg: 'none',
    			xl: 'none',
    			'2xl': 'none'
    		},
    		colors: {
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

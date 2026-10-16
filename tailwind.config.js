/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, `${i / 100}`])),
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
			slate: {
				50: 'rgb(var(--slate-50) / <alpha-value>)',
				100: 'rgb(var(--slate-100) / <alpha-value>)',
				200: 'rgb(var(--slate-200) / <alpha-value>)',
				300: 'rgb(var(--slate-300) / <alpha-value>)',
				400: 'rgb(var(--slate-400) / <alpha-value>)',
				500: 'rgb(var(--slate-500) / <alpha-value>)',
				600: 'rgb(var(--slate-600) / <alpha-value>)',
				700: 'rgb(var(--slate-700) / <alpha-value>)',
				800: 'rgb(var(--slate-800) / <alpha-value>)',
				900: 'rgb(var(--slate-900) / <alpha-value>)',
				950: 'rgb(var(--slate-950) / <alpha-value>)'
			},
			blue: {
				50: 'rgb(var(--blue-50) / <alpha-value>)',
				100: 'rgb(var(--blue-100) / <alpha-value>)',
				200: 'rgb(var(--blue-200) / <alpha-value>)',
				300: 'rgb(var(--blue-300) / <alpha-value>)',
				400: 'rgb(var(--blue-400) / <alpha-value>)',
				500: 'rgb(var(--blue-500) / <alpha-value>)',
				600: 'rgb(var(--blue-600) / <alpha-value>)',
				700: 'rgb(var(--blue-700) / <alpha-value>)',
				800: 'rgb(var(--blue-800) / <alpha-value>)',
				900: 'rgb(var(--blue-900) / <alpha-value>)',
				950: 'rgb(var(--blue-950) / <alpha-value>)'
			},
			amber: {
				50: 'rgb(var(--amber-50) / <alpha-value>)',
				100: 'rgb(var(--amber-100) / <alpha-value>)',
				200: 'rgb(var(--amber-200) / <alpha-value>)',
				300: 'rgb(var(--amber-300) / <alpha-value>)',
				400: 'rgb(var(--amber-400) / <alpha-value>)',
				500: 'rgb(var(--amber-500) / <alpha-value>)',
				600: 'rgb(var(--amber-600) / <alpha-value>)',
				700: 'rgb(var(--amber-700) / <alpha-value>)',
				800: 'rgb(var(--amber-800) / <alpha-value>)',
				900: 'rgb(var(--amber-900) / <alpha-value>)',
				950: 'rgb(var(--amber-950) / <alpha-value>)'
			},
			emerald: {
				50: 'rgb(var(--emerald-50) / <alpha-value>)',
				100: 'rgb(var(--emerald-100) / <alpha-value>)',
				200: 'rgb(var(--emerald-200) / <alpha-value>)',
				300: 'rgb(var(--emerald-300) / <alpha-value>)',
				400: 'rgb(var(--emerald-400) / <alpha-value>)',
				500: 'rgb(var(--emerald-500) / <alpha-value>)',
				600: 'rgb(var(--emerald-600) / <alpha-value>)',
				700: 'rgb(var(--emerald-700) / <alpha-value>)',
				800: 'rgb(var(--emerald-800) / <alpha-value>)',
				900: 'rgb(var(--emerald-900) / <alpha-value>)',
				950: 'rgb(var(--emerald-950) / <alpha-value>)'
			},
			red: {
				50: 'rgb(var(--red-50) / <alpha-value>)',
				100: 'rgb(var(--red-100) / <alpha-value>)',
				200: 'rgb(var(--red-200) / <alpha-value>)',
				300: 'rgb(var(--red-300) / <alpha-value>)',
				400: 'rgb(var(--red-400) / <alpha-value>)',
				500: 'rgb(var(--red-500) / <alpha-value>)',
				600: 'rgb(var(--red-600) / <alpha-value>)',
				700: 'rgb(var(--red-700) / <alpha-value>)',
				800: 'rgb(var(--red-800) / <alpha-value>)',
				900: 'rgb(var(--red-900) / <alpha-value>)',
				950: 'rgb(var(--red-950) / <alpha-value>)'
			},
			orange: {
				50: 'rgb(var(--orange-50) / <alpha-value>)',
				100: 'rgb(var(--orange-100) / <alpha-value>)',
				200: 'rgb(var(--orange-200) / <alpha-value>)',
				300: 'rgb(var(--orange-300) / <alpha-value>)',
				400: 'rgb(var(--orange-400) / <alpha-value>)',
				500: 'rgb(var(--orange-500) / <alpha-value>)',
				600: 'rgb(var(--orange-600) / <alpha-value>)',
				700: 'rgb(var(--orange-700) / <alpha-value>)',
				800: 'rgb(var(--orange-800) / <alpha-value>)',
				900: 'rgb(var(--orange-900) / <alpha-value>)',
				950: 'rgb(var(--orange-950) / <alpha-value>)'
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
  			vital: 'hsl(var(--vital) / <alpha-value>)',
  			amberstock: 'hsl(var(--amber) / <alpha-value>)',
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
  		fontFamily: {
  			heading: ['var(--font-heading)'],
  			body: ['var(--font-body)'],
  			display: ['var(--font-display)'],
  			mono: ['var(--font-mono)']
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
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

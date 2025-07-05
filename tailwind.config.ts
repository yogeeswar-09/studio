import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
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
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
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
  			},
        'logo-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.95' },
          '50%': { transform: 'scale(1.03)', opacity: '1' },
        },
        'text-focus-in': {
          '0%': {
            filter: 'blur(12px)',
            opacity: '0',
          },
          '100%': {
            filter: 'blur(0px)',
            opacity: '1',
          },
        },
        'shining-glow': {
          '0%, 100%': { 
            filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.7)) drop-shadow(0 0 15px hsl(var(--primary) / 0.5))', 
            opacity: '0.8' 
          },
          '50%': { 
            filter: 'drop-shadow(0 0 15px hsl(var(--primary) / 1)) drop-shadow(0 0 30px hsl(var(--primary) / 0.7))', 
            opacity: '1' 
          },
        },
        'auth-pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulsing-glow-border': {
          '0%, 100%': { boxShadow: `0 0 6px -1px hsl(var(--primary) / 0.4), 0 0 10px -3px hsl(var(--primary) / 0.2)` },
          '50%': { boxShadow: `0 0 10px 0px hsl(var(--primary) / 0.6), 0 0 16px -2px hsl(var(--primary) / 0.4)` },
        },
        'garage-door-up': {
          'from': { transform: 'translateY(0)' },
          'to': { transform: 'translateY(-100%)' },
        },
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
        'logo-pulse': 'logo-pulse 2.5s ease-in-out infinite',
        'text-focus-in': 'text-focus-in 0.8s cubic-bezier(0.550, 0.085, 0.680, 0.530) both',
        'shining-glow': 'shining-glow 2.2s ease-in-out infinite',
        'auth-pop-in': 'auth-pop-in 0.5s ease-out forwards',
        'pulsing-glow-border': 'pulsing-glow-border 3s ease-in-out infinite',
        'garage-door-up': 'garage-door-up 1s ease-in-out forwards',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'fadeIn': 'fadeIn 0.3s ease-in-out forwards',
        'fadeOut': 'fadeOut 0.3s ease-in-out forwards',
        'scaleUp': 'scaleUp 0.3s ease-in-out forwards',
        'scaleDown': 'scaleDown 0.3s ease-in-out forwards',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'loading-bar': 'loading-bar 2s ease-in-out infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-position-x': '100%',
          },
          '50%': {
            'background-position-x': '0%',
          },
        },
        'gradient-y': {
          '0%, 100%': {
            'background-position-y': '100%',
          },
          '50%': {
            'background-position-y': '0%',
          },
        },
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fadeOut': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'scaleUp': {
          '0%': { transform: 'scale(0.5)', opacity: '0.5' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'scaleDown': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.5)', opacity: '0.5' },
        },
        'loading-bar': {
          '0%': { width: '0%', opacity: '0.7' },
          '50%': { width: '70%', opacity: '1' },
          '100%': { width: '100%', opacity: '0.7' },
        },
        'pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
      },
      backgroundSize: {
        'gradient-size': '200% 200%',
      },
    },
  },
  plugins: [],
}

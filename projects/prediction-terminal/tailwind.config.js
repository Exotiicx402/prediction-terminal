/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Polymarket dark theme colors
        'poly-dark': {
          DEFAULT: '#1e2731', // Main background
          lighter: '#242d38', // Card background
          border: '#2d3a47', // Border color
          text: '#8b96a5', // Secondary text
        },
        'poly-blue': {
          DEFAULT: '#2c9ddb', // Polymarket bright blue
          light: '#5db3e5',
          dark: '#1a7eb8',
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  corePlugins: {
    // The legacy design's own CSS (bootstrap + common/main/responsive) already
    // provides resets and base element styling. Disabling Tailwind's preflight
    // keeps it from clobbering that so ported markup stays pixel-faithful.
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1890FF',
          hover: '#377DFF',
          accent: '#00ACFF',
          success: '#0ACF83',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        card: '6px',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};

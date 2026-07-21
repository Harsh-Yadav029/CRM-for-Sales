/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1d1c16",
        gold: "#e3a62f",
        "gold-soft": "#fbbb44",
        paper: "#fef9ee",
        surface: "#ffffff",
        line: "#e7e2d8",
        success: "#006e2d",
        warning: "#ba1a1a",
        danger: "#ba1a1a",
        // Stitch system colors
        stitchBackground: "#fef9ee",
        stitchOnBackground: "#1d1c16",
        stitchSurface: "#fef9ee",
        stitchSurfaceDim: "#dedad0",
        stitchSurfaceBright: "#fef9ee",
        stitchSurfaceContainerLowest: "#ffffff",
        stitchSurfaceContainerLow: "#f8f3e9",
        stitchSurfaceContainer: "#f3ede3",
        stitchSurfaceContainerHigh: "#ede8de",
        stitchSurfaceContainerHighest: "#e7e2d8",
        stitchOnSurface: "#1d1c16",
        stitchOnSurfaceVariant: "#504535",
        stitchOutline: "#827563",
        stitchOutlineVariant: "#d4c4af",
        stitchPrimary: "#7e5700",
        stitchOnPrimary: "#ffffff",
        stitchPrimaryContainer: "#e3a62f",
        stitchOnPrimaryContainer: "#5b3e00",
        stitchSecondary: "#5f5e5e",
        stitchSecondaryContainer: "#e5e2e1",
        stitchTertiary: "#006e2d",
        stitchTertiaryContainer: "#4ac86a"
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        montserrat: ['"Montserrat"', 'sans-serif'],
        accent: ['"Montserrat"', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.75rem', { lineHeight: '1rem' }],
        'xs': ['0.8125rem', { lineHeight: '1.25rem' }],
        'sm': ['0.9375rem', { lineHeight: '1.375rem' }],
        'base': ['1.0625rem', { lineHeight: '1.625rem' }],
        'lg': ['1.1875rem', { lineHeight: '1.75rem' }],
        'xl': ['1.375rem', { lineHeight: '1.875rem' }],
        '2xl': ['1.625rem', { lineHeight: '2.125rem' }],
        '3xl': ['2rem', { lineHeight: '2.375rem' }],
      },
      borderRadius: {
        btn: "10px",
        input: "10px",
        card: "14px",
        modal: "20px",
      },
      boxShadow: {
        card: "0 4px 20px rgba(18, 18, 18, 0.04)",
        "card-hover": "0 8px 30px rgba(18, 18, 18, 0.08)",
        modal: "0 10px 32px rgba(18, 18, 18, 0.08)",
      }
    },
  },
  plugins: [],
}

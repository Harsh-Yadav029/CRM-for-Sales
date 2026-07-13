/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Walk The Plan Design System — Light Corporate
        "primary": "#705d00",
        "primary-container": "#f2cc0c",
        "on-primary": "#ffffff",
        "on-primary-container": "#685700",
        "primary-fixed": "#ffe16e",
        "primary-fixed-dim": "#e9c400",
        "on-primary-fixed": "#221b00",
        "on-primary-fixed-variant": "#544600",

        "secondary": "#5e5e5e",
        "secondary-container": "#e2e2e2",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#646464",
        "secondary-fixed": "#e2e2e2",
        "secondary-fixed-dim": "#c6c6c6",
        "on-secondary-fixed": "#1b1b1b",
        "on-secondary-fixed-variant": "#474747",

        "tertiary": "#585f6c",
        "tertiary-container": "#c8cfdf",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#515866",
        "tertiary-fixed": "#dce2f3",
        "tertiary-fixed-dim": "#c0c7d6",
        "on-tertiary-fixed": "#151c27",
        "on-tertiary-fixed-variant": "#404754",

        "background": "#f8f9fa",
        "on-background": "#191c1d",
        "surface": "#f8f9fa",
        "on-surface": "#191c1d",
        "on-surface-variant": "#4d4632",
        "surface-variant": "#e1e3e4",
        "surface-bright": "#f8f9fa",
        "surface-dim": "#d9dadb",
        "surface-container": "#edeeef",
        "surface-container-low": "#f3f4f5",
        "surface-container-high": "#e7e8e9",
        "surface-container-highest": "#e1e3e4",
        "surface-container-lowest": "#ffffff",
        "surface-tint": "#705d00",

        "outline": "#7e7760",
        "outline-variant": "#d0c6ab",

        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",

        "inverse-surface": "#2e3132",
        "inverse-on-surface": "#f0f1f2",
        "inverse-primary": "#e9c400",

        // Semantic CRM colors
        "gold": "#f2cc0c",
        "gold-dark": "#705d00",
        "success": "#16a34a",
        "warning": "#d97706",
        "info": "#2563eb",
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        label: ['Hanken Grotesk', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0px 4px 20px rgba(0, 0, 0, 0.04)',
        'card-hover': '0px 8px 30px rgba(0, 0, 0, 0.08)',
        'modal': '0px 10px 32px rgba(0, 0, 0, 0.08)',
        'nav': '0px 1px 3px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}

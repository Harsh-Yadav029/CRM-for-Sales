/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#121212",
        gold: "#E3A62F",
        "gold-soft": "#FBEFD8",
        paper: "#FAF9F6",
        surface: "#FFFFFF",
        line: "#E7E2D8",
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626"
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
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

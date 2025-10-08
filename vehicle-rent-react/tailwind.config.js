/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        zoomIn: "zoomIn 0.6s ease-out",
        pulse: "pulse 2s infinite",
      },
      keyframes: {
        zoomIn: {
          "0%": { opacity: 0, transform: "translateX(-2rem) scale(0.7)" },
          "100%": { opacity: 1, transform: "translateX(0) scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

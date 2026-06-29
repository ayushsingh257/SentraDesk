/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#0B0F19",
          card: "rgba(17, 24, 39, 0.7)",
          border: "rgba(255, 255, 255, 0.08)",
          accent: "#3B82F6",
          accentHover: "#2563EB",
          text: "#F3F4F6",
          muted: "#9CA3AF"
        }
      }
    },
  },
  plugins: [],
}

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
          bg: "#060814",
          navy: "#0d1117",
          card: "rgba(13, 17, 23, 0.8)",
          border: "rgba(14, 165, 233, 0.15)",
          blue: "#0ea5e9",
          cyan: "#06b6d4",
          purple: "#7c3aed",
          violet: "#8b5cf6",
          green: "#10b981",
          red: "#ef4444",
          orange: "#f97316",
          yellow: "#eab308",
          text: "#f1f5f9",
          muted: "#64748b",
          accent: "#0ea5e9",
          glow: "rgba(14,165,233,0.4)",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "spin-slow": "spin 12s linear infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 8s ease-in-out 2s infinite",
        "scan": "scan 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "boot-blink": "blink 0.8s step-end infinite",
        "gradient-shift": "gradientShift 8s ease infinite",
        "neon-pulse": "neonPulse 2s ease-in-out infinite",
        "orbit": "orbit 20s linear infinite",
        "matrix-rain": "matrixRain 0.1s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(100vh)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        neonPulse: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(14,165,233,0.3), 0 0 20px rgba(14,165,233,0.1)" },
          "50%": { boxShadow: "0 0 20px rgba(14,165,233,0.6), 0 0 60px rgba(14,165,233,0.3)" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg) translateX(80px) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateX(80px) rotate(-360deg)" },
        },
      },
      backgroundImage: {
        "cyber-grid": "linear-gradient(rgba(14,165,233,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.03) 1px, transparent 1px)",
        "glow-radial": "radial-gradient(ellipse at center, rgba(14,165,233,0.15) 0%, transparent 70%)",
        "cyber-gradient": "linear-gradient(135deg, #060814 0%, #0d1117 50%, #060814 100%)",
      },
      backgroundSize: {
        "cyber-grid": "40px 40px",
      },
      boxShadow: {
        "neon-blue": "0 0 20px rgba(14,165,233,0.4), 0 0 60px rgba(14,165,233,0.1)",
        "neon-cyan": "0 0 20px rgba(6,182,212,0.4), 0 0 60px rgba(6,182,212,0.1)",
        "neon-purple": "0 0 20px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.1)",
        "card-glow": "0 0 0 1px rgba(14,165,233,0.15), 0 20px 60px rgba(0,0,0,0.5)",
        "inner-glow": "inset 0 0 30px rgba(14,165,233,0.05)",
      },
    },
  },
  plugins: [],
}

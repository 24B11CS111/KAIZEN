import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#0B0B0D",
        surface: "#111114",
        elevated: "#17171B",
        blood: {
          DEFAULT: "#D00000",
          50: "#ffe5e5",
          400: "#ff3333",
          500: "#D00000",
          600: "#a80000",
          700: "#7a0000"
        },
        glass: "rgba(255,255,255,0.04)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"]
      },
      backdropBlur: {
        xs: "2px"
      },
      boxShadow: {
        blood: "0 0 24px rgba(208,0,0,0.45), 0 0 4px rgba(208,0,0,0.6)",
        "blood-lg": "0 0 60px rgba(208,0,0,0.55), 0 0 8px rgba(208,0,0,0.7)",
        glass: "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.6)"
      },
      keyframes: {
        pulseRed: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(208,0,0,0.5)" },
          "50%": { boxShadow: "0 0 0 16px rgba(208,0,0,0)" }
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" }
        },
        gateOpen: {
          "0%": { transform: "scaleY(1)", opacity: "1" },
          "100%": { transform: "scaleY(0)", opacity: "0" }
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" }
        },
        flameRise: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-2px) scale(1.05)" }
        }
      },
      animation: {
        pulseRed: "pulseRed 2.4s ease-out infinite",
        scanline: "scanline 4s linear infinite",
        gateOpen: "gateOpen 1.6s cubic-bezier(0.83,0,0.17,1) forwards",
        flicker: "flicker 3s ease-in-out infinite",
        flameRise: "flameRise 1.8s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;

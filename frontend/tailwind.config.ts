import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50:  "#FAF6EF",
          100: "#F4EEE1",
          200: "#EDE4D3",
          300: "#E4D8C2",
          400: "#DCD0B8",
        },
        ink: {
          DEFAULT: "#241C14",
          body:    "#5B5044",
          muted:   "#8A7D6B",
        },
        teal: {
          DEFAULT: "#1B4A4A",
          light:   "#2A6E6E",
          dark:    "#123333",
        },
        terra: {
          DEFAULT: "#C1531A",
          light:   "#D96830",
          dark:    "#8A3512",
          tint:    "#FBEADF",
        },
      },
      fontFamily: {
        sans:    ["var(--font-work-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      animation: {
        "bounce-in": "bounceIn 0.4s ease-out",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        bounceIn: {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "60%": { transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

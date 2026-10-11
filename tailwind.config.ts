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
        // Exact Journeymen Collective brand palette
        background: "#040d1c",
        surface: "#08254D",
        "surface-2": "#0a2a58",
        "surface-hover": "#0d3268",
        border: "#0f3a78",
        "border-subtle": "rgba(194,159,96,0.15)",
        navy: {
          DEFAULT: "#053372",
          dark: "#08254D",
        },
        gold: {
          DEFAULT: "#C29F60",
          light: "#D4B47A",
          dark: "#A8883F",
        },
        green: {
          DEFAULT: "#1D7458",
          dark: "#0B4B32",
        },
        cream: "#DED3C8",
        muted: "rgba(222,211,200,0.5)",
      },
      fontFamily: {
        sans: ["Avenir", "Century Gothic", "Nunito", "system-ui", "sans-serif"],
        serif: ['"Noto Serif Display"', "Georgia", "serif"],
        display: ["Syne", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

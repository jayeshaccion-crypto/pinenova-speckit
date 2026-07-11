import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#2F6B3B", light: "#3D8A4E", dark: "#1F4727" },
        secondary: { DEFAULT: "#8AAE5D", light: "#A3C97A", dark: "#6D8F47" },
        accent: { DEFAULT: "#D6C28F", light: "#E3D4A8", dark: "#C4A96A" },
        background: "#FAFAF7",
        foreground: "#1A1A1A",
      },
      borderRadius: { DEFAULT: "12px" },
      spacing: {
        "1": "8px",
        "2": "16px",
        "3": "24px",
        "4": "32px",
        "5": "40px",
        "6": "48px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

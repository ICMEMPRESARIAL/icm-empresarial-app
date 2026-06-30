import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "#d8e0ea",
        surface: "#f4f7fb",
        ink: "#172033",
        muted: "#667085",
        brand: "#1f4f8f",
        success: "#047857",
        warning: "#b45309",
        danger: "#b42318"
      },
      boxShadow: {
        soft: "0 12px 32px rgba(16, 24, 40, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

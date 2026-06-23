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
        border: "#d7dde5",
        surface: "#f7f8fa",
        ink: "#172033",
        muted: "#667085",
        brand: "#1f4f8f"
      }
    }
  },
  plugins: []
};

export default config;

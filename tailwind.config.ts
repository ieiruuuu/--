import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        mist: "#e8edf2",
        dusk: "#f5d7d7",
        blush: "#fef2f2"
      },
      boxShadow: {
        card: "0 18px 60px -30px rgba(0,0,0,0.35)"
      }
    }
  },
  plugins: []
};

export default config;


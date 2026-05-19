import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0b",
        panel: "#111114",
        panel2: "#16161a",
        border: "#26262c",
        muted: "#8a8a93",
        text: "#e8e8ea",
        brand: { DEFAULT: "#f59e0b", soft: "#fbbf2433", glow: "#f59e0bcc" },
        accent: "#ef7c1a",
        success: "#22c55e",
        danger: "#ef4444",
      },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui"] },
      boxShadow: { glow: "0 0 0 1px #f59e0b33, 0 8px 32px -8px #f59e0b55" },
    },
  },
  plugins: [],
};
export default config;

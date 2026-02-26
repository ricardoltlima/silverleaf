import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#eef6ef",
          100: "#d8eadb",
          600: "#2f6b45",
          700: "#245437",
          900: "#163124"
        }
      }
    }
  },
  plugins: []
} satisfies Config;

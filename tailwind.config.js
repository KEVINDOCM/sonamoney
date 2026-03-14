/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#fefdf0",
          100: "#fdf8d0",
          200: "#faf0a0",
          300: "#f5e060",
          400: "#ecc820",
          500: "#D4A017",
          600: "#B8860B",
          700: "#9a6e08",
          800: "#7a5606",
          900: "#5c4004",
          950: "#3d2a02",
        },
        brand: {
          primary:       "#00B9A7",
          primaryDark:   "#0099A0",
          primaryLight:  "#E6F7F6",
          expense:       "#FF5B5B",
          expenseLight:  "#FFF0F0",
          income:        "#00C48C",
          incomeLight:   "#E6FAF4",
          warning:       "#FFB800",
          warningLight:  "#FFF8E6",
          bg:            "#F5F7FA",
          card:          "#FFFFFF",
          textPrimary:   "#1A1A2E",
          textSecondary: "#6B7280",
        },
      },
    },
  },
  plugins: [],
};


/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
  extend: {
    colors: {
      darkblue: {
        50: "#eff6ff",
        100: "#dbeafe",
        200: "#bfdbfe",
        300: "#93c5fd",
        400: "#60a5fa",
        500: "#3b82f6",
        600: "#143447", // your color
        700: "#102c3c",
        800: "#0c2330",
        900: "#081b25",
      },
    },
  },
},
  plugins: []
};

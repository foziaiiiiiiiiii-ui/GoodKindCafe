/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geltek", "Arial Black", "sans-serif"],
      },
      letterSpacing: {
        tighter: "-0.065em",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Hemos añadido "./src/**/*.{js,jsx,ts,tsx}" y "./app/**/*.{js,jsx,ts,tsx}"
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}", 
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        heading: ["PlusJakartaSans-Bold"],
        body: ["Inter-Regular"],
      },
    },
  },
  plugins: [],
};

// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        skin: {
          bg: "var(--color-bg)",
          panel: "var(--color-panel)",
          title: "var(--color-title)",
          subtitle: "var(--color-subtitle)",
          input: "var(--color-input)",
        },
      },
    },
  },
  plugins: [],
}

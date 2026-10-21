/** @type {import('tailwindcss').Config} */
export default {
  // One consistent light theme: `dark:` variants only apply under a `.dark` class, which the app never sets,
  // so an OS-level dark preference can no longer mix dark cards with light pages.
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

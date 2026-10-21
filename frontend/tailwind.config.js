/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Catppuccin Frappé (dark)
        frappe: {
          base: '#303446',
          mantle: '#292c3c',
          crust: '#232634',
          surface0: '#414559',
          surface1: '#51576d',
          surface2: '#626880',
          overlay0: '#737994',
          overlay1: '#838ba7',
          overlay2: '#949cbb',
          subtext0: '#a5adce',
          subtext1: '#b5bfe2',
          text: '#c6d0f5',
          lavender: '#babbf1',
          blue: '#8caaee',
          sapphire: '#85c1dc',
          sky: '#99d1db',
          teal: '#81c8be',
          green: '#a6d189',
          yellow: '#e5c890',
          peach: '#ef9f76',
          mauve: '#ca9ee6',
          red: '#e78284',
          maroon: '#ea999c',
          pink: '#f4b8e4',
          flamingo: '#eebebe',
          rosewater: '#f2d5cf',
        },
        // Catppuccin Latte (light)
        latte: {
          base: '#eff1f5',
          mantle: '#e6e9ef',
          crust: '#dce0e8',
          surface0: '#ccd0da',
          surface1: '#bcc0cc',
          surface2: '#acb0be',
          text: '#4c4f69',
          subtext0: '#6c6f85',
          subtext1: '#5c5f77',
          overlay0: '#9ca0b0',
          blue: '#1e66f5',
          lavender: '#7287fd',
          mauve: '#8839ef',
          green: '#40a02b',
          yellow: '#df8e1d',
          peach: '#fe640b',
          red: '#d20f39',
          teal: '#179299',
          sky: '#04a5e5',
          sapphire: '#209fb5',
          maroon: '#e64553',
          pink: '#ea76cb',
        },
      },
      fontFamily: {
        notebook: ['"Caveat"', '"Patrick Hand"', 'cursive'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'notebook-lines': `repeating-linear-gradient(
          transparent,
          transparent 27px,
          #c6d0f520 28px
        )`,
        'notebook-lines-light': `repeating-linear-gradient(
          transparent,
          transparent 27px,
          #4c4f6915 28px
        )`,
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF8F4',
        paper: '#FFFDF8',
        beige: '#EDE5DA',
        taupe: '#B8A99A',
        'muted-brown': '#756558',
        espresso: '#332C27',
        charcoal: '#49433E',
        sage: '#DCE5D9',
        'sage-dark': '#8A9A86',
        'dusty-rose': '#EEDDDC',
        'dusty-rose-dark': '#B88E8B',
        butter: '#F3E9B8',
        'butter-dark': '#BDB068',
        'subtle-border': '#E8E1D8',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Lora', 'Georgia', 'serif'],
        handwriting: ['"Caveat"', 'cursive'],
        patrick: ['"Patrick Hand"', 'cursive'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'paper': '0 4px 20px -2px rgba(51, 44, 39, 0.05), 0 2px 6px -1px rgba(51, 44, 39, 0.03)',
        'book': '0 20px 40px -15px rgba(51, 44, 39, 0.15), 0 0 20px -5px rgba(51, 44, 39, 0.05)',
        'polaroid': '0 10px 25px -5px rgba(51, 44, 39, 0.12), 0 4px 10px -2px rgba(51, 44, 39, 0.06)',
        'subtle': '0 1px 3px 0 rgba(51, 44, 39, 0.04)',
      }
    },
  },
  plugins: [],
}

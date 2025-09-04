/** @type {import('tailwindcss').Config} */
export default {
  content: [    
    './resources/**/*.blade.php',
    './resources/**/*.js',
    './resources/**/*.jsx',],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        secondary: '#111827',
        tertiary: '#374151',
        quaternary: '#6B7280',
        quinary: '#9CA3AF',
        senary: '#D1D5DB',
      },
    },
  },
  plugins: [],
}


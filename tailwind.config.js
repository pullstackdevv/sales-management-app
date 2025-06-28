/** @type {import('tailwindcss').Config} */
export default {
    content: [
      './resources/**/*.blade.php',
      './resources/**/*.js',
      './resources/**/*.jsx',
    ],
    theme: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'serif'], // Define a custom sans-serif font family
      },
      extend: {
        colors: {
          primary: '#1e40af',
          secondary: '#3b82f6',
        },
      },
    },

  }
  
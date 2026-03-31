/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1A1A1A', // Dark mode background, primary surfaces.
        secondary: '#2C2C2C', // Card backgrounds, secondary sections.
        'text-light': '#FFFFFF', // Main text, headings.
        'text-dark': '#B0B0B0', // Subheadings, descriptions, inactive states.
        accent: '#C5A35A', // Call-to-action buttons, highlights, important icons.
        nude: '#E0DCD7', // Subtle highlights, selected states, secondary buttons.
        error: '#FF4D4D', // Error messages, destructive actions.
        success: '#4CAF50', // Success messages, positive feedback.
        border: '#444444', // Border colors
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'], // Headings
        body: ['Inter', 'sans-serif'], // Body text
      },
    },
  },
  plugins: [],
};

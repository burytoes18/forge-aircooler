/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F5F1EA',
        ink: '#1A1814',
        muted: '#6B655B',
        rule: '#D8D0C2',
        accent: '#B5532C',
        verified: '#3D6B4E',
        estimate: '#7A6420',
        assumption: '#5A6379',
        unverified: '#8B5A2B',
        expert: '#9C3A1F',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        body: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

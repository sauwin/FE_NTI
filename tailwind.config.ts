import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        nti: {
          // surfaces
          background: '#020617', // slate-950
          surface: '#0f172a', // slate-900
          surfaceSoft: '#111827',

          // borders
          border: '#1e293b', // slate-800
          borderStrong: '#1d4ed8', // blue-700/800 vibe

          // text
          text: {
            primary: '#ffffff',
            secondary: '#cbd5e1',
            muted: '#64748b',
          },

          // brand
          primary: {
            DEFAULT: '#2563eb', // blue-600
            hover: '#3b82f6',   // blue-500
            soft: 'rgb(37 99 235 / 0.15)',
          },

          // status
          danger: '#f87171',
        }
      },
    },
  },
  plugins: [],
}

export default config

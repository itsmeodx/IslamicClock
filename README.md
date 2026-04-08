# Modern Islamic Prayer Clock

A continuous, cyclical analog prayer clock built with React, Vite, and Tailwind CSS.

This project was completely refactored from a vanilla HTML/JS setup to a modern, maintainable component-driven architecture, designed specifically to be hosted on GitHub Pages.

## Core Features

1. **Continuous Cyclical Dial**: Unlike standard 12-hour clocks, this application maps time onto a 24-hour sun/moon orbital track. The locations of Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha, and Midnight are dynamically plotted based on exact mathematical calculation using the Aladhan API.
2. **Glassmorphism Aesthetic**: Beautiful, premium frosted-glass UI floating over a dynamic background.
3. **PWA Support**: Installable on Android and iOS devices.
4. **No Dependencies on Axios**: Uses pure native `fetch` for all API calls to keep bundle sizes minimal.
5. **Caching System**: Caches Aladhan API responses in `localStorage` for 24 hours to reduce network requests.

## Component Architecture

- `src/components/AnalogClock.jsx`: Renders the orbital path and the 9 key astronomical markers.
- `src/hooks/usePrayerTimes.js`: Handles caching, geographical location, and fetching exact timings from `api.aladhan.com`.
- `src/utils/translations.js`: Comprehensive English & Arabic localization.

## Deployment to GitHub Pages

This repository is configured to deploy automatically to GitHub Pages using GitHub Actions (`.github/workflows/deploy.yml`).

1. The Vite configuration is set with `base: '/IslamicClock/'`.
2. Ensure that in your GitHub Repository settings, **Pages -> Build and deployment -> Source** is set to **GitHub Actions**.

## Scripts

- `npm run dev` - Starts local development server.
- `npm run build` - Builds for production.

## Best Practices Implemented

- Strict ES Modules usage.
- Native APIs over bloated 3rd party packages.
- Caching to prevent hitting HTTP rate limits.
- Precise SVG drawing mathematics vs computationally heavy 2D Canvas redraws.

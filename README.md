# Modern Islamic Prayer Clock

A continuous, cyclical analog prayer clock built with React, Vite, and Tailwind CSS.

This project was completely refactored from a vanilla HTML/JS setup to a modern, maintainable component-driven architecture, designed specifically to be hosted on GitHub Pages.

## Core Features

1. **Continuous Cyclical Dial**: Unlike standard 12-hour clocks, this application maps time onto a 24-hour sun/moon orbital track. The locations of Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha, and Midnight are dynamically plotted based on exact mathematical calculation using the Aladhan API.
2. **Glassmorphism Aesthetic**: Beautiful, premium frosted-glass UI floating over a dynamic background.
3. **PWA Support**: Installable on Android and iOS devices.
4. **Browser Extension**: Use it as a beautiful "New Tab" page.

## Quick Download

[<img src="https://lh4.ggpht.com/x-plP9YZXhCaiDkTKQ5S29PwLmdi4feEKrMOtQle4NuoOaUgKUMH9pPWIg91da3anhSmw-G8erEIuU0d" width="128" alt="Google Chrome" title="Download for Google Chrome">](https://github.com/itsmeodx/IslamicClock/releases/download/latest/chrome.zip)
[<img src="https://www.mozilla.org/media/img/structured-data/logo-firefox-browser.fbc7ffbb50fd.png" width="128" alt="Mozilla Firefox" title="Download for Mozilla Firefox">](https://github.com/itsmeodx/IslamicClock/releases/download/latest/firefox.xpi)

- **Chrome/Edge/Brave**: Click the icon above to **Download the ZIP**, then extract it and select **"Load unpacked"** in `chrome://extensions`.
- **Firefox**: Click the icon above for **Instant Installation**, or go to [releases](https://github.com/itsmeodx/IslamicClock/releases), download the XPI file and drag it into any open Firefox window.

## Component Architecture

- `src/components/AnalogClock.jsx`: Renders the orbital path and the 9 key astronomical markers.
- `src/hooks/usePrayerTimes.js`: Handles caching, geographical location, and fetching exact timings from `api.aladhan.com`.
- `src/utils/translations.js`: Comprehensive English & Arabic localization.

## Deployment

This repository is configured to deploy automatically to GitHub Pages using a consolidated CI/CD pipeline (`.github/workflows/main.yml`).

1. The Vite configuration is set with `base: '/IslamicClock/'`.
2. Ensure that in your GitHub Repository settings, **Pages -> Build and deployment -> Source** is set to **GitHub Actions**.

## Scripts

- `pnpm dev` - Starts local development server.
- `pnpm build` - Builds for production.
- `pnpm build:extension` - Builds the browser extension version.
- `pnpm lint` - Runs ESLint.
- `pnpm typecheck` - Runs TypeScript type checking.

## Best Practices Implemented

- Strict ES Modules usage.
- Native APIs over bloated 3rd party packages.
- Caching to prevent hitting HTTP rate limits.
- Precise SVG drawing mathematics vs computationally heavy 2D Canvas redraws.

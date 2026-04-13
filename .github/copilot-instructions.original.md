# Project Guidelines

## Build and Test
- Install dependencies with `pnpm install`.
- Primary commands:
  - `pnpm run dev` for local development.
  - `pnpm build` for production web bundle.
  - `pnpm run build:extension` to generate browser-extension artifacts.
  - `pnpm test` for tests.
  - `pnpm lint` after code changes.
  - `pnpm typecheck` for TypeScript validation.
- Prefer running focused checks first, then `pnpm lint` before finishing changes.

## Architecture
- React app entry is `src/main.jsx` with Query client + persistence setup.
- Global clock/location/settings state lives in `src/context/ClockContext.jsx`.
- Use `src/hooks/useClock.js` to consume context. Components using it must remain under `ClockProvider`.
- Prayer-time fetching and geocoding logic lives in `src/hooks/usePrayerTimes.js`.
- UI components live in `src/components/`; keep network/data orchestration in hooks/context instead of presentational components.

## Conventions
- Use path alias `@/*` for imports from `src/*` where practical.
- Keep generated output out of hand edits:
  - `extension-dist/**` is build output.
- Keep utility logic in `src/utils/` and cover pure logic with Node tests (example: `src/utils/timeMath.test.js`).

## Critical Gotchas
- Do not change Vite `base` in `vite.config.js` without confirming GitHub Pages deploy path expectations.
- `useClock` throws outside provider; preserve provider boundaries when refactoring layout trees.

## References
- For installation, release links, and full build details, see `README.md`.

# Project Guidelines

## Build and Test
- Install dependencies with `pnpm install`.
- Primary commands:
  - `pnpm run dev` local dev.
  - `pnpm build` prod web bundle.
  - `pnpm run build:extension` build browser-extension artifacts.
  - `pnpm test` run tests.
  - `pnpm lint` after code changes.
  - `pnpm typecheck` TypeScript validation.
- Run focused checks first, then `pnpm lint` before finish.

## Architecture
- React entry `src/main.jsx` set Query client + persistence.
- Global clock/location/settings state in `src/context/ClockContext.jsx`.
- Use `src/hooks/useClock.js` for context. Components using it stay under `ClockProvider`.
- Prayer-time fetch + geocoding logic in `src/hooks/usePrayerTimes.js`.
- UI components in `src/components/`; keep network/data orchestration in hooks/context, not presentational components.

## Conventions
- Use path alias `@/*` for imports from `src/*` when practical.
- Keep generated output out of hand edits:
  - `extension-dist/**` is build output.
- Keep utility logic in `src/utils/` and cover pure logic with Node tests (example: `src/utils/timeMath.test.js`).

## Critical Gotchas
- Do not change Vite `base` in `vite.config.js` without confirming GitHub Pages deploy path expectations.
- `useClock` throws outside provider; keep provider boundaries when refactoring layout trees.

## References
- For installation, release links, and full build details, see `README.md`.

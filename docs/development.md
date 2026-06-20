# Development

## Prerequisites

- [Node.js](https://nodejs.org/) v20+ (CI uses Node 24)
- [pnpm](https://pnpm.io/) — pinned via `packageManager` in
  [package.json](../package.json)

## Setup

```bash
git clone https://github.com/itsmeodx/IslamicClock.git
cd IslamicClock
pnpm install
pnpm run dev          # Vite dev server with HMR
```

## Scripts

| Command                             | What it does                                             |
| :---------------------------------- | :------------------------------------------------------- |
| `pnpm dev`                          | Start the Vite dev server.                               |
| `pnpm build`                        | Production web build to `dist/` (base `/IslamicClock/`). |
| `pnpm preview`                      | Serve the production build locally.                      |
| `pnpm lint`                         | ESLint over the repo.                                    |
| `pnpm typecheck`                    | `tsc -b` (type-checks JS via JSDoc; `checkJs` is off).   |
| `pnpm test`                         | Run unit tests with the built-in Node test runner.       |
| `pnpm format` / `pnpm format:check` | Prettier write / check.                                  |
| `pnpm build:extension`              | Build + package Chrome `.zip` and Firefox `.xpi`.        |
| `pnpm sign:firefox`                 | Sign the Firefox build for listed (AMO) distribution.    |
| `pnpm sign:firefox:unlisted`        | Sign for unlisted/self-hosted distribution.              |

Extension and signing details: [scripts/build-extension.sh](../scripts/build-extension.sh)
and [Firefox Signing](./firefox-signing.md).

## Tooling & conventions

- **ESLint** ([eslint.config.js](../eslint.config.js)) — JS/JSX with the React
  Hooks and React Refresh plugins, browser globals, and `eslint-config-prettier`
  to avoid formatting conflicts. Ignores `dist`, `extension-dist`,
  `legacy_backup`.
- **Prettier** ([.prettierrc](../.prettierrc)) — semicolons, double quotes,
  trailing commas, `printWidth: 80`, `tabWidth: 2`.
- **TypeScript** ([tsconfig.json](../tsconfig.json)) — ESNext + DOM libs, bundler
  resolution, `react-jsx`, path alias `@/*` → `src/*`. The project is JS; `tsc` is
  used for light JSDoc checking only.

## Theming

Styling is Tailwind CSS v4 with custom design tokens declared in an `@theme` block
in [src/index.css](../src/index.css). The palette is the "heritage" set:

| Token                     | Value                | Use                          |
| :------------------------ | :------------------- | :--------------------------- |
| `--color-heritage-indigo` | `#0a1128`            | dark base                    |
| `--color-heritage-bg`     | `#0b1120`            | body background              |
| `--color-heritage-amber`  | `#ff9f1c`            | primary accent / interactive |
| `--color-heritage-gold`   | `#ffd700`            | highlight / hover            |
| `--color-heritage-green`  | `#166534`            | secondary accent             |
| `--color-heritage-glass`  | `rgba(10,25,47,0.4)` | glass overlay                |

Fonts: `--font-main` is **Alexandria** (covers Arabic), `--font-numbers` is
**Tenor Sans** (applied via the `.tabular-nums` class for aligned digits).

Reusable utility classes defined in the same file:

- `.heritage-card` — the frosted-glass card (blur, translucent border, inner glow).
- `.heritage-button` — amber call-to-action with hover/active scale.
- `.heritage-input` — translucent input with amber focus ring.
- `.heritage-gradient-text` — white→gold clipped gradient text.
- `.geometric-bg` — repeating Islamic diamond SVG pattern (decorative, used at low
  opacity behind cards).
- `.custom-scrollbar` — thin amber scrollbar.

RTL is handled at the component level via the `dir` attribute (set from
`settings.language`) rather than CSS direction utilities; some components (e.g. the
`SettingsPanel` slide direction) branch on language explicitly.

## Testing

Tests use the **built-in Node test runner** (`node --test`), no extra framework.
The current suite covers the dial math:

- [src/utils/timeMath.test.js](../src/utils/timeMath.test.js) — prayer→angle math,
  wrap-around, grace period.

Run everything with `pnpm test`. Per project convention, add tests when changing
the math in `timeMath.js`.

## CI/CD

Two workflows split CI from releases:

- **[ci.yml](../.github/workflows/ci.yml)** runs on push/PR to `main` and manual
  dispatch:
  1. **verify** — lint + typecheck.
  2. **deploy** — build and publish `dist/` to GitHub Pages (push to `main` /
     dispatch only).
- **[release.yml](../.github/workflows/release.yml)** runs only when a `v*` tag is
  pushed: it asserts the tag matches `package.json`, builds the extensions, submits
  the listed Firefox build to AMO, and creates a draft GitHub Release with the
  Chrome `.zip` and Firefox `.xpi`.

A plain commit to `main` deploys the web app but does **not** cut a release —
releases are triggered by tags. See [Versioning](./versioning.md) for the
`pnpm version` release flow and [Firefox Signing](./firefox-signing.md) for the
AMO credentials the release job needs (GitHub environment `firefox-signing`).

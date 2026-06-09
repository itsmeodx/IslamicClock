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
The current suite covers the dial math and the CI versioning script:

- [src/utils/timeMath.test.js](../src/utils/timeMath.test.js) — prayer→angle math,
  wrap-around, grace period.
- [scripts/set-ci-version.test.mjs](../scripts/set-ci-version.test.mjs) — the
  version-derivation algorithm.

Run everything with `pnpm test`. Per project convention, add tests when changing
the math in `timeMath.js` or the versioning logic.

## CI/CD

[.github/workflows/main.yml](../.github/workflows/main.yml) runs on push/PR to
`main`:

1. **verify** — lint + typecheck.
2. **deploy** — build and publish `dist/` to GitHub Pages.
3. **package** — derive the release version
   ([set-ci-version.sh](../scripts/set-ci-version.sh)), build the extensions, sign
   & submit the Firefox build to AMO when a new version is due, and create a
   GitHub Release with the Chrome `.zip` and Firefox `.xpi`.

See [Versioning](./versioning.md) for how the release number is computed and
[Firefox Signing](./firefox-signing.md) for the AMO credentials the `package` job
needs (GitHub environment `firefox-signing`).

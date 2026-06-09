# Architecture

Islamic Clock is a single-page React application with no backend of its own. It
fetches prayer data from public APIs, caches it aggressively in `localStorage`,
and renders a continuous astronomical dial. The same build ships three ways:

- A **web app / PWA** hosted on GitHub Pages.
- A **Chrome/Edge/Brave extension** that overrides the New Tab page.
- A **Firefox extension** (signed via AMO) that does the same.

## Tech stack

| Layer                 | Choice                                                                   |
| :-------------------- | :----------------------------------------------------------------------- |
| UI                    | React 19                                                                 |
| Build                 | Vite 8 + `@vitejs/plugin-react`                                          |
| Styling               | Tailwind CSS v4 (`@tailwindcss/vite`) with custom `@theme` tokens        |
| Data fetching / cache | TanStack Query v5, persisted to `localStorage`                           |
| Animation             | Framer Motion (modals) + `requestAnimationFrame` (the dial hand)         |
| Icons                 | `lucide-react`                                                           |
| Dates                 | `date-fns` (available; most formatting uses native `toLocaleDateString`) |
| PWA                   | `vite-plugin-pwa` (Workbox, `autoUpdate`)                                |
| Package manager       | pnpm                                                                     |

## Component / data-flow diagram

```text
main.jsx
 ├─ QueryClientProvider          ← TanStack Query, persisted to localStorage
 │   └─ persistQueryClient        (key: REACT_QUERY_OFFLINE_CACHE)
 └─ ErrorBoundary
     └─ ClockProvider            ← settings + live 1s clock tick
         │   └─ usePrayerTimes() ← location state + Aladhan monthly fetch
         └─ App
             ├─ LocationRequest  (shown until a location is set)
             ├─ AnalogClock | DigitalClock
             ├─ NextPrayerCard
             ├─ DateDisplay
             └─ SettingsPanel
```

Every consumer reads shared state through the [`useClock`](../src/hooks/useClock.js)
hook, which is a thin wrapper over `useContext(ClockContext)` that throws if used
outside the provider.

## State management

State is split across two layers by concern:

### `ClockContext` — settings and the wall clock

[src/context/ClockContext.jsx](../src/context/ClockContext.jsx) owns:

- **`settings`** — language, clock mode, calculation method, and the offset
  values (see [Configuration](./configuration.md)). Initialized from
  `localStorage["heritage-settings"]` and written back on every change via a
  `useEffect`.
- **`currentTime`** — a `Date` updated every second by a `setInterval`. This tick
  drives the countdown and the smooth movement of the dial hand.
- **`updateSettings(partial)`** — shallow-merges into settings.
- **`resetSettings()`** — clears `localStorage` and reloads the page.

It delegates all location/prayer concerns to `usePrayerTimes(settings)` and
re-exposes that hook's return values on the same context object, so consumers see
one flat API.

### `usePrayerTimes` — location and prayer data

[src/hooks/usePrayerTimes.js](../src/hooks/usePrayerTimes.js) owns:

- **`location`** — `{ lat, lng, name }`, initialized from
  `localStorage["last-known-location"]`.
- **`permissionStatus`** — `"prompt" | "granted" | "denied"`. Drives whether
  `App` shows the location request screen or the clock.
- **`date`** — a `Date` updated once a minute, but only when the calendar day
  changes; this is what keys the monthly query so the displayed day rolls over at
  midnight.
- The **TanStack Query** that fetches a full month of prayer times from Aladhan
  (see [External APIs](./external-apis.md)).

The hook exposes `requestLocation` (browser geolocation), `setManualLocation`
(from city search), `resetLocation`, and `refresh` (refetch).

## Persistence

Three independent `localStorage` keys:

| Key                         | Owner                | Contents                                            |
| :-------------------------- | :------------------- | :-------------------------------------------------- |
| `heritage-settings`         | `ClockContext`       | The full settings object.                           |
| `last-known-location`       | `usePrayerTimes`     | `{ lat, lng, name }`.                               |
| `REACT_QUERY_OFFLINE_CACHE` | `persistQueryClient` | The serialized query cache (fetched prayer months). |

Because the query cache is persisted and prayer data has a 24-hour `staleTime`,
the app renders instantly and works **fully offline** after the first successful
fetch for a given month and location.

## Offline & freshness strategy

- **Monthly fetches, not daily.** One Aladhan call returns the whole month, so
  navigating days never refetches.
- **`staleTime: 24h`** on the prayer query (and 1h default for everything else,
  set in [main.jsx](../src/main.jsx)).
- **Prefetch.** After the 20th of the month, `usePrayerTimes` prefetches next
  month so the rollover is seamless.
- **Workbox precache.** `vite-plugin-pwa` precaches the JS/CSS/HTML/icons so the
  shell loads with no network.

## PWA & extension packaging

- **PWA:** configured in [vite.config.js](../vite.config.js) — `registerType:
"autoUpdate"`, a web manifest, and Workbox `globPatterns` covering the build
  output. `base` is `/IslamicClock/` for GitHub Pages.
- **Extensions:** [scripts/build-extension.sh](../scripts/build-extension.sh)
  rebuilds with `--base ./` (relative paths, required for the extension origin),
  then writes a Manifest V3 `manifest.json` for Chrome and Firefox that overrides
  `newtab`. Both declare **zero permissions**; Firefox additionally declares
  `data_collection_permissions: none`. See [Development](./development.md) for the
  build commands and [Firefox Signing](./firefox-signing.md) for AMO.

## Project layout

```text
src/
├── main.jsx                  App bootstrap: providers, persistence, error boundary
├── App.jsx                   Layout + routing between location screen and clock
├── index.css                 Tailwind v4 @theme tokens + heritage-* utility classes
├── context/
│   └── ClockContext.jsx      Settings + wall-clock state provider
├── hooks/
│   ├── useClock.js           Context accessor (throws if outside provider)
│   └── usePrayerTimes.js     Location + Aladhan monthly query
├── components/
│   ├── AnalogClock.jsx       The astronomical dial (SVG)
│   ├── DigitalClock.jsx      24h time + 5 prayer cards
│   ├── NextPrayerCard.jsx    Next prayer + countdown
│   ├── DateDisplay.jsx       Hijri + Gregorian dates
│   ├── SettingsPanel.jsx     Slide-in settings drawer
│   ├── LocationRequest.jsx   Geolocation prompt + city search
│   ├── ConfirmationModal.jsx Reusable confirm dialog (Framer Motion)
│   ├── ErrorBoundary.jsx     Top-level crash guard
│   ├── common/HoverTooltip.jsx
│   └── icons/GitHubIcon.jsx
└── utils/
    ├── timeMath.js           Prayer→angle math, countdown, grace period
    ├── timeMath.test.js      Tests for the above (node --test)
    ├── numberUtils.js        Western↔Arabic numeral localization
    └── translations.js       en/ar strings + calculation-method labels
```

See [Components](./components.md) for a per-file breakdown and
[Prayer Dial](./prayer-dial.md) for the math in `timeMath.js`.

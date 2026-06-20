# Islamic Clock — Documentation

Technical documentation for the Islamic Clock project: a continuous astronomical
prayer dial that ships as a web app (PWA) and as a Chrome/Firefox "New Tab"
extension.

For installation and a high-level feature list, see the root [README](../README.md).

## Contents

| Document                                | Covers                                                                                                          |
| :-------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| [Architecture](./architecture.md)       | Tech stack, data flow, state management, persistence, PWA, project layout.                                      |
| [Prayer Dial](./prayer-dial.md)         | The core astronomical math: how prayer times map to angles, interpolation, the grace period, and the countdown. |
| [Components](./components.md)           | Reference for every React component and what context values it consumes.                                        |
| [Configuration](./configuration.md)     | User-facing settings: calculation methods, prayer/DST/Hijri offsets, languages.                                 |
| [External APIs](./external-apis.md)     | The third-party services used (Aladhan, Photon, BigDataCloud) and the caching strategy.                         |
| [Development](./development.md)         | Setup, scripts, conventions, theming, and testing.                                                              |
| [Versioning](./versioning.md)           | How releases are cut from tags (the `pnpm version` flow).                                                       |
| [Firefox Signing](./firefox-signing.md) | AMO signing for listed and unlisted Firefox builds.                                                             |

## Quick orientation

- **Entry point:** [src/main.jsx](../src/main.jsx) wires the React Query client,
  the persistence layer, the `ClockProvider`, and the error boundary around
  [src/App.jsx](../src/App.jsx).
- **Single source of state:** [src/context/ClockContext.jsx](../src/context/ClockContext.jsx)
  holds settings and the live clock tick; [src/hooks/usePrayerTimes.js](../src/hooks/usePrayerTimes.js)
  owns location and prayer-time fetching. Components read both through the
  [`useClock`](../src/hooks/useClock.js) hook.
- **The interesting code** is the dial math in
  [src/utils/timeMath.js](../src/utils/timeMath.js) — start there if you want to
  understand what makes this more than a normal clock.

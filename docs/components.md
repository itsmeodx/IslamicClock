# Component Reference

Every component reads shared state through [`useClock`](../src/hooks/useClock.js)
unless noted. Components that only render derived state are wrapped in
`React.memo` to avoid re-rendering on every one-second clock tick.

## Top level

### `App` — [src/App.jsx](../src/App.jsx)

Decides what to show and lays out the page. If `permissionStatus === "prompt"`
(or `"denied"` with no saved location), it renders `LocationRequest`. Otherwise it
renders the header (title, location name, GitHub link, settings button), the main
content (analog **or** digital clock per `settings.clockMode`, plus
`NextPrayerCard` and `DateDisplay`), the `SettingsPanel`, and a transient error
toast. Applies `dir="rtl"` when the language is Arabic.

### `ErrorBoundary` — [src/components/ErrorBoundary.jsx](../src/components/ErrorBoundary.jsx)

Class component. Catches render errors below it, logs them, and shows a fallback
with a "Reload App" button instead of a white screen.

## Clock displays

### `AnalogClock` — [src/components/AnalogClock.jsx](../src/components/AnalogClock.jsx)

The SVG astronomical dial. Consumes `prayerTimes`, `settings`, `currentTime`.
Calls `getCurrentPrayerProgress` and animates the hand toward the target angle
with `requestAnimationFrame`. Draws the track, the prayer/marker nodes (the next
prayer's node is highlighted), the hand, the center pivot, and per-node name + time
labels. Adapts radii/offsets for mobile via a `matchMedia("(max-width: 639px)")`
listener, and nudges English label positions with the `EN_LABEL_TWEAKS` table.
See [Prayer Dial](./prayer-dial.md) for the math. `memo`-wrapped.

### `DigitalClock` — [src/components/DigitalClock.jsx](../src/components/DigitalClock.jsx)

The alternative to the dial. Shows the current 24-hour time large and centered,
then a row of five prayer cards (Fajr, Dhuhr, Asr, Maghrib, Isha). The next
prayer's card is highlighted (amber background/border, scaled up on large
screens). Uses `getCurrentPrayerProgress` only to know which prayer is next.
`memo`-wrapped.

### `NextPrayerCard` — [src/components/NextPrayerCard.jsx](../src/components/NextPrayerCard.jsx)

Shows the next prayer's name and a `HH:MM:SS` countdown. Reads `isGracePeriod`
from `getCurrentPrayerProgress` to switch between an "Until" countdown and a
"Since" elapsed timer (see [the grace period](./prayer-dial.md#the-grace-period)).
No props. `memo`-wrapped.

### `DateDisplay` — [src/components/DateDisplay.jsx](../src/components/DateDisplay.jsx)

Renders both the Hijri date (from `hijriDate`, with localized month name) and the
Gregorian date (from `currentTime.toLocaleDateString` with the language locale).
Two stacked cards on desktop, one combined card on mobile. Runs digits through
`localizeNumbers` so Arabic mode uses Arabic-Indic numerals. `memo`-wrapped.

## Input & settings

### `LocationRequest` — [src/components/LocationRequest.jsx](../src/components/LocationRequest.jsx)

**Props:** `t` (translation object), `onAllow`, `onManualSearch`.
The first screen when no location is known. Offers "Use Current Location" (calls
`onAllow` → browser geolocation) or a city search. The search debounces input
~400ms, queries `fetchCitySuggestions` (Photon) via TanStack Query, and renders a
suggestion dropdown; picking one calls `onManualSearch({ name, lat, lng })`.

### `SettingsPanel` — [src/components/SettingsPanel.jsx](../src/components/SettingsPanel.jsx)

**Props:** `isOpen`, `onClose`.
A slide-in drawer (from the left in RTL, right in LTR) with all user settings:
location card (+ reset), language toggle, clock mode toggle, calculation-method
select, DST offset, a collapsible block of per-prayer minute offsets (clamped
−60…+60), and the Hijri day offset. Has a footer with **Refresh** (`refresh()`)
and **Reset** (`resetSettings()`), both routed through `ConfirmationModal`.
Closes on Escape or backdrop click. All changes call `setSettings` immediately.
Contains an internal `CustomSelect` dropdown component. See
[Configuration](./configuration.md) for what each control does.

### `ConfirmationModal` — [src/components/ConfirmationModal.jsx](../src/components/ConfirmationModal.jsx)

**Props:** `isOpen`, `onClose`, `onConfirm`, `title`, `message`, `confirmText`,
`cancelText`, `isArabic`.
Reusable confirm/cancel dialog animated with Framer Motion. Pure presentational —
no context.

## Common / icons

### `HoverTooltip` — [src/components/common/HoverTooltip.jsx](../src/components/common/HoverTooltip.jsx)

**Props:** `text`. A tooltip that appears on `group-hover/action`, positioned
above its parent with a small arrow. Used for the header action buttons in `App`.

### `GitHubIcon` — [src/components/icons/GitHubIcon.jsx](../src/components/icons/GitHubIcon.jsx)

**Props:** `className`. The GitHub logo as an inline SVG using `currentColor`.

## The `useClock` contract

Components rely on these values from the context (assembled in
[ClockContext.jsx](../src/context/ClockContext.jsx)):

| Value                                                     | Type                | Source                                |
| :-------------------------------------------------------- | :------------------ | :------------------------------------ |
| `settings`                                                | object              | persisted settings                    |
| `updateSettings` / `setSettings`                          | fn                  | merge settings                        |
| `resetSettings`                                           | fn                  | clear storage + reload                |
| `currentTime`                                             | `Date`              | 1s tick                               |
| `prayerTimes`                                             | object \| null      | Aladhan (today's timings)             |
| `hijriDate`                                               | object \| null      | Aladhan (Hijri date, offset-adjusted) |
| `locationName`                                            | string \| null      | location                              |
| `coords`                                                  | `{ lat, lng }`      | location                              |
| `permissionStatus`                                        | string              | geolocation state                     |
| `requestLocation` / `setManualLocation` / `resetLocation` | fn                  | location control                      |
| `refresh`                                                 | fn                  | refetch prayer data                   |
| `loading`                                                 | boolean             | query loading                         |
| `error`                                                   | string \| undefined | query error message                   |

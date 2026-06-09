# External APIs

The app has no backend. It talks to three free, public, key-less HTTP APIs from
the browser. All calls originate in [usePrayerTimes.js](../src/hooks/usePrayerTimes.js)
(except none require auth or a server proxy).

## 1. Aladhan — prayer times & Hijri date

The source of truth for prayer times. The app fetches an **entire month** at once
and caches it, so day-to-day navigation never hits the network.

Two endpoints, chosen automatically.

**By coordinates** (preferred, most precise):

```http
GET https://api.aladhan.com/v1/calendar/{year}/{month}
      ?latitude={lat}&longitude={lng}&method={method}&tune={tune}
```

**By address** (fallback when only a place name is known):

```http
GET https://api.aladhan.com/v1/calendarByAddress/{year}/{month}
      ?address={name}&method={method}&tune={tune}
```

- `method` — calculation method id (see [Configuration](./configuration.md)).
- `tune` — the per-prayer minute offsets, comma-separated in Aladhan's fixed slot
  order.
- Response: an array of day objects; the app reads `data[day-1].timings` (prayer
  time strings) and `data[day-1].date.hijri` (the Hijri date).
- Time strings are sanitized (stripped of the `(TZ)` suffix, DST-shifted, and
  re-padded) before use.

**Caching:** TanStack Query with `staleTime: 24h`. The query key includes year,
month, lat, lng, name, method, and tune — so any change to location or settings
fetches fresh data, and nothing else does. After the 20th of the month the next
month is **prefetched**.

## 2. Photon (Komoot) — city search / geocoding

Powers the manual city search in [LocationRequest](../src/components/LocationRequest.jsx).

```http
GET https://photon.komoot.io/api/?q={query}&limit=5
```

`fetchCitySuggestions(query)` returns up to five `{ name, lat, lng, fullName }`
suggestions (built from each feature's `properties.name/state/country` and
`geometry.coordinates`). It returns `[]` for queries shorter than two characters
and swallows network errors to `[]` so the UI degrades quietly.

## 3. BigDataCloud — reverse geocoding

Turns the browser's geolocation coordinates into a human-readable place name.

```http
GET https://api.bigdatacloud.net/data/reverse-geocode-client
      ?latitude={lat}&longitude={lng}&localityLanguage=en
```

`getLocationName(lat, lng)` formats `"{locality|city}, {countryName}"`. On failure
it returns `null`, and `requestLocation` falls back to displaying the raw
`lat, lng`. This endpoint is the client-side variant and needs no key.

## Geolocation (browser API, not a service)

`requestLocation` uses `navigator.geolocation.getCurrentPosition` with
`{ timeout: 10000, enableHighAccuracy: true }`. Any failure (no API, denied,
timeout) sets `permissionStatus = "denied"`, after which the user can still search
for a city manually.

## Privacy notes

- Coordinates are sent to **Aladhan** (prayer times) and **BigDataCloud** (place
  name) only; search text is sent to **Photon**.
- Location is stored only in the browser's `localStorage` (`last-known-location`).
- The browser extensions declare **no permissions** and Firefox declares
  `data_collection_permissions: none` — there is no telemetry or server of our own.
- The code currently `console.log`s the outgoing Aladhan URL and successful
  geolocation coordinates for debugging; these stay in the local devtools console.

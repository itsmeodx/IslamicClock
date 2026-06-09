# The Prayer Dial

This is what makes Islamic Clock different from a normal clock. Instead of a
12-hour face, the analog mode is a **continuous astronomical dial**: a single
cyclical track on which the prayer markers sit at fixed angles, and a hand sweeps
through them following the day's progression from one prayer to the next.

All of the logic lives in [src/utils/timeMath.js](../src/utils/timeMath.js); the
rendering lives in [src/components/AnalogClock.jsx](../src/components/AnalogClock.jsx).

## Fixed positions on the track

The dial is **not** drawn to scale with real elapsed time — the markers are at
fixed, evenly-spaced-ish angles, and the hand interpolates between them. The
single source of truth is `PRAYER_POSITIONS`:

| Node       | Degree | Kind         |
| :--------- | :----- | :----------- |
| Dhuhr      | 0      | major        |
| Asr        | 60     | major        |
| Maghrib    | 90     | major        |
| Isha       | 120    | major        |
| Firstthird | 150    | minor marker |
| Midnight   | 180    | minor marker |
| Lastthird  | 210    | minor marker |
| Fajr       | 240    | major        |
| Sunrise    | 270    | minor        |

Degrees increase clockwise. The hand angle is computed as `degree − 90` (in
[AnalogClock.jsx](../src/components/AnalogClock.jsx)) so that **Dhuhr (0°) points
straight up** and the day reads clockwise from there. The arc from Sunrise (270°)
back to Dhuhr (360°/0°) is the empty quadrant of "daytime before noon".

Two flags shape behavior:

- **`isMarker`** (the night thirds + Midnight) — these are reference points, not
  prayers. The "next prayer" search skips them so the hand always counts down to
  an actual prayer.
- **`isMinor`** (markers + Sunrise) — rendered smaller, and never eligible for the
  grace period.

## Computing progress: `getCurrentPrayerProgress`

`getCurrentPrayerProgress(prayerTimes, currentTime)` returns everything the UI
needs for the current instant:

```js
{
  degree,         // where the hand should point (0–360)
  nextPrayer,     // name to display (may be the *previous* prayer during grace)
  remainingTime,  // "HH:MM:SS" countdown (or elapsed, during grace)
  percentage,     // 0–100 progress between prev and next node
  prevName,       // the node just passed
  isGracePeriod,  // true while a just-started prayer is still "active"
}
```

The algorithm:

1. **Build live nodes.** Take `PRAYER_POSITIONS`, keep only the ones present in
   `prayerTimes`, and attach each one's time-of-day in minutes (`timeToMinutes`).
   This keeps positions and times derived from one list — no drift.
2. **Degenerate cases.** Zero nodes → `null`. One node → point at it with a blank
   countdown.
3. **Sort by minute** and find the bracketing pair: the latest node whose time is
   `≤ now` (`prevNode`) and the next eligible node after `now` (`nextNode`). The
   search skips `isMarker` nodes, so the countdown targets a real prayer.
4. **Handle the wrap past midnight.** If `now` is after the last node of the day,
   `prevNode` is that last node and `nextNode` is the first major prayer of the
   _next_ day. Negative time gaps get `+24h` added so interpolation stays
   positive.
5. **Interpolate the angle.** `percentage = timePassed / timeGap`, then
   `currentDegree = prevDegree + angularDiff × percentage`, with the angular diff
   normalized to a forward (clockwise) sweep so the Sunrise→Dhuhr crossing of 0°
   is handled.
6. **Compute the countdown.** Build an absolute target `Date` for `nextNode`; if
   it has already passed today, roll it to tomorrow. The difference is formatted
   as zero-padded `HH:MM:SS`.

## The grace period

A prayer's time is the _start_ of its window, so showing "0:00 until Asr" the
instant Asr begins is wrong — Asr just started. To handle this, for **30 minutes
after a major prayer begins**:

- `isGracePeriod` is `true`.
- The displayed name flips to the prayer that just started (`prevNode`), not the
  next one.
- The timer shows **elapsed** time since it started ("Since"), instead of
  remaining time ("Until").

The grace period only applies to major prayers (`!isMarker && !isMinor`), so
Sunrise and the night-third markers never trigger it.
[NextPrayerCard.jsx](../src/components/NextPrayerCard.jsx) reads `isGracePeriod`
to switch its "Since"/"Until" label.

## Smooth hand animation

The clock tick (`currentTime`) advances once per second, which would make the
hand jump. [AnalogClock.jsx](../src/components/AnalogClock.jsx) smooths this with
a `requestAnimationFrame` loop that eases the displayed angle toward the target:

- `shortestAngleDelta` picks the shorter rotation direction and `normalizeAngle`
  keeps values in `[0, 360)`, so the hand never spins the long way around the
  360°/0° seam.
- Each frame moves `10%` of the remaining delta (`delta * 0.1`), an exponential
  ease-out, and stops once within `0.05°`.

## `timeToMinutes`

A small helper that converts an `"HH:MM"` string to minutes since midnight. It
tolerates the timezone suffix Aladhan sometimes appends (e.g. `"05:12 (EST)"`) by
splitting on the space first.

## Tests

[src/utils/timeMath.test.js](../src/utils/timeMath.test.js) covers this module
with the built-in Node test runner. Run them with `pnpm test`. If you change the
positions, the wrap logic, or the grace period, update these tests alongside.

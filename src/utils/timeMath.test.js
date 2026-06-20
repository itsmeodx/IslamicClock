import assert from "node:assert/strict";
import test from "node:test";
import {
  getCurrentPrayerProgress,
  timeToMinutes,
  PRAYER_POSITIONS,
} from "./timeMath.js";

// Classic dataset used by the original tests.
const classic = {
  Fajr: "05:00",
  Sunrise: "06:30",
  Dhuhr: "13:00",
  Asr: "16:30",
  Maghrib: "19:30",
  Isha: "21:00",
  Firstthird: "23:00",
  Midnight: "00:30",
  Lastthird: "02:00",
};

// Real prayer times from the night-bug screenshots (Ben Guerir, Morocco).
const night = {
  Fajr: "04:41",
  Sunrise: "06:26",
  Dhuhr: "13:35",
  Asr: "17:11",
  Maghrib: "20:38",
  Isha: "22:06",
  Firstthird: "23:51",
  Midnight: "01:30",
  Lastthird: "03:08",
};

// Fixed calendar day so Date math is deterministic and timezone-agnostic
// (constructed and read back in the same local zone).
const at = (h, m, s = 0) => new Date(2026, 5, 1, h, m, s);
const approx = (actual, expected, eps = 0.01) =>
  assert.ok(
    Math.abs(actual - expected) < eps,
    `expected ~${expected}, got ${actual}`,
  );

// --- timeToMinutes ---------------------------------------------------------

test("timeToMinutes parses HH:MM", () => {
  assert.equal(timeToMinutes("00:00"), 0);
  assert.equal(timeToMinutes("13:35"), 815);
  assert.equal(timeToMinutes("23:59"), 1439);
});

test("timeToMinutes strips a timezone suffix", () => {
  assert.equal(timeToMinutes("05:12 (EST)"), 312);
});

test("timeToMinutes returns 0 for falsy input", () => {
  assert.equal(timeToMinutes(""), 0);
  assert.equal(timeToMinutes(undefined), 0);
});

// --- degenerate inputs -----------------------------------------------------

test("returns null for null prayer times", () => {
  assert.equal(getCurrentPrayerProgress(null, at(10, 0)), null);
});

test("returns null for empty prayer times", () => {
  assert.equal(getCurrentPrayerProgress({}, at(10, 0)), null);
});

test("handles a single prayer safely", () => {
  const p = getCurrentPrayerProgress({ Dhuhr: "13:00" }, at(10, 0));
  assert.equal(p.nextPrayer, "Dhuhr");
  assert.equal(p.remainingTime, "--:--:--");
  assert.equal(p.percentage, 0);
  assert.equal(p.degree, 0);
});

// --- exact golden values ---------------------------------------------------

test("golden: 01:11 sits between Firstthird and Midnight", () => {
  const p = getCurrentPrayerProgress(night, at(1, 11));
  approx(p.degree, 174.2424);
  assert.equal(p.percentage, 81);
  assert.equal(p.nextPrayer, "Fajr");
  assert.equal(p.remainingTime, "03:30:00");
  assert.equal(p.isGracePeriod, false);
  assert.equal(p.prevName, "Firstthird");
});

test("golden: 09:00 crosses the Sunrise->Dhuhr (0 deg) seam", () => {
  const p = getCurrentPrayerProgress(night, at(9, 0));
  approx(p.degree, 302.3077); // 270 (Sunrise) heading to 360/0 (Dhuhr)
  assert.equal(p.percentage, 36);
  assert.equal(p.nextPrayer, "Dhuhr");
  assert.equal(p.remainingTime, "04:35:00");
  assert.equal(p.prevName, "Sunrise");
  assert.equal(p.isGracePeriod, false);
});

test("golden: 22:30 grace just after Isha shows elapsed time", () => {
  const p = getCurrentPrayerProgress(night, at(22, 30));
  approx(p.degree, 126.857);
  assert.equal(p.percentage, 23);
  assert.equal(p.isGracePeriod, true);
  assert.equal(p.nextPrayer, "Isha"); // grace keeps the just-started prayer
  assert.equal(p.remainingTime, "00:24:00"); // elapsed, not remaining
  assert.equal(p.prevName, "Isha");
});

// --- boundary exactness (now == a node) ------------------------------------

test("boundary: exactly at Isha -> degree 120, grace starts", () => {
  const p = getCurrentPrayerProgress(night, at(22, 6));
  assert.equal(p.degree, 120);
  assert.equal(p.percentage, 0);
  assert.equal(p.isGracePeriod, true);
  assert.equal(p.nextPrayer, "Isha");
  assert.equal(p.remainingTime, "00:00:00");
});

test("boundary: exactly at Sunrise (minor) -> degree 270, no grace", () => {
  const p = getCurrentPrayerProgress(night, at(6, 26));
  assert.equal(p.degree, 270);
  assert.equal(p.percentage, 0);
  assert.equal(p.isGracePeriod, false);
  assert.equal(p.nextPrayer, "Dhuhr");
});

// --- grace period rules ----------------------------------------------------

test("grace: within 30 min of a major prayer (Dhuhr)", () => {
  const p = getCurrentPrayerProgress(classic, at(13, 10, 15));
  assert.equal(p.isGracePeriod, true);
  assert.equal(p.nextPrayer, "Dhuhr");
  assert.equal(p.remainingTime, "00:10:15"); // elapsed incl. seconds
});

test("grace: not triggered after Sunrise (minor)", () => {
  const p = getCurrentPrayerProgress(classic, at(6, 40, 5));
  assert.equal(p.isGracePeriod, false);
  assert.equal(p.nextPrayer, "Dhuhr");
});

test("grace: expires exactly at 30 min", () => {
  const p = getCurrentPrayerProgress(night, at(22, 36)); // Isha 22:06 + 30
  assert.equal(p.isGracePeriod, false);
  assert.equal(p.nextPrayer, "Fajr");
});

// --- midnight crossing (classic dataset) -----------------------------------

test("23:30 points to next-day Fajr, hand between Firstthird and Midnight", () => {
  const p = getCurrentPrayerProgress(classic, at(23, 30));
  assert.equal(p.nextPrayer, "Fajr");
  assert.ok(p.degree > 150 && p.degree < 180, `degree ${p.degree}`);
  assert.ok(p.percentage >= 0 && p.percentage <= 100);
});

// --- invariants across the whole day (property guards) ---------------------

test("invariants hold every minute of the day", () => {
  const hms = /^\d{2}:\d{2}:\d{2}$/;
  for (let m = 0; m < 1440; m++) {
    const p = getCurrentPrayerProgress(night, at(Math.floor(m / 60), m % 60));
    assert.ok(p, `null at minute ${m}`);
    assert.ok(p.degree >= 0 && p.degree < 360, `degree ${p.degree} at ${m}`);
    assert.ok(
      p.percentage >= 0 && p.percentage <= 100,
      `percentage ${p.percentage} at ${m}`,
    );
    assert.match(p.remainingTime, hms, `remainingTime "${p.remainingTime}" at ${m}`);
  }
});

test("hand only ever moves forward, never jumps (full cycle)", () => {
  let prev = getCurrentPrayerProgress(night, at(0, 0)).degree;
  let wraps = 0;
  for (let m = 1; m <= 1440; m++) {
    const cur = getCurrentPrayerProgress(night, at(Math.floor(m / 60) % 24, m % 60))
      .degree;
    const delta = (cur - prev + 360) % 360; // forward distance, handles 360->0
    assert.ok(
      delta >= 0 && delta < 10,
      `jump of ${delta.toFixed(2)} deg at minute ${m} (${prev} -> ${cur})`,
    );
    if (delta > 0 && cur < prev) wraps++;
    prev = cur;
  }
  // Over a full day the hand wraps the 360/0 seam exactly once.
  assert.equal(wraps, 1);
});

test("night sweep is strictly monotonic Isha -> Fajr", () => {
  const samples = [
    [22, 30],
    [23, 0],
    [23, 51],
    [0, 0],
    [1, 0],
    [1, 30],
    [2, 0],
    [3, 8],
    [4, 0],
    [4, 41],
  ];
  let prev = -Infinity;
  for (const [h, m] of samples) {
    const p = getCurrentPrayerProgress(night, at(h, m));
    assert.ok(p.degree > prev, `${h}:${m} degree ${p.degree} <= ${prev}`);
    assert.ok(p.percentage >= 0 && p.percentage <= 100);
    prev = p.degree;
  }
});

// --- positions sanity ------------------------------------------------------

test("every PRAYER_POSITIONS node lands on its own degree at its exact time", () => {
  // Map degree -> a clean HH:MM that increases with the day cycle.
  for (const node of PRAYER_POSITIONS) {
    if (!night[node.name]) continue;
    const p = getCurrentPrayerProgress(night, atFromHHMM(night[node.name]));
    assert.equal(
      Math.round(p.degree),
      node.degree,
      `${node.name} expected ${node.degree}, got ${p.degree}`,
    );
    assert.equal(p.percentage, 0, `${node.name} should be at 0% at its time`);
  }
});

function atFromHHMM(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return at(h, m);
}

import assert from "node:assert/strict";
import test from "node:test";
import {
  dayKey,
  addDays,
  windowMonths,
  mergeWindow,
  lookupDay,
  correctedHijri,
} from "./hijriWindow.js";

// Minimal Aladhan /calendar entry: gregorian date is "DD-MM-YYYY".
const entry = (gddmmyyyy, hijri) => ({
  timings: { Fajr: "04:41" },
  date: { gregorian: { date: gddmmyyyy }, hijri },
});
const hj = (day, number, en, year) => ({
  day: String(day),
  month: { number, en, ar: en },
  year: String(year),
});

// Real data behind the offset bug (Berrechid, Morocco; method 21/HJCoSA):
//   14 Jun 2026 -> 28 Dhul-Hijjah 1447
//   15 Jun 2026 -> 29 Dhul-Hijjah 1447
//   16 Jun 2026 ->  1 Muharram   1448  (Mecca reckoning)
const june = [
  entry("14-06-2026", hj(28, 12, "Dhū al-Ḥijjah", 1447)),
  entry("15-06-2026", hj(29, 12, "Dhū al-Ḥijjah", 1447)),
  entry("16-06-2026", hj(1, 1, "Muḥarram", 1448)),
];
const today = new Date(2026, 5, 16); // 16 Jun 2026

// --- dayKey / addDays --------------------------------------------------------

test("dayKey zero-pads month and day", () => {
  assert.equal(dayKey(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(dayKey(new Date(2026, 5, 16)), "2026-06-16");
});

test("addDays crosses month and year boundaries", () => {
  assert.equal(dayKey(addDays(new Date(2026, 5, 16), -1)), "2026-06-15");
  assert.equal(dayKey(addDays(new Date(2026, 5, 1), -1)), "2026-05-31");
  assert.equal(dayKey(addDays(new Date(2026, 0, 1), -1)), "2025-12-31");
});

// --- windowMonths ------------------------------------------------------------

test("windowMonths returns prev/current/next mid-year", () => {
  assert.deepEqual(windowMonths(new Date(2026, 5, 16)), [
    { year: 2026, month: 5 },
    { year: 2026, month: 6 },
    { year: 2026, month: 7 },
  ]);
});

test("windowMonths rolls the year back in January", () => {
  assert.deepEqual(windowMonths(new Date(2026, 0, 10)), [
    { year: 2025, month: 12 },
    { year: 2026, month: 1 },
    { year: 2026, month: 2 },
  ]);
});

test("windowMonths rolls the year forward in December", () => {
  assert.deepEqual(windowMonths(new Date(2026, 11, 10)), [
    { year: 2026, month: 11 },
    { year: 2026, month: 12 },
    { year: 2027, month: 1 },
  ]);
});

// --- mergeWindow -------------------------------------------------------------

test("mergeWindow flattens entries keyed by gregorian dayKey", () => {
  const days = mergeWindow([june]);
  assert.deepEqual(Object.keys(days).sort(), [
    "2026-06-14",
    "2026-06-15",
    "2026-06-16",
  ]);
  assert.equal(days["2026-06-16"].hijri.month.en, "Muḥarram");
});

test("mergeWindow skips null/missing months", () => {
  const days = mergeWindow([null, june, undefined]);
  assert.equal(Object.keys(days).length, 3);
});

test("mergeWindow pads unpadded API dates so keys match dayKey", () => {
  const days = mergeWindow([[entry("1-1-2026", hj(12, 7, "Rajab", 1447))]]);
  assert.deepEqual(Object.keys(days), ["2026-01-01"]);
  assert.equal(lookupDay(days, new Date(2026, 0, 1)).hijri.day, "12");
});

// --- correctedHijri (the bug) ------------------------------------------------

test("offset 0 returns the day's own hijri", () => {
  const days = mergeWindow([june]);
  const h = correctedHijri(days, today, 0);
  assert.equal(h.day, "1");
  assert.equal(h.month.en, "Muḥarram");
  assert.equal(h.year, "1448");
});

test("offset -1 rolls into the previous hijri month (no 00-01-1448)", () => {
  const days = mergeWindow([june]);
  const h = correctedHijri(days, today, -1);
  assert.equal(h.day, "29");
  assert.equal(h.month.en, "Dhū al-Ḥijjah");
  assert.equal(h.year, "1447");
});

test("offset -2 keeps rolling back with correct month and year", () => {
  const days = mergeWindow([june]);
  const h = correctedHijri(days, today, -2);
  assert.equal(h.day, "28");
  assert.equal(h.month.en, "Dhū al-Ḥijjah");
  assert.equal(h.year, "1447");
});

test("positive offset rolls forward into the next hijri month and year", () => {
  const days = mergeWindow([june]);
  const from15 = new Date(2026, 5, 15); // 29 Dhū al-Ḥijjah 1447
  const h1 = correctedHijri(days, from15, 1);
  assert.equal(h1.day, "1");
  assert.equal(h1.month.en, "Muḥarram");
  assert.equal(h1.year, "1448");

  const from14 = new Date(2026, 5, 14); // 28 Dhū al-Ḥijjah 1447
  const h2 = correctedHijri(days, from14, 2);
  assert.equal(h2.day, "1");
  assert.equal(h2.year, "1448");
});

test("offset falls back to the day's own cell when the shifted day is missing", () => {
  // Only the 16th is loaded; offset -1 points at the (absent) 15th.
  const days = mergeWindow([[entry("16-06-2026", hj(1, 1, "Muḥarram", 1448))]]);
  const h = correctedHijri(days, today, -1);
  assert.equal(h.day, "1");
  assert.equal(h.month.en, "Muḥarram");
});

test("returns null when the day itself is not in the window", () => {
  const days = mergeWindow([june]);
  assert.equal(correctedHijri(days, new Date(2026, 6, 20), 0), null);
});

// --- lookupDay ---------------------------------------------------------------

test("lookupDay returns the cell or null", () => {
  const days = mergeWindow([june]);
  assert.equal(lookupDay(days, today).hijri.day, "1");
  assert.equal(lookupDay(days, new Date(2030, 0, 1)), null);
});

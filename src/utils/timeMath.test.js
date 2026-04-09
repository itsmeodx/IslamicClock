import assert from "node:assert/strict";
import test from "node:test";
import { getCurrentPrayerProgress } from "./timeMath.js";

const prayerTimes = {
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

test("shows grace period for major prayers", () => {
  const now = new Date("2026-04-09T13:10:15");
  const progress = getCurrentPrayerProgress(prayerTimes, now);

  assert.equal(progress?.isGracePeriod, true);
  assert.equal(progress?.nextPrayer, "Dhuhr");
});

test("does not apply grace period after Sunrise (minor)", () => {
  const now = new Date("2026-04-09T06:40:05");
  const progress = getCurrentPrayerProgress(prayerTimes, now);

  assert.equal(progress?.isGracePeriod, false);
  assert.equal(progress?.nextPrayer, "Dhuhr");
});

test("crosses midnight and points to next day's Fajr", () => {
  const now = new Date("2026-04-09T23:30:00");
  const progress = getCurrentPrayerProgress(prayerTimes, now);

  assert.equal(progress?.nextPrayer, "Fajr");
});

test("handles partial prayer data safely", () => {
  const now = new Date("2026-04-09T10:00:00");
  const progress = getCurrentPrayerProgress({ Dhuhr: "13:00" }, now);

  assert.equal(progress?.nextPrayer, "Dhuhr");
  assert.equal(progress?.remainingTime, "--:--:--");
  assert.equal(progress?.percentage, 0);
});

test("returns null for empty prayer times", () => {
  const now = new Date("2026-04-09T10:00:00");
  const progress = getCurrentPrayerProgress({}, now);

  assert.equal(progress, null);
});

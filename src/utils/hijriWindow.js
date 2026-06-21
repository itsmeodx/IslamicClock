// Offset the hijri date by reading the label Aladhan already computed for the
// shifted gregorian day (so month/year roll correctly), not by adding to the number.
// Prev/curr/next gregorian months are merged so the shift stays in range at edges.

// Supported hijri offset range; the prev/curr/next window covers exactly this.
export const MAX_HIJRI_OFFSET = 2;

const pad = (n) => String(n).padStart(2, "0");

export const dayKey = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

// prev, current, next gregorian months (year-rollover aware).
export function windowMonths(today) {
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  return [-1, 0, 1].map((delta) => {
    let mm = m + delta;
    let yy = y;
    if (mm < 1) {
      mm += 12;
      yy -= 1;
    } else if (mm > 12) {
      mm -= 12;
      yy += 1;
    }
    return { year: yy, month: mm };
  });
}

// "DD-MM-YYYY" (Aladhan) -> "YYYY-MM-DD" dayKey; pad in case parts come unpadded.
const gKeyFromApi = (ddmmyyyy) => {
  const [d, m, y] = ddmmyyyy.split("-");
  return `${y}-${pad(m)}-${pad(d)}`;
};

// Flatten /calendar month arrays into one gregorian-day lookup; null months skipped.
export function mergeWindow(monthArrays) {
  const days = {};
  for (const arr of monthArrays) {
    if (!arr) continue;
    for (const entry of arr) {
      days[gKeyFromApi(entry.date.gregorian.date)] = {
        timings: entry.timings,
        hijri: entry.date.hijri,
      };
    }
  }
  return days;
}

export const lookupDay = (days, date) => days[dayKey(date)] || null;

// Hijri at (date + offset); falls back to the day's own cell if the shift is off-window.
export function correctedHijri(days, date, offset) {
  const cell =
    (offset !== 0 && lookupDay(days, addDays(date, offset))) ||
    lookupDay(days, date);
  return cell ? cell.hijri : null;
}

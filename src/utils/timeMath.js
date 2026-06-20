export const PRAYER_POSITIONS = [
  { name: "Dhuhr", degree: 0 },
  { name: "Asr", degree: 60 },
  { name: "Maghrib", degree: 90 },
  { name: "Isha", degree: 120 },
  { name: "Firstthird", degree: 150, isMinor: true, isMarker: true },
  { name: "Midnight", degree: 180, isMinor: true, isMarker: true },
  { name: "Lastthird", degree: 210, isMinor: true, isMarker: true },
  { name: "Fajr", degree: 240 },
  { name: "Sunrise", degree: 270, isMinor: true },
];

const MINUTES_PER_DAY = 24 * 60;

export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  // Handle "HH:MM" or "HH:MM (EST)" formats from API
  const cleanTime = timeStr.split(" ")[0];
  const [h, m] = cleanTime.split(":").map(Number);
  return h * 60 + m;
}

export function getCurrentPrayerProgress(prayerTimes, currentTime = new Date()) {
  if (!prayerTimes) return null;

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Build nodes from PRAYER_POSITIONS so positions and times share one source.
  const nodes = PRAYER_POSITIONS.filter((node) => prayerTimes[node.name]).map(
    (node) => ({
      ...node,
      isMarker: Boolean(node.isMarker),
      isMinor: Boolean(node.isMinor),
      min: timeToMinutes(prayerTimes[node.name]),
    }),
  );

  if (nodes.length === 0) return null;

  if (nodes.length === 1) {
    const only = nodes[0];
    return {
      degree: only.degree,
      nextPrayer: only.name,
      remainingTime: "--:--:--",
      percentage: 0,
      prevName: only.name,
      isGracePeriod: false,
    };
  }

  // Cyclic minute distances, so the prayer day wraps correctly across midnight.
  const since = (min) => (currentMinutes - min + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const until = (min) => (min - currentMinutes + MINUTES_PER_DAY) % MINUTES_PER_DAY;

  // Immediate surrounding anchors (markers included) for a smooth, monotonic hand.
  let prevAnchor = nodes[0];
  let nextAnchor = nodes[0];
  let bestSince = Infinity;
  let bestUntil = Infinity;
  for (const node of nodes) {
    const s = since(node.min);
    if (s < bestSince) {
      bestSince = s;
      prevAnchor = node;
    }
    const u = until(node.min);
    if (u > 0 && u < bestUntil) {
      bestUntil = u;
      nextAnchor = node;
    }
  }

  // Interpolate the hand angle between the two anchors (0 <= percentage <= 1).
  const gap =
    (nextAnchor.min - prevAnchor.min + MINUTES_PER_DAY) % MINUTES_PER_DAY ||
    MINUTES_PER_DAY;
  const passed =
    (currentMinutes - prevAnchor.min + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const percentage = passed / gap;

  const diff = (nextAnchor.degree - prevAnchor.degree + 360) % 360;
  const currentDegree = (prevAnchor.degree + diff * percentage) % 360;

  // Countdown targets the next real prayer, skipping the night markers.
  let nextPrayerNode = nextAnchor;
  let bestPrayerUntil = Infinity;
  for (const node of nodes) {
    if (node.isMarker) continue;
    const u = until(node.min) || MINUTES_PER_DAY; // a prayer exactly now -> next one
    if (u < bestPrayerUntil) {
      bestPrayerUntil = u;
      nextPrayerNode = node;
    }
  }

  const targetDate = new Date(currentTime);
  targetDate.setHours(
    Math.floor(nextPrayerNode.min / 60),
    nextPrayerNode.min % 60,
    0,
    0,
  );
  if (targetDate <= currentTime) targetDate.setDate(targetDate.getDate() + 1);

  const totalRemainingSeconds = Math.max(
    0,
    Math.floor((targetDate - currentTime) / 1000),
  );
  const pad = (n) => n.toString().padStart(2, "0");
  let countdownStr =
    `${pad(Math.floor(totalRemainingSeconds / 3600))}:` +
    `${pad(Math.floor((totalRemainingSeconds % 3600) / 60))}:` +
    `${pad(totalRemainingSeconds % 60)}`;

  // Grace period: keep a just-started major prayer active for 30 minutes.
  let prevMajor = null;
  let bestMajorSince = Infinity;
  for (const node of nodes) {
    if (node.isMarker || node.isMinor) continue;
    const s = since(node.min);
    if (s < bestMajorSince) {
      bestMajorSince = s;
      prevMajor = node;
    }
  }

  let displayNextName = nextPrayerNode.name;
  let isGracePeriod = false;
  if (prevMajor && bestMajorSince < 30) {
    isGracePeriod = true;
    displayNextName = prevMajor.name;
    countdownStr =
      `${pad(Math.floor(bestMajorSince / 60))}:` +
      `${pad(bestMajorSince % 60)}:` +
      `${pad(currentTime.getSeconds())}`;
  }

  return {
    degree: currentDegree,
    nextPrayer: displayNextName,
    remainingTime: countdownStr,
    percentage: Math.round(percentage * 100),
    prevName: prevAnchor.name,
    isGracePeriod,
  };
}

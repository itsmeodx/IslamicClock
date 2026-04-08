export const PRAYER_POSITIONS = [
  { name: "Dhuhr", degree: 0 },
  { name: "Asr", degree: 60 },
  { name: "Maghrib", degree: 90 },
  { name: "Isha", degree: 120 },
  { name: "Firstthird", degree: 150, isMinor: true },
  { name: "Midnight", degree: 180, isMinor: true },
  { name: "Lastthird", degree: 210, isMinor: true },
  { name: "Fajr", degree: 240 },
  { name: "Sunrise", degree: 270 },
];

export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  // Handle "HH:MM" or "HH:MM (EST)" formats from API
  const cleanTime = timeStr.split(" ")[0];
  const [h, m] = cleanTime.split(":").map(Number);
  return h * 60 + m;
}

export function getCurrentPrayerProgress(prayerTimes) {
  if (!prayerTimes) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Map API times to our nodes, sorting them chronologically starting from midnight
  const chronologicalNodes = [
    { name: "Midnight", degree: 180, isMarker: true, isMinor: true },
    { name: "Lastthird", degree: 210, isMarker: true, isMinor: true },
    { name: "Fajr", degree: 240 },
    { name: "Sunrise", degree: 270 },
    { name: "Dhuhr", degree: 0 },
    { name: "Asr", degree: 60 },
    { name: "Maghrib", degree: 90 },
    { name: "Isha", degree: 120 },
    { name: "Firstthird", degree: 150, isMarker: true, isMinor: true },
  ];

  // Filter nodes that actually exist in the API response
  const nodesWithTimes = chronologicalNodes
    .filter((node) => prayerTimes[node.name])
    .map((node) => {
      const min = timeToMinutes(prayerTimes[node.name]);
      return { ...node, min };
    });

  // Sort them by actual time in the day
  nodesWithTimes.sort((a, b) => a.min - b.min);

  let prevNode = nodesWithTimes[nodesWithTimes.length - 1]; // Assume last node of previous day
  let nextNode = nodesWithTimes[0];
  let found = false;

  for (let i = 0; i < nodesWithTimes.length; i++) {
    if (currentMinutes < nodesWithTimes[i].min && !nodesWithTimes[i].isMarker) {
      nextNode = nodesWithTimes[i];
      prevNode =
        i === 0
          ? nodesWithTimes[nodesWithTimes.length - 1]
          : nodesWithTimes[i - 1];
      found = true;
      break;
    }
  }

  // If not found, it means current time is after the last prayer of the day (e.g. late night Isha to Fajr)
  if (!found) {
    prevNode = nodesWithTimes[nodesWithTimes.length - 1];
    // Find the first major prayer of the next day
    nextNode = nodesWithTimes.find((n) => !n.isMarker) || nodesWithTimes[0];
  }

  // Calculate interpolation
  let timeGap = nextNode.min - prevNode.min;
  let timePassed = currentMinutes - prevNode.min;

  if (timeGap <= 0) timeGap += 24 * 60; // Crosses midnight
  if (timePassed < 0) timePassed += 24 * 60;

  const percentage = timePassed / timeGap;

  // Calculate degrees (handling angular wrap around 360/0 for Sunrise -> Dhuhr)
  let prevDegree = prevNode.degree;
  let nextDegree = nextNode.degree;

  // Normalizing angle differences
  let diff = nextDegree - prevDegree;
  // Make sure we traverse the shortest path or specifically forward direction
  while (diff < 0) diff += 360;

  let currentDegree = (prevDegree + diff * percentage) % 360;

  // Calculate absolute target date for the next prayer
  const nowTime = new Date();
  const targetDate = new Date(nowTime);
  const targetH = Math.floor(nextNode.min / 60);
  const targetM = nextNode.min % 60;

  targetDate.setHours(targetH, targetM, 0, 0);

  // If target is in the past compared to now (e.g. crossing midnight), it must be for tomorrow
  if (targetDate < nowTime) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const totalDiffMs = Math.max(0, targetDate - nowTime);
  const totalRemainingSeconds = Math.floor(totalDiffMs / 1000);

  const hoursRemaining = Math.floor(totalRemainingSeconds / 3600);
  const minsRemaining = Math.floor((totalRemainingSeconds % 3600) / 60);
  const secsRemaining = totalRemainingSeconds % 60;

  // Refined HH:MM:SS format
  const h = hoursRemaining.toString().padStart(2, "0");
  const m = minsRemaining.toString().padStart(2, "0");
  const s = secsRemaining.toString().padStart(2, "0");
  const countdownStr = `${h}:${m}:${s}`;

  return {
    degree: currentDegree,
    nextPrayer: nextNode.name,
    remainingTime: countdownStr,
    percentage: Math.round(percentage * 100),
    prevName: prevNode.name,
  };
}

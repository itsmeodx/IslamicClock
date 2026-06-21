import { useState, useEffect, useCallback, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  windowMonths,
  mergeWindow,
  lookupDay,
  correctedHijri,
  MAX_HIJRI_OFFSET,
} from "../utils/hijriWindow";

export const MAX_DST_OFFSET = 1;

// UTILS
const fetchPrayerCalendar = async ({
  year,
  month,
  location,
  calculationMethod,
  tune,
}) => {
  const { lat, lng, name } = location;

  // Coordinate-first logic: Use exact lat/lng if available (most robust)
  const isCoordsReady = lat !== null && lng !== null;
  const url = isCoordsReady
    ? `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=${calculationMethod}&tune=${tune}`
    : `https://api.aladhan.com/v1/calendarByAddress/${year}/${month}?address=${encodeURIComponent(name)}&method=${calculationMethod}&tune=${tune}`;

  console.log("🕌 Aladhan API Request:", {
    type: isCoordsReady ? "coordinates" : "address",
    url,
  });

  const response = await fetch(url);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  const json = await response.json();
  if (json.code !== 200) throw new Error(json.data || "Failed to fetch");
  return json.data;
};

export const fetchCitySuggestions = async (query) => {
  if (!query || query.length < 2) return [];
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.features.map((f) => ({
      name: f.properties.name,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      fullName: [f.properties.name, f.properties.state, f.properties.country]
        .filter(Boolean)
        .join(", "),
    }));
  } catch {
    return [];
  }
};

const getLocationName = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    );
    const data = await res.json();
    return `${data.locality || data.city || "Unknown"}, ${data.countryName || "Unknown"}`;
  } catch {
    return null;
  }
};

// HOOK
export function usePrayerTimes(settings) {
  const {
    calculationMethod = 21,
    dstOffset = 0,
    hijriOffset = 0,
    prayerOffsets = {},
  } = settings || {};

  // Clamp so a tampered value can't request a day outside the loaded window.
  const offset = Math.max(
    -MAX_HIJRI_OFFSET,
    Math.min(MAX_HIJRI_OFFSET, hijriOffset),
  );

  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem("last-known-location");
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name || (parsed.lat !== null && parsed.lng !== null))
          return parsed;
      }
    } catch {
      /* ignore */
    }
    return { lat: null, lng: null, name: null };
  });

  const [permissionStatus, setPermissionStatus] = useState(() =>
    location.name || (location.lat !== null && location.lng !== null)
      ? "granted"
      : "prompt",
  );

  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (now.getDate() !== date.getDate()) setDate(now);
    }, 60000);
    return () => clearInterval(timer);
  }, [date]);

  const tune = useMemo(
    () =>
      [
        0,
        prayerOffsets.Fajr || 0,
        prayerOffsets.Sunrise || 0,
        prayerOffsets.Dhuhr || 0,
        prayerOffsets.Asr || 0,
        prayerOffsets.Maghrib || 0,
        0,
        prayerOffsets.Isha || 0,
        0,
      ].join(","),
    [prayerOffsets],
  );

  const hasLocation = !!(
    location.name ||
    (location.lat !== null && location.lng !== null)
  );

  // Current month always; a neighbour only when date+offset crosses that month's edge.
  const months = useMemo(() => windowMonths(date), [date]);
  const dom = date.getDate();
  const daysInMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();
  const needPrev = offset < 0 && dom + offset < 1;
  const needNext = offset > 0 && dom + offset > daysInMonth;

  const results = useQueries({
    queries: months.map((mo, i) => ({
      queryKey: [
        "prayerTimes",
        mo.year,
        mo.month,
        location.lat,
        location.lng,
        location.name,
        calculationMethod,
        tune,
      ],
      queryFn: () =>
        fetchPrayerCalendar({
          year: mo.year,
          month: mo.month,
          location,
          calculationMethod,
          tune,
        }),
      enabled:
        hasLocation &&
        (i === 1 || (i === 0 && needPrev) || (i === 2 && needNext)),
      staleTime: 1000 * 60 * 60 * 24,
    })),
  });

  // windowMonths always yields [prev, current, next]; the current month drives
  // loading/error state, and the three data refs are the merge's real dependencies.
  const [prevMonth, currentMonth, nextMonth] = results;
  const isLoading = currentMonth.isLoading;
  const error = currentMonth.error;
  // useQueries returns a fresh array each render, so memoizing this buys nothing.
  const refetch = () => results.forEach((r) => r.refetch());

  const win = useMemo(
    () => mergeWindow([prevMonth.data, currentMonth.data, nextMonth.data]),
    [prevMonth.data, currentMonth.data, nextMonth.data],
  );

  const { prayerTimes, hijriDate } = useMemo(() => {
    const today = lookupDay(win, date);
    if (!today) return { prayerTimes: null, hijriDate: null };

    const sanitizedTimings = {};
    Object.keys(today.timings).forEach((key) => {
      const timeStr = today.timings[key];
      if (typeof timeStr === "string" && timeStr.includes(":")) {
        const match = timeStr.match(/\d{1,2}:\d{2}/);
        if (!match) {
          sanitizedTimings[key] = timeStr;
          return;
        }
        let [h, m] = match[0].split(":").map(Number);
        if (dstOffset !== 0) h = (h + dstOffset + 24) % 24;
        sanitizedTimings[key] =
          `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      } else sanitizedTimings[key] = timeStr;
    });

    return {
      prayerTimes: sanitizedTimings,
      hijriDate: correctedHijri(win, date, offset),
    };
  }, [win, date, dstOffset, offset]);

  const saveLocation = useCallback((newLoc) => {
    setLocation(newLoc);
    setPermissionStatus("granted");
    localStorage.setItem("last-known-location", JSON.stringify(newLoc));
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return setPermissionStatus("denied");
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          console.log("📍 Geolocation Success:", latitude, longitude);
          const name = await getLocationName(latitude, longitude);
          saveLocation({
            lat: latitude,
            lng: longitude,
            name: name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          });
        },
        (err) => {
          console.error("📍 Geolocation Error Callback:", err);
          setPermissionStatus("denied");
        },
        { timeout: 10000, enableHighAccuracy: true },
      );
    } catch (e) {
      console.error("📍 Geolocation Sync Error:", e);
      setPermissionStatus("denied");
    }
  }, [saveLocation]);

  const resetLocation = useCallback(() => {
    setLocation({ lat: null, lng: null, name: null });
    setPermissionStatus("prompt");
    localStorage.removeItem("last-known-location");
  }, []);

  return {
    prayerTimes,
    hijriDate,
    locationName: location.name,
    coords: { lat: location.lat, lng: location.lng },
    loading: isLoading,
    error: error?.message,
    permissionStatus,
    requestLocation,
    resetLocation,
    setManualLocation: saveLocation,
    refresh: refetch,
  };
}

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

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
  } catch (e) {
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
  } catch (e) {
    return null;
  }
};

const adjustHijriDate = (originalHijri, offset) => {
  if (!originalHijri || offset === 0) return originalHijri;
  const day = parseInt(originalHijri.day) + offset;
  return { ...originalHijri, day: day.toString().padStart(2, "0") };
};

// HOOK
export function usePrayerTimes(settings) {
  const {
    calculationMethod = 21,
    dstOffset = 0,
    hijriOffset = 0,
    prayerOffsets = {},
  } = settings || {};

  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem("last-known-location");
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name || (parsed.lat !== null && parsed.lng !== null))
          return parsed;
      }
    } catch (e) {}
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

  const {
    data: monthData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "prayerTimes",
      date.getFullYear(),
      date.getMonth() + 1,
      location.lat,
      location.lng,
      location.name,
      calculationMethod,
      tune,
    ],
    queryFn: () =>
      fetchPrayerCalendar({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        location,
        calculationMethod,
        tune,
      }),
    enabled: hasLocation,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const { prayerTimes, hijriDate } = useMemo(() => {
    const day = date.getDate();
    if (!monthData || !monthData[day - 1])
      return { prayerTimes: null, hijriDate: null };
    const dayData = monthData[day - 1];

    const sanitizedTimings = {};
    Object.keys(dayData.timings).forEach((key) => {
      const timeStr = dayData.timings[key];
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
      hijriDate: adjustHijriDate(dayData.date.hijri, hijriOffset),
    };
  }, [monthData, date, dstOffset, hijriOffset]);

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

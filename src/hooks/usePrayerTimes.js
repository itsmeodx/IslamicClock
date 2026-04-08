import { useState, useEffect, useCallback } from "react";

const API_URL = "https://api.aladhan.com/v1/timingsByAddress";

export function usePrayerTimes(settings) {
  const {
    calculationMethod = 21,
    dstOffset = 0,
    hijriOffset = 0,
    prayerOffsets = {
      Fajr: 0,
      Sunrise: 0,
      Dhuhr: 0,
      Asr: 0,
      Maghrib: 0,
      Isha: 0,
    },
  } = settings || {};

  const [prayerTimes, setPrayerTimes] = useState(null);
  const [hijriDate, setHijriDate] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("prompt");

  // Helper to get location name
  const getLocationName = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      );
      const data = await res.json();
      return `${data.locality || data.city || "Unknown"}, ${data.countryName || "Unknown"}`;
    } catch (e) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // Helper to adjust Hijri date manually
  const adjustHijriDate = (originalHijri, offset) => {
    if (!originalHijri || offset === 0) return originalHijri;

    // Simulating a simple day shift
    // In a real app, we might want a library like moment-hijri
    // But for "Heritage" we mimic the legacy's manual increment
    const day = parseInt(originalHijri.day) + offset;
    // Note: This is an approximation. Month boundary logic is complex for Hijri.
    // Legacy just incremented the number.
    return { ...originalHijri, day: day.toString().padStart(2, "0") };
  };

  const processDayData = useCallback(
    (dayData) => {
      const rawTimings = dayData.timings;
      const sanitizedTimings = {};

      // 1. Sanitize and Apply DST
      Object.keys(rawTimings).forEach((key) => {
        const timeStr = rawTimings[key];
        if (typeof timeStr === "string" && timeStr.includes(":")) {
          // Extract only the HH:mm part (handling any trailing metadata like (+1) or (GMT))
          const match = timeStr.match(/\d{1,2}:\d{2}/);
          if (!match) {
            sanitizedTimings[key] = timeStr;
            return;
          }
          const cleanTime = match[0];
          let [h, m] = cleanTime.split(":").map(Number);

          if (dstOffset !== 0) {
            h = (h + dstOffset + 24) % 24;
          }

          sanitizedTimings[key] = `${h.toString().padStart(2, "0")}:${m
            .toString()
            .padStart(2, "0")}`;
        } else {
          sanitizedTimings[key] = timeStr;
        }
      });

      setPrayerTimes(sanitizedTimings);
      setHijriDate(adjustHijriDate(dayData.date.hijri, hijriOffset));
    },
    [dstOffset, hijriOffset],
  );

  const fetchTimings = useCallback(
    async (lat, lng, locName, force = false, targetDate = new Date()) => {
      try {
        if (!force) setLoading(true);
        setError(null);

        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1;
        const day = targetDate.getDate();

        const tune = [
          0,
          prayerOffsets.Fajr || 0,
          prayerOffsets.Sunrise || 0,
          prayerOffsets.Dhuhr || 0,
          prayerOffsets.Asr || 0,
          prayerOffsets.Maghrib || 0,
          0,
          prayerOffsets.Isha || 0,
          0,
        ].join(",");

        const addressParams = locName || `${lat},${lng}`;
        // Use granular cache key for specific month/year
        const cacheKey = `heritage-prayer-cache-${year}-${month}`;

        // 1. Check Cache (Skip if force is true)
        if (!force) {
          const savedCache = localStorage.getItem(cacheKey);
          if (savedCache) {
            const cache = JSON.parse(savedCache);
            const isMatch =
              cache.address === addressParams &&
              cache.method === calculationMethod &&
              cache.tune === tune;

            if (isMatch && cache.data[day - 1]) {
              const dayData = cache.data[day - 1];
              // Only update main states if we are fetching for TODAY
              if (
                year === new Date().getFullYear() &&
                month === new Date().getMonth() + 1
              ) {
                processDayData(dayData);
              }
              setLoading(false);
              return;
            }
          }
        }

        // 2. Fetch Fresh (Month)
        const url = `https://api.aladhan.com/v1/calendarByAddress/${year}/${month}?address=${encodeURIComponent(
          addressParams,
        )}&method=${calculationMethod}&tune=${tune}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("API Error");
        const json = await response.json();

        if (json.code === 200 && json.data) {
          const newCache = {
            year,
            month,
            address: addressParams,
            method: calculationMethod,
            tune: tune,
            data: json.data,
          };
          localStorage.setItem(cacheKey, JSON.stringify(newCache));

          // Only update main states if we are fetching for TODAY
          if (
            year === new Date().getFullYear() &&
            month === new Date().getMonth() + 1
          ) {
            const dayData = json.data[day - 1];
            processDayData(dayData);
          }
        }
      } catch (err) {
        console.error(err);
        if (!force) setError("Failed to fetch timings");
      } finally {
        if (!force) setLoading(false);
      }
    },
    [calculationMethod, prayerOffsets, processDayData],
  );

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setPermissionStatus("denied");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setPermissionStatus("granted");
        const name = await getLocationName(latitude, longitude);
        setLocationName(name);
        fetchTimings(latitude, longitude, name);
      },
      (err) => {
        setPermissionStatus("denied");
        setError("Location access denied");
        setLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }, [fetchTimings]);

  // Handle auto-refresh, pre-fetching, and initial load
  useEffect(() => {
    const saved = localStorage.getItem("last-known-location");
    if (!saved) return;

    const { lat, lng, name } = JSON.parse(saved);
    const now = new Date();

    setCoords({ lat, lng });
    setLocationName(name);
    setPermissionStatus("granted");

    // 1. Initial/Settings Fetch
    fetchTimings(lat, lng, name);

    // 2. Look-Ahead Prefetch (if after 20th)
    if (now.getDate() >= 20) {
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextCacheKey = `heritage-prayer-cache-${nextMonthDate.getFullYear()}-${nextMonthDate.getMonth() + 1}`;

      if (!localStorage.getItem(nextCacheKey)) {
        console.log("Pre-fetching next month calendar...");
        fetchTimings(lat, lng, name, false, nextMonthDate);
      }
    }

    // 3. Day Change Monitor
    const interval = setInterval(() => {
      const freshNow = new Date();
      const currentDay = freshNow.getDate();
      const lastRecordedDay = parseInt(
        localStorage.getItem("heritage-last-day") || "0",
      );

      if (currentDay !== lastRecordedDay) {
        localStorage.setItem("heritage-last-day", currentDay.toString());
        fetchTimings(lat, lng, name);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchTimings]);

  // Save location
  useEffect(() => {
    if (coords && locationName) {
      localStorage.setItem(
        "last-known-location",
        JSON.stringify({
          lat: coords.lat,
          lng: coords.lng,
          name: locationName,
        }),
      );
    }
  }, [coords, locationName]);

  return {
    prayerTimes,
    hijriDate,
    locationName,
    coords,
    loading,
    error,
    permissionStatus,
    requestLocation,
    refresh: () =>
      coords && fetchTimings(coords.lat, coords.lng, locationName, true),
  };
}

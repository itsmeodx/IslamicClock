import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

const API_CALENDAR_URL = "https://api.aladhan.com/v1/calendarByAddress";

const fetchPrayerCalendar = async ({
  year,
  month,
  address,
  calculationMethod,
  tune,
}) => {
  const url = `${API_CALENDAR_URL}/${year}/${month}?address=${encodeURIComponent(
    address,
  )}&method=${calculationMethod}&tune=${tune}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("API Error");
  const json = await response.json();
  if (json.code !== 200) throw new Error(json.data || "Failed to fetch");
  return json.data;
};

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

const adjustHijriDate = (originalHijri, offset) => {
  if (!originalHijri || offset === 0) return originalHijri;
  const day = parseInt(originalHijri.day) + offset;
  return { ...originalHijri, day: day.toString().padStart(2, "0") };
};

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

  const [locationName, setLocationName] = useState(() => {
    const saved = localStorage.getItem("last-known-location");
    return saved ? JSON.parse(saved).name : null;
  });
  const [coords, setCoords] = useState(() => {
    const saved = localStorage.getItem("last-known-location");
    return saved
      ? { lat: JSON.parse(saved).lat, lng: JSON.parse(saved).lng }
      : null;
  });
  const [permissionStatus, setPermissionStatus] = useState(() => {
    return localStorage.getItem("last-known-location") ? "granted" : "prompt";
  });

  const tune = useMemo(() => {
    return [
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
  }, [prayerOffsets]);

  const [date, setDate] = useState(new Date());

  // Update date roughly at midnight
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (now.getDate() !== date.getDate()) {
        setDate(now);
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [date]);

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const address =
    locationName || (coords ? `${coords.lat},${coords.lng}` : null);

  const {
    data: monthData,
    isLoading: isQueryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["prayerTimes", year, month, address, calculationMethod, tune],
    queryFn: () =>
      fetchPrayerCalendar({ year, month, address, calculationMethod, tune }),
    enabled: !!address,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const { prayerTimes, hijriDate } = useMemo(() => {
    if (!monthData || !monthData[day - 1])
      return { prayerTimes: null, hijriDate: null };

    const dayData = monthData[day - 1];
    const rawTimings = dayData.timings;
    const sanitizedTimings = {};

    Object.keys(rawTimings).forEach((key) => {
      const timeStr = rawTimings[key];
      if (typeof timeStr === "string" && timeStr.includes(":")) {
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

    return {
      prayerTimes: sanitizedTimings,
      hijriDate: adjustHijriDate(dayData.date.hijri, hijriOffset),
    };
  }, [monthData, day, dstOffset, hijriOffset]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setPermissionStatus("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const newCoords = { lat: latitude, lng: longitude };
        setCoords(newCoords);
        setPermissionStatus("granted");
        const name = await getLocationName(latitude, longitude);
        setLocationName(name);

        localStorage.setItem(
          "last-known-location",
          JSON.stringify({
            lat: latitude,
            lng: longitude,
            name: name,
          }),
        );
      },
      (err) => {
        setPermissionStatus("denied");
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }, []);

  return {
    prayerTimes,
    hijriDate,
    locationName,
    coords,
    loading: isQueryLoading,
    error: queryError ? queryError.message : null,
    permissionStatus,
    requestLocation,
    refresh: refetch,
  };
}

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { usePrayerTimes } from "../hooks/usePrayerTimes";

const ClockContext = createContext();

export function ClockProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("heritage-settings");
    return saved
      ? JSON.parse(saved)
      : {
          language: "ar",
          calculationMethod: 21,
          dstOffset: 0,
          hijriOffset: 0,
          prayerOffsets: {
            Fajr: 0,
            Sunrise: 0,
            Dhuhr: 0,
            Asr: 0,
            Maghrib: 0,
            Isha: 0,
          },
          clockMode: "analog",
        };
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  const {
    prayerTimes,
    hijriDate,
    locationName,
    coords,
    error,
    permissionStatus,
    requestLocation,
    resetLocation,
    setManualLocation,
    refresh,
    loading,
  } = usePrayerTimes(settings);

  useEffect(() => {
    localStorage.setItem("heritage-settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  const value = {
    settings,
    updateSettings,
    currentTime,
    prayerTimes,
    hijriDate,
    locationName,
    coords,
    error,
    permissionStatus,
    requestLocation,
    resetLocation,
    setManualLocation,
    refresh,
    loading,
    setSettings, // For backward compatibility
    resetSettings,
  };

  return (
    <ClockContext.Provider value={value}>{children}</ClockContext.Provider>
  );
}

export function useClock() {
  const context = useContext(ClockContext);
  if (!context) {
    throw new Error("useClock must be used within a ClockProvider");
  }
  return context;
}

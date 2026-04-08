import { useState, useEffect } from "react";
import { usePrayerTimes } from "./hooks/usePrayerTimes";
import SettingsPanel from "./components/SettingsPanel";
import LocationRequest from "./components/LocationRequest";
import AnalogClock from "./components/AnalogClock";
import DigitalClock from "./components/DigitalClock";
import NextPrayerCard from "./components/NextPrayerCard";
import DateDisplay from "./components/DateDisplay";
import { translations } from "./utils/translations";
import { getCurrentPrayerProgress } from "./utils/timeMath";
import { MapPin, Settings } from "lucide-react";

export default function App() {
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

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const {
    prayerTimes,
    hijriDate,
    locationName,
    error,
    permissionStatus,
    requestLocation,
    refresh,
  } = usePrayerTimes(settings);

  useEffect(() => {
    localStorage.setItem("heritage-settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const t = translations[settings.language];
  const progress = getCurrentPrayerProgress(prayerTimes);

  if (permissionStatus === "prompt") {
    return <LocationRequest t={t} onAllow={requestLocation} />;
  }

  return (
    <div
      className="min-h-screen p-4 sm:p-8 flex flex-col items-center gap-8 font-serif"
      dir={settings.language === "ar" ? "rtl" : "ltr"}
    >
      <div className="geometric-bg opacity-5" />

      {/* HEADER */}
      <div className="w-full max-w-5xl flex justify-between items-center z-10">
        <div>
          <h1 className="text-xl font-bold leading-tight">{t.title}</h1>
          <p className="text-xs text-heritage-gold flex items-center gap-1 uppercase tracking-widest font-bold">
            <MapPin className="w-3 h-3" /> {locationName || "..."}
          </p>
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-12 h-12 heritage-card !p-0 flex items-center justify-center border-heritage-gold/30 hover:bg-heritage-amber/10 transition-all duration-500 group"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6 text-heritage-amber group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </div>

      {/* MAIN CONTENT */}
      <main className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-stretch h-full">
        {settings.clockMode === "analog" ? (
          <div className="flex-1 heritage-card flex flex-col items-center justify-center min-h-[400px]">
            <div className="geometric-bg opacity-10" />
            <AnalogClock
              prayerTimes={prayerTimes}
              language={settings.language}
            />
          </div>
        ) : (
          <DigitalClock
            prayerTimes={prayerTimes}
            currentTime={currentTime}
            t={t}
          />
        )}

        <div className="w-full lg:w-[350px] flex flex-col gap-6">
          <NextPrayerCard t={t} progress={progress} />
          <DateDisplay
            hijriDate={hijriDate}
            currentTime={currentTime}
            language={settings.language}
          />
        </div>
      </main>

      {/* MODALS & OVERLAYS */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdate={setSettings}
        onRefresh={refresh}
        onReset={() =>
          setSettings({
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
          })
        }
      />

      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-100 border-2 border-red-500 text-red-700 px-6 py-2 rounded-full shadow-lg font-bold">
          {error}
        </div>
      )}
    </div>
  );
}

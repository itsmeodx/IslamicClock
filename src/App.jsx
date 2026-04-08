import { useState } from "react";
import { useClock } from "./hooks/useClock";
import SettingsPanel from "./components/SettingsPanel";
import LocationRequest from "./components/LocationRequest";
import AnalogClock from "./components/AnalogClock";
import DigitalClock from "./components/DigitalClock";
import NextPrayerCard from "./components/NextPrayerCard";
import DateDisplay from "./components/DateDisplay";
import { translations } from "./utils/translations";
import { MapPin, Settings } from "lucide-react";

export default function App() {
  const {
    settings,
    locationName,
    error,
    permissionStatus,
    requestLocation,
    setManualLocation,
  } = useClock();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const t = translations[settings.language];

  // If no location set (saved or current), or stuck in prompt, show request screen
  if (
    permissionStatus === "prompt" ||
    (permissionStatus === "denied" && !locationName)
  ) {
    return (
      <LocationRequest
        t={t}
        onAllow={requestLocation}
        onManualSearch={setManualLocation}
      />
    );
  }

  return (
    <div
      className="min-h-screen p-4 sm:p-8 flex flex-col items-center gap-8 font-main"
      dir={settings.language === "ar" ? "rtl" : "ltr"}
    >
      <div className="geometric-bg opacity-5" />

      {/* HEADER */}
      <div className="w-full max-w-5xl flex justify-between items-center z-10">
        <div>
          <h1 className="text-xl font-bold leading-tight mb-0.5">{t.title}</h1>
          <p className="text-[8px] sm:text-xs text-heritage-gold/90 flex items-center gap-1 uppercase tracking-[0.18em] font-bold">
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
      <main className="w-full max-w-5xl flex flex-col lg:flex-row gap-6 sm:gap-8 items-stretch h-full">
        {settings.clockMode === "analog" ? (
          <div className="flex-1 heritage-card flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px]">
            <div className="geometric-bg opacity-10" />
            <AnalogClock />
          </div>
        ) : (
          <DigitalClock />
        )}

        <div className="w-full lg:w-[350px] grid grid-cols-2 lg:flex lg:flex-col gap-4 sm:gap-6">
          <NextPrayerCard />
          <DateDisplay />
        </div>
      </main>

      {/* MODALS & OVERLAYS */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-100 border-2 border-red-500 text-red-700 px-6 py-2 rounded-full shadow-lg font-bold">
          {error}
        </div>
      )}
    </div>
  );
}

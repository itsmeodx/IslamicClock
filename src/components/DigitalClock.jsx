import { Sun } from "lucide-react";

export default function DigitalClock({ prayerTimes, currentTime, t }) {
  return (
    <div className="flex-1 heritage-card flex flex-col items-center justify-center min-h-[400px]">
      <div className="geometric-bg opacity-10" />
      <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Sun className="text-heritage-amber w-16 h-16 mx-auto mb-8 animate-pulse drop-shadow-[0_0_15px_rgba(255,159,28,0.4)]" />
        <h2 className="text-8xl sm:text-9xl font-light tracking-tighter tabular-nums text-white drop-shadow-xl">
          {currentTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </h2>
        <div className="mt-8 flex gap-4 justify-center">
          {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((p) => (
            <div key={p} className="flex flex-col items-center">
              <span className="text-[10px] text-heritage-amber uppercase font-bold drop-shadow-sm">
                {t.prayers[p]}
              </span>
              <span className="text-lg font-bold text-white drop-shadow-md">
                {prayerTimes?.[p] || "--:--"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

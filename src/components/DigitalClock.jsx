import { translations } from "../utils/translations";
import { useClock } from "../hooks/useClock";
import { getCurrentPrayerProgress } from "../utils/timeMath";

export default function DigitalClock() {
  const { prayerTimes, currentTime, settings } = useClock();
  const t = translations[settings.language];
  const { nextPrayer } = getCurrentPrayerProgress(prayerTimes) || {};

  return (
    <div className="flex-1 heritage-card flex flex-col items-center justify-between min-h-87.5 sm:min-h-137.5 overflow-hidden group">
      <div className="geometric-bg opacity-10" />

      {/* Central Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-1000 py-6 sm:py-0">
        <h2 className="text-[clamp(4rem,15vw,11rem)] font-thin tracking-tighter tabular-nums heritage-gradient-text drop-shadow-[0_20px_50px_rgba(0,0,0,0.7)] pb-2 sm:pb-6 leading-none">
          {currentTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </h2>
      </div>

      {/* Floating Prayer Cards */}
      <div className="w-full flex flex-wrap justify-center gap-2 sm:gap-4 p-4 sm:p-8 mt-auto z-10">
        {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((p) => {
          const isNext = nextPrayer === p;
          return (
            <div
              key={p}
              className={`px-3 py-2 sm:px-6 sm:py-4 rounded-xl sm:rounded-3xl border transition-all duration-700 backdrop-blur-xl flex flex-col items-center min-w-0 sm:min-w-30 ${
                isNext
                  ? "bg-heritage-amber/10 border-heritage-amber/50 shadow-[inset_0_0_20px_rgba(255,159,28,0.1)] sm:scale-110"
                  : "bg-slate-900/25 border-white/10"
              }`}
            >
              <span
                className={`text-[8px] sm:text-xs uppercase font-bold tracking-widest sm:tracking-[0.2em] mb-0.5 sm:mb-1 ${
                  isNext ? "text-heritage-amber" : "text-heritage-amber/60"
                }`}
              >
                {t.prayers[p]}
              </span>
              <span
                className={`text-sm sm:text-xl font-bold tabular-nums heritage-gradient-text pb-0.5 sm:pb-1 ${
                  isNext
                    ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                    : "drop-shadow-[0_2px_5px_rgba(0,0,0,0.3)]"
                }`}
              >
                {prayerTimes?.[p] || "--:--"}
              </span>
              {isNext && (
                <div className="w-4 sm:w-8 h-0.5 bg-heritage-amber/60 rounded-full mt-0.5 sm:mt-1" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

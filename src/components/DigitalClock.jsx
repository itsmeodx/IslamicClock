import { getCurrentPrayerProgress } from "../utils/timeMath";

export default function DigitalClock({ prayerTimes, currentTime, t }) {
  const { nextPrayer } = getCurrentPrayerProgress(prayerTimes) || {};

  return (
    <div className="flex-1 heritage-card flex flex-col items-center justify-between min-h-[550px] overflow-hidden group">
      <div className="geometric-bg opacity-10" />

      {/* Central Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-1000">
        <h2 className="text-[clamp(5rem,12vw,11rem)] font-thin tracking-tighter tabular-nums heritage-gradient-text drop-shadow-[0_20px_50px_rgba(0,0,0,0.7)] pb-6 leading-none">
          {currentTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </h2>
      </div>

      {/* Floating Prayer Cards */}
      <div className="w-full flex flex-wrap justify-center gap-4 p-8 mt-auto z-10">
        {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((p) => {
          const isNext = nextPrayer === p;
          return (
            <div
              key={p}
              className={`px-6 py-4 rounded-3xl border transition-all duration-700 backdrop-blur-xl flex flex-col items-center min-w-[120px] ${
                isNext
                  ? "bg-heritage-amber/10 border-heritage-amber/50 shadow-[inset_0_0_20px_rgba(255,159,28,0.1)] scale-110"
                  : "bg-slate-900/25 border-white/15"
              }`}
            >
              <span
                className={`text-xs uppercase font-bold tracking-[0.2em] mb-1 ${isNext ? "text-heritage-amber" : "text-heritage-amber/60"}`}
              >
                {t.prayers[p]}
              </span>
              <span
                className={`text-xl font-bold tabular-nums heritage-gradient-text pb-1 ${
                  isNext
                    ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                    : "drop-shadow-[0_2px_5px_rgba(0,0,0,0.3)]"
                }`}
              >
                {prayerTimes?.[p] || "--:--"}
              </span>
              {isNext && (
                <div className="w-8 h-0.5 bg-heritage-amber/60 rounded-full mt-1" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

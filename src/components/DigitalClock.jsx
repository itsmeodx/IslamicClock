import { memo } from "react";
import { translations } from "../utils/translations";
import { useClock } from "../hooks/useClock";
import { getCurrentPrayerProgress } from "../utils/timeMath";

const BASE_CARD_CLASS =
  "px-3 py-2 sm:px-6 sm:py-4 rounded-xl sm:rounded-3xl border transition-all duration-700 backdrop-blur-xl flex flex-col items-center w-24";
const NEXT_CARD_CLASS =
  "bg-heritage-amber/10 border-heritage-amber/50 shadow-[inset_0_0_20px_rgba(255,159,28,0.1)] sm:scale-110";
const INACTIVE_CARD_CLASS = "bg-slate-900/25 border-white/10";

const TITLE_CLASS =
  "text-[8px] sm:text-xs uppercase font-bold tracking-widest sm:tracking-[0.2em] mb-0.5 sm:mb-1";
const TIME_CLASS =
  "text-sm sm:text-xl font-bold tabular-nums heritage-gradient-text pb-0.5 sm:pb-1";
const INDICATOR_CLASS =
  "w-4 sm:w-8 h-0.5 bg-heritage-amber/60 rounded-full mt-0.5 sm:mt-1";

function DigitalClock() {
  const { prayerTimes, currentTime, settings } = useClock();
  const t = translations[settings.language];
  const { nextPrayer } = getCurrentPrayerProgress(prayerTimes) || {};

  const getTitleClass = (isNext) =>
    `${TITLE_CLASS} ${isNext ? "text-heritage-amber" : "text-heritage-amber/60"}`;

  const getTimeClass = (isNext) =>
    `${TIME_CLASS} ${
      isNext
        ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
        : "drop-shadow-[0_2px_5px_rgba(0,0,0,0.3)]"
    }`;

  return (
    <div className="flex-1 heritage-card flex flex-col items-center justify-center sm:justify-between min-h-87.5 sm:min-h-137.5 overflow-hidden group">
      <div className="geometric-bg opacity-10" />

      {/* Central Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-1000 py-2 sm:py-0">
        <h2 className="text-[clamp(6rem,22vw,13rem)] font-thin tracking-tighter tabular-nums heritage-gradient-text drop-shadow-[0_20px_50px_rgba(0,0,0,0.7)] pb-1 sm:pb-6 leading-none">
          {currentTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </h2>
      </div>

        <div className="h-px w-[clamp(8rem,70vw,30rem)] bg-white/10 my-1 sm:my-4" />

      {/* Floating Prayer Cards */}
      <div className="w-full flex flex-wrap lg:flex-nowrap justify-center gap-2 sm:gap-4 p-2 sm:p-8 mt-auto z-10">
        {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((p) => {
          const isNext = nextPrayer === p;
          return (
            <div
              key={p}
              className={`${BASE_CARD_CLASS} lg:shrink-0 ${isNext ? NEXT_CARD_CLASS : INACTIVE_CARD_CLASS}`}
            >
              <span className={getTitleClass(isNext)}>{t.prayers[p]}</span>
              <span className={getTimeClass(isNext)}>
                {prayerTimes?.[p] || "--:--"}
              </span>
              {isNext && <div className={INDICATOR_CLASS} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(DigitalClock);

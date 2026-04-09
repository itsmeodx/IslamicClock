import { memo } from "react";
import { translations } from "../utils/translations";
import { getCurrentPrayerProgress } from "../utils/timeMath";
import { useClock } from "../hooks/useClock";

function NextPrayerCard() {
  const { prayerTimes, settings } = useClock();
  const t = translations[settings.language];
  const progress = getCurrentPrayerProgress(prayerTimes);

  return (
    <div className="heritage-card flex-1 flex flex-col items-center justify-center text-center border-heritage-amber/40 overflow-hidden min-h-35 sm:min-h-62.5 p-1.5 sm:p-6 transition-all duration-300">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 bg-heritage-amber/10 blur-[60px] sm:blur-[100px] pointer-events-none" />
      <div className="geometric-bg opacity-10" />

      <div className="relative z-10 flex flex-col items-center w-full">
        <h3 className="text-xl sm:text-4xl font-main font-bold heritage-gradient-text leading-tight sm:leading-relaxed drop-shadow-[0_8px_15px_rgba(0,0,0,0.5)]">
          {t.prayers[progress?.nextPrayer] || "..."}
        </h3>

        <div className="h-px w-[clamp(3rem,18vw,7rem)] bg-white/10 my-1 sm:my-4" />

        <span className="text-xs sm:text-xl text-white/50 uppercase font-bold tracking-[0.2em] sm:tracking-[0.3em] mt-0.5 sm:mt-2 mb-0.5 sm:mb-2">
          {progress?.isGracePeriod ? t.since : t.until}
        </span>

        <span className="text-3xl sm:text-6xl font-extralight tabular-nums heritage-gradient-text drop-shadow-[0_12px_30px_rgba(0,0,0,0.8)] tracking-[0.02em] sm:tracking-[0.05em]">
          {progress?.remainingTime || "00:00:00"}
        </span>
      </div>
    </div>
  );
}

export default memo(NextPrayerCard);

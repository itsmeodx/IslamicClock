import { Moon, Sun } from "lucide-react";
import { localizeNumbers } from "../utils/numberUtils";
import { useClock } from "../hooks/useClock";

export default function DateDisplay() {
  const { hijriDate, currentTime, settings } = useClock();
  const language = settings.language;

  const formatHijri = () => {
    if (!hijriDate) return "...";
    const m = hijriDate.month;
    const monthName = language === "ar" ? m.ar || m : m.en || m;
    const yearStr = localizeNumbers(hijriDate.year, language);
    const dayStr = localizeNumbers(hijriDate.day, language);
    return `${dayStr} ${monthName} ${yearStr}`;
  };

  const gregorianDate = currentTime.toLocaleDateString(
    language === "ar" ? "ar-u-nu-latn" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" },
  );

  return (
    <div className="heritage-card flex-1 flex flex-col items-center justify-center text-center border-white/5 overflow-hidden min-h-[140px] sm:min-h-[250px] p-1.5 sm:p-6 transition-all duration-300">
      <div className="geometric-bg opacity-10" />

      <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 sm:gap-4 h-full w-full">
        {/* Hijri Sector */}
        <div className="flex flex-col items-center gap-1 sm:gap-1.5">
          <Moon className="w-4 h-4 sm:w-6 sm:h-6 text-heritage-amber/80" />
          <p className="text-xs sm:text-lg font-main font-bold heritage-gradient-text tracking-tight sm:tracking-wide">
            {formatHijri()}
          </p>
        </div>

        <div className="w-12 h-px bg-white/10 my-1 sm:my-4" />

        {/* Gregorian Sector */}
        <div className="flex flex-col items-center gap-1 sm:gap-1.5">
          <Sun className="w-4 h-4 sm:w-6 sm:h-6 text-heritage-amber/80" />
          <p className="text-xs sm:text-lg font-main font-bold uppercase heritage-gradient-text tracking-tight sm:tracking-widest">
            {gregorianDate}
          </p>
        </div>
      </div>
    </div>
  );
}

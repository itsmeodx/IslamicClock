import { memo } from "react";
import { Moon, Sun } from "lucide-react";
import { localizeNumbers } from "../utils/numberUtils";
import { useClock } from "../hooks/useClock";

const dateIconClass =
  "w-4 h-4 sm:w-6 sm:h-6 lg:w-5 lg:h-5 text-heritage-amber/80";
const dateTextClass =
  "text-xs sm:text-lg lg:text-base font-main font-bold heritage-gradient-text tracking-tight sm:tracking-wide";
const sharedCardClass =
  "heritage-card flex flex-col items-center justify-center text-center border-white/5 overflow-hidden min-h-35 sm:min-h-62.5 p-1.5 sm:p-6 transition-all duration-300";

function DateCard({ className = "", children }) {
  return (
    <div className={`${sharedCardClass} ${className}`.trim()}>
      <div className="geometric-bg opacity-10" />
      {children}
    </div>
  );
}
function DateSector({ icon, value }) {
  return (
    <div className="flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-1">
      {icon}
      <p className={dateTextClass}>{value}</p>
    </div>
  );
}

function DesktopDateCard({ icon, value }) {
  return (
    <DateCard className="lg:min-h-26 lg:p-2">
      <div className="relative z-10 flex flex-col items-center justify-center gap-1 lg:gap-1 h-full w-full">
        <DateSector icon={icon} value={value} />
      </div>
    </DateCard>
  );
}

function DateDisplay() {
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

  const hijriIcon = <Moon className={dateIconClass} />;
  const gregorianIcon = <Sun className={dateIconClass} />;

  return (
    <>
      <div className="lg:hidden">
        <DateCard className="flex-1 min-h-35 sm:min-h-62.5">
          <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 sm:gap-2 h-full w-full">
            <DateSector icon={hijriIcon} value={formatHijri()} />

            <div className="w-12 h-px bg-white/10 my-1 sm:my-4" />

            <DateSector icon={gregorianIcon} value={gregorianDate} />
          </div>
        </DateCard>
      </div>

      <div className="hidden lg:flex lg:flex-col gap-4">
        <DesktopDateCard icon={hijriIcon} value={formatHijri()} />
        <DesktopDateCard icon={gregorianIcon} value={gregorianDate} />
      </div>
    </>
  );
}

export default memo(DateDisplay);

import { Sun, Moon } from "lucide-react";
import { localizeNumbers } from "../utils/numberUtils";
import { useClock } from "../context/ClockContext";

const InfoCard = ({ icon: Icon, text, textClass = "" }) => (
  <div className="heritage-card p-5 flex items-center gap-4">
    <div className="geometric-bg opacity-10" />
    <Icon className="w-6 h-6 text-heritage-amber shrink-0 drop-shadow-sm" />
    <p
      className={`${textClass} heritage-gradient-text drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] leading-relaxed pb-1`}
    >
      {text}
    </p>
  </div>
);

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
    <div className="flex flex-col gap-4">
      <InfoCard
        icon={Moon}
        text={formatHijri()}
        textClass="text-xl font-main font-bold tracking-wide"
      />
      <InfoCard
        icon={Sun}
        text={gregorianDate}
        textClass="text-lg font-main font-bold uppercase tracking-widest"
      />
    </div>
  );
}

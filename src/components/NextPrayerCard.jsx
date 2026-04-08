import { Clock } from "lucide-react";

export default function NextPrayerCard({ t, progress }) {
  return (
    <div className="heritage-card flex-1 flex flex-col items-center justify-center text-center border-heritage-amber/40 overflow-hidden min-h-[250px]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-heritage-amber/10 blur-[100px] pointer-events-none" />
      <div className="geometric-bg opacity-10" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-14 h-14 rounded-full bg-heritage-amber/5 flex items-center justify-center mb-6 border border-heritage-amber/10 shadow-[0_0_20px_rgba(255,159,28,0.15)]">
          <Clock className="w-7 h-7 text-heritage-amber/80 animate-pulse drop-shadow-[0_0_8px_rgba(255,159,28,0.4)]" />
        </div>

        <h3 className="text-4xl font-arabic font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-heritage-gold/50 mb-6 drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
          {t.prayers[progress?.nextPrayer] || "..."}
        </h3>

        <span className="text-7xl font-extralight tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-heritage-gold/50 drop-shadow-[0_12px_40px_rgba(0,0,0,0.9)] tracking-[0.05em]">
          {progress?.remainingTime || "00:00:00"}
        </span>
      </div>
    </div>
  );
}

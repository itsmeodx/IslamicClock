export default function NextPrayerCard({ t, progress }) {
  return (
    <div className="heritage-card flex-1 flex flex-col items-center justify-center text-center border-heritage-amber/40 overflow-hidden min-h-[250px]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-heritage-amber/10 blur-[100px] pointer-events-none" />
      <div className="geometric-bg opacity-10" />

      <div className="relative z-10 flex flex-col items-center">
        <h3 className="text-4xl font-main font-bold heritage-gradient-text mb-2 leading-relaxed drop-shadow-[0_8px_15px_rgba(0,0,0,0.5)]">
          {t.prayers[progress?.nextPrayer] || "..."}
        </h3>

        <span className="text-5xl sm:text-6xl font-extralight tabular-nums heritage-gradient-text pb-2 drop-shadow-[0_12px_30px_rgba(0,0,0,0.8)] tracking-[0.05em]">
          {progress?.remainingTime || "00:00:00"}
        </span>
      </div>
    </div>
  );
}

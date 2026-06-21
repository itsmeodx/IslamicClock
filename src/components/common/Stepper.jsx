import { Plus, Minus } from "lucide-react";
import SettingLabel from "./SettingLabel";

// Generic − / value / + stepper for small bounded integer settings.
export default function Stepper({
  label,
  hint,
  value,
  min,
  max,
  unit,
  offLabel,
  ariaLabel,
  onChange,
}) {
  const step = (delta) =>
    onChange(Math.max(min, Math.min(max, value + delta)));

  return (
    <div className="space-y-3">
      <SettingLabel hint={hint}>{label}</SettingLabel>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={value <= min}
          aria-label={`${ariaLabel || label} −1`}
          className="w-12 h-12 shrink-0 flex items-center justify-center rounded-xl border-2 border-white/10 bg-white/5 text-white cursor-pointer hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          <Minus className="w-5 h-5" />
        </button>
        <div className="flex-1 h-12 flex items-center justify-center gap-1.5 rounded-xl border-2 border-heritage-amber/30 bg-heritage-amber/10">
          {value === 0 && offLabel ? (
            <span className="text-sm font-bold text-white/40">{offLabel}</span>
          ) : (
            <>
              <span
                dir="ltr"
                className="text-base font-bold text-white tabular-nums"
              >
                <span className="text-xs">{value > 0 ? "+" : "−"}</span>
                {Math.abs(value)}
              </span>
              {unit && <span className="text-xs text-white/50">{unit}</span>}
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={value >= max}
          aria-label={`${ariaLabel || label} +1`}
          className="w-12 h-12 shrink-0 flex items-center justify-center rounded-xl border-2 border-white/10 bg-white/5 text-white cursor-pointer hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

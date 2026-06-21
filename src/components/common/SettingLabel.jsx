import { Info } from "lucide-react";
import HoverTooltip from "./HoverTooltip";

// Settings field label with an optional info icon that reveals a hint on hover.
export default function SettingLabel({ children, hint }) {
  return (
    <div className="flex items-center gap-1.5 px-1 mb-2">
      <label className="text-xs text-heritage-amber uppercase font-bold tracking-widest">
        {children}
      </label>
      {hint && (
        <span className="relative group/action flex">
          <Info className="w-3.5 h-3.5 text-white/40 hover:text-heritage-amber transition-colors cursor-help" />
          <HoverTooltip text={hint} />
        </span>
      )}
    </div>
  );
}

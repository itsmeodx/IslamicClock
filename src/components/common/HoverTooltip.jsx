export default function HoverTooltip({ text }) {
  return (
    <span className="pointer-events-none absolute top-full mt-3 left-1/2 -translate-x-1/2 z-20 opacity-0 translate-y-1 scale-95 group-hover/action:opacity-100 group-hover/action:translate-y-0 group-hover/action:scale-100 transition-all duration-300">
      <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-slate-950/92 border-t border-l border-white/15" />
      <span className="relative whitespace-nowrap rounded-xl border border-white/15 bg-slate-950/92 backdrop-blur-lg px-3 py-1.5 text-[10px] sm:text-xs font-semibold tracking-wide shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
        <span className="heritage-gradient-text">{text}</span>
      </span>
    </span>
  );
}

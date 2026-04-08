import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, ChevronDown, Check } from "lucide-react";
import { translations } from "../utils/translations";

function CustomSelect({ label, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  return (
    <div
      className={`space-y-3 relative ${isOpen ? "z-50" : "z-10"}`}
      ref={containerRef}
    >
      <label className="text-xs text-heritage-amber uppercase font-bold tracking-widest px-1">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="heritage-input w-full flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <span className="truncate pr-4 text-white font-medium">
            {selectedOption.label}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-heritage-amber transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full mt-2 w-full max-h-64 bg-slate-950/94 border border-white/20 rounded-xl shadow-2xl z-[100] overflow-y-auto custom-scrollbar backdrop-blur-3xl overflow-hidden"
            >
              <div className="geometric-bg opacity-10" />
              <div className="p-1 relative z-10">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all duration-200 ${
                      opt.value === value
                        ? "bg-heritage-amber/20 text-white font-bold"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {opt.value === value && (
                      <Check className="w-4 h-4 text-heritage-gold" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function SettingsPanel({
  isOpen,
  onClose,
  settings,
  onUpdate,
  onRefresh,
  onReset,
}) {
  const t = translations[settings.language];

  const handleChange = (key, value) => {
    onUpdate({ ...settings, [key]: value });
  };

  const handleOffsetChange = (prayer, value) => {
    let numValue = parseInt(value) || 0;
    // Enforce a sensible limit of +/- 60 minutes
    numValue = Math.max(-60, Math.min(60, numValue));

    onUpdate({
      ...settings,
      prayerOffsets: {
        ...settings.prayerOffsets,
        [prayer]: numValue,
      },
    });
  };

  // Prepare options
  const calcMethodOptions = Object.entries(t.calculationMethods).map(
    ([id, name]) => ({
      value: parseInt(id),
      label: name,
    }),
  );

  const dstOptions = [
    { value: -1, label: t.dstMinus1Hour },
    { value: 0, label: t.dstOff },
    { value: 1, label: t.dstPlus1Hour },
  ];

  const hijriOptions = [
    { value: -1, label: t.hijriMinus1Day },
    { value: 0, label: t.hijriNoChange },
    { value: 1, label: t.hijriPlus1Day },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/10 z-40 cursor-default"
          />

          <motion.div
            initial={{ x: settings.language === "ar" ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: settings.language === "ar" ? "-100%" : "100%" }}
            className={`fixed ${settings.language === "ar" ? "left-0" : "right-0"} top-0 h-full w-full max-w-sm bg-slate-950/40 backdrop-blur-3xl z-50 border-heritage-gold/30 flex flex-col overflow-hidden ${settings.language === "ar" ? "border-r-2 shadow-[20px_0_60px_rgba(0,0,0,0.5)]" : "border-l-2 shadow-[-20px_0_60px_rgba(0,0,0,0.5)]"}`}
            dir={settings.language === "ar" ? "rtl" : "ltr"}
          >
            <div className="geometric-bg opacity-5" />

            {/* 1. FIXED HEADER */}
            <div className="flex justify-between items-center p-6 border-b border-white/10 z-10">
              <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                <Settings className="w-8 h-8 text-heritage-amber" />
                {t.settings}
              </h2>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white transition-colors text-3xl leading-none"
              >
                ×
              </button>
            </div>

            {/* 2. SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 relative z-10 custom-scrollbar">
              {/* Language */}
              <div className="space-y-3">
                <label className="text-xs text-heritage-amber uppercase font-bold tracking-widest px-1">
                  {t.language}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleChange("language", "en")}
                    className={`p-3 rounded-xl border-2 transition-all font-bold ${settings.language === "en" ? "bg-heritage-amber/20 border-heritage-amber text-white shadow-[0_0_15px_rgba(255,159,28,0.2)]" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => handleChange("language", "ar")}
                    className={`p-3 rounded-xl border-2 font-arabic transition-all text-xl ${settings.language === "ar" ? "bg-heritage-amber/20 border-heritage-amber text-white shadow-[0_0_15px_rgba(255,159,28,0.2)]" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"}`}
                  >
                    العربية
                  </button>
                </div>
              </div>

              {/* Clock Mode */}
              <div className="space-y-3">
                <label className="text-xs text-heritage-amber uppercase font-bold tracking-widest px-1">
                  {t.clockMode}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleChange("clockMode", "analog")}
                    className={`p-3 rounded-xl border-2 transition-all font-bold ${settings.clockMode === "analog" ? "bg-heritage-amber/20 border-heritage-amber text-white shadow-[0_0_15px_rgba(255,159,28,0.2)]" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"}`}
                  >
                    {t.analog}
                  </button>
                  <button
                    onClick={() => handleChange("clockMode", "digital")}
                    className={`p-3 rounded-xl border-2 transition-all font-bold ${settings.clockMode === "digital" ? "bg-heritage-amber/20 border-heritage-amber text-white shadow-[0_0_15px_rgba(255,159,28,0.2)]" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"}`}
                  >
                    {t.digital}
                  </button>
                </div>
              </div>

              {/* Custom Dropdowns */}
              <CustomSelect
                label={t.calculationMethod}
                value={settings.calculationMethod}
                options={calcMethodOptions}
                onChange={(val) => handleChange("calculationMethod", val)}
              />

              <CustomSelect
                label={t.daylightSaving}
                value={settings.dstOffset}
                options={dstOptions}
                onChange={(val) => handleChange("dstOffset", val)}
              />

              {/* Prayer Settings */}
              <div className="space-y-4">
                <label className="text-xs text-heritage-amber uppercase font-bold tracking-widest px-1">
                  {t.prayerTimeAdjustments}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(settings.prayerOffsets).map((p) => (
                    <div key={p} className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-heritage-amber/80 uppercase font-bold tracking-widest px-1">
                        {t.prayers[p]}
                      </label>
                      <input
                        type="number"
                        min="-60"
                        max="60"
                        value={settings.prayerOffsets[p]}
                        onChange={(e) => handleOffsetChange(p, e.target.value)}
                        className="heritage-input !py-2 !px-3 text-center font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <CustomSelect
                label={t.hijriOffset}
                value={settings.hijriOffset}
                options={hijriOptions}
                onChange={(val) => handleChange("hijriOffset", val)}
              />
            </div>

            {/* 3. FIXED FOOTER */}
            <div className="p-6 border-t border-white/10 flex flex-row gap-3 relative z-10">
              <button
                onClick={onRefresh}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-heritage-amber text-heritage-indigo hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-heritage-amber/20 text-sm uppercase tracking-wider"
              >
                {t.refresh}
              </button>
              <button
                onClick={onReset}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all text-sm uppercase tracking-wider"
              >
                {t.reset}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

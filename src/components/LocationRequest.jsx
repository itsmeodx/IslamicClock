import { useState, useEffect } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchCitySuggestions } from "../hooks/usePrayerTimes";

export default function LocationRequest({ t, onAllow, onManualSearch }) {
  const [city, setCity] = useState("");
  const [debouncedCity, setDebouncedCity] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCity(city), 400);
    return () => clearTimeout(timer);
  }, [city]);

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["city-search", debouncedCity],
    queryFn: () => fetchCitySuggestions(debouncedCity),
    enabled: debouncedCity.length > 2,
  });

  return (
    <div className="h-screen flex items-center justify-center p-4 overflow-hidden relative">
      <div className="heritage-card text-center max-w-md w-full animate-in fade-in zoom-in duration-700 relative !overflow-visible -translate-y-20">
        <div className="geometric-bg opacity-10" />

        <div className="relative z-10">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-xl backdrop-blur-md">
            <MapPin className="w-10 h-10 text-heritage-amber" />
          </div>

          <h2 className="text-3xl font-bold mb-3 tracking-tight">{t.locationRequired}</h2>
          <p className="text-white/60 mb-10 text-base leading-relaxed max-w-[280px] mx-auto">{t.locationDesc}</p>

          <div className="space-y-8">
            <button onClick={onAllow} className="heritage-button w-full py-4 text-lg flex items-center justify-center gap-3">
              <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {t.allowLocation}
            </button>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-white/10" />
              <span className="flex-shrink mx-4 text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">{t.or || "OR"}</span>
              <div className="flex-grow border-t border-white/10" />
            </div>

            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-heritage-amber" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="heritage-input w-full !pl-12 !py-4 text-base"
                />
                {isLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-heritage-amber animate-spin" />}
              </div>

              {suggestions?.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950/70 backdrop-blur-3xl border border-white/20 rounded-2xl z-[999] shadow-2xl overflow-hidden max-h-[220px] overflow-y-auto custom-scrollbar animate-in slide-in-from-top-4 duration-500">
                  {/* Matching inner-border from heritage-card style but squared */}
                  <div className="absolute inset-1.5 border border-white/10 rounded-xl pointer-events-none z-10" />

                  <div className="relative z-20 flex flex-col pt-3 pb-3">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => onManualSearch({ name: s.fullName || s.name, lat: s.lat, lng: s.lng })}
                        className="w-full text-start px-8 py-3.5 hover:bg-white/5 border-b border-white/5 last:border-0 transition-all group outline-none"
                      >
                        <div className="flex items-center gap-4">
                          <MapPin className="w-4 h-4 text-heritage-amber opacity-40 group-hover:opacity-100 transition-opacity" />
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-heritage-amber transition-colors">
                              {s.name || "Unknown City"}
                            </p>
                            <p className="text-[11px] text-white/40 uppercase tracking-[0.18em] font-medium">
                              {s.fullName?.split(", ").slice(1).join(", ") || "Region details"}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

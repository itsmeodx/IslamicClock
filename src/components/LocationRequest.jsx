import { MapPin } from "lucide-react";

export default function LocationRequest({ t, onAllow }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="heritage-card text-center max-w-md animate-in fade-in zoom-in duration-700">
        <div className="geometric-bg" />
        <div className="w-20 h-20 bg-heritage-bg rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-heritage-gold shadow-inner">
          <MapPin className="w-10 h-10 text-heritage-gold" />
        </div>
        <h2 className="text-2xl font-bold mb-4">
          {t.locationRequired || "Location Access Required"}
        </h2>
        <p className="text-heritage-green/70 mb-8 leading-relaxed">
          {t.locationDesc ||
            "Please allow access to your location to precisely calculate prayer times for your exact position."}
        </p>
        <button
          onClick={onAllow}
          className="heritage-button px-10 py-3 text-lg"
        >
          {t.allowLocation || "Allow Location Access"}
        </button>
      </div>
    </div>
  );
}

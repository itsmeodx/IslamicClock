import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PRAYER_POSITIONS, getCurrentPrayerProgress } from "../utils/timeMath";
import { translations } from "../utils/translations";

export default function AnalogClock({ prayerTimes, language = "ar" }) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(getCurrentPrayerProgress(prayerTimes));
    }, 1000);

    setProgress(getCurrentPrayerProgress(prayerTimes));
    return () => clearInterval(timer);
  }, [prayerTimes]);

  const SIZE = 500;
  const CENTER = SIZE / 2;
  const TRACK_RADIUS = 160;

  return (
    <div className="relative w-full h-full max-w-[500px] aspect-square mx-auto flex items-center justify-center">
      {/* SVG LAYER */}
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full h-full overflow-visible absolute inset-0 z-10 pointer-events-none"
      >
        <defs>
          {/* Heritage Amber Gradient (Sunset Glow) */}
          <linearGradient
            id="heritageAmber"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FF9F1C" />
            <stop offset="100%" stopColor="#FF4500" />
          </linearGradient>

          {/* Hand Glow */}
          <filter id="handGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* DIAL BACKGROUND (Parchment Circle) */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={TRACK_RADIUS + 10}
          fill="rgba(255,255,255,0.05)"
          stroke="#FF9F1C"
          strokeWidth="0.5"
          className="opacity-30"
        />

        {/* MAIN TRACK (Glowing Amber) */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={TRACK_RADIUS}
          fill="none"
          stroke="url(#heritageAmber)"
          strokeWidth="4"
          className="drop-shadow-[0_0_8px_rgba(255,159,28,0.4)]"
        />

        {/* NODES */}
        {PRAYER_POSITIONS.map((node) => {
          const angleRad = (node.degree - 90) * (Math.PI / 180);
          const nodeX = CENTER + TRACK_RADIUS * Math.cos(angleRad);
          const nodeY = CENTER + TRACK_RADIUS * Math.sin(angleRad);

          const isNext = progress?.nextPrayer === node.name;
          const isMinor = node.isMinor;
          const radius = isMinor ? 4 : 8;

          return (
            <g key={node.name}>
              {isNext ? (
                // Active Pulse Beacon
                <g>
                  <circle
                    cx={nodeX}
                    cy={nodeY}
                    r={radius}
                    fill="#0A1128"
                    stroke="#FF9F1C"
                    strokeWidth="2"
                  />
                </g>
              ) : (
                <circle
                  cx={nodeX}
                  cy={nodeY}
                  r={radius}
                  fill="#ffffff"
                  stroke="#FF9F1C"
                  strokeWidth="2"
                />
              )}
            </g>
          );
        })}

        {/* THE NEEDLE (Legacy Logic Recreation) */}
        {progress && (
          <g transform={`translate(${CENTER}, ${CENTER})`}>
            <motion.line
              x1={0}
              y1={0}
              x2={0}
              y2={-(TRACK_RADIUS - 20)}
              stroke="#FF9F1C"
              strokeWidth="4"
              strokeLinecap="round"
              animate={{
                rotate: progress.degree,
                originX: 0,
                originY: 0,
              }}
              style={{
                filter: "drop-shadow(0 0 8px rgba(255,159,28,0.8))",
              }}
              transition={{ type: "spring", stiffness: 20, damping: 10 }}
            />
          </g>
        )}

        {/* CENTER PIVOT (Modern Hub) */}
        <g>
          <circle
            cx={CENTER}
            cy={CENTER}
            r="12"
            fill="#0A1128"
            stroke="#FF9F1C"
            strokeWidth="2"
          />
        </g>
      </svg>

      {/* TYPOGRAPHY LAYER */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {PRAYER_POSITIONS.map((node) => {
          const angleRad = (node.degree - 90) * (Math.PI / 180);
          // 32% (160/500 * 100) is the exact radius of the nodes.
          // Place labels outside the node. Sunrise/Maghrib get extra clearance
          const extraClearance =
            node.name === "Sunrise" || node.name === "Maghrib" ? 44 : 42;
          const textOffset = node.isMinor ? 42 : extraClearance;
          const labelX = 50 + textOffset * Math.cos(angleRad);
          const labelY = 50 + textOffset * Math.sin(angleRad);

          return (
            <div
              key={node.name}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 text-center transition-all duration-500"
              style={{ left: `${labelX}%`, top: `${labelY}%` }}
            >
              <div className="flex flex-col items-center gap-1">
                {/* PRAYER NAME */}
                <span
                  className={`block ${language === "ar" ? "font-arabic" : "font-sans"} font-bold ${node.isMinor ? "text-white/40" : "text-lg sm:text-xl text-white drop-shadow-md"} whitespace-nowrap leading-tight`}
                >
                  {translations[language].prayers[node.name]}
                </span>

                {/* PRAYER TIME */}
                {!node.isMinor && prayerTimes?.[node.name] && (
                  <span className="block text-[12px] font-bold text-heritage-gold tabular-nums bg-white/10 backdrop-blur-md shadow-sm px-2 rounded-md border border-white/20 mt-1">
                    {prayerTimes[node.name]}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

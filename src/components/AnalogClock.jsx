import { useEffect, useRef, useState, memo } from "react";
import { PRAYER_POSITIONS, getCurrentPrayerProgress } from "../utils/timeMath";
import { translations } from "../utils/translations";
import { useClock } from "../hooks/useClock";

function normalizeAngle(angle) {
  let next = angle % 360;
  if (next < 0) next += 360;
  return next;
}

function shortestAngleDelta(from, to) {
  let delta = to - from;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

const EN_LABEL_TWEAKS = {
  Sunrise: { label: 8, time: -2 },
  Dhuhr: { label: 0, time: -2 },
  Asr: { label: 0, time: -2 },
  Maghrib: { label: 9, time: 2 },
  Firstthird: { label: 8, time: -2 },
  Midnight: { label: 8, time: -2 },
  Lastthird: { label: 8, time: -2 },
};

function AnalogClock() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 639px)").matches;
  });
  const { prayerTimes, settings, currentTime } = useClock();
  const progress = getCurrentPrayerProgress(prayerTimes, currentTime);
  const initialDegree = progress?.degree ?? 0;
  const [displayDegree, setDisplayDegree] = useState(initialDegree);
  const displayDegreeRef = useRef(initialDegree);
  const language = settings.language;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const onChange = (event) => setIsMobile(event.matches);

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  useEffect(() => {
    if (!progress) return;

    let rafId;
    const target = normalizeAngle(progress.degree ?? 0);

    const animate = () => {
      const normalizedCurrent = normalizeAngle(displayDegreeRef.current);
      const delta = shortestAngleDelta(normalizedCurrent, target);

      if (Math.abs(delta) < 0.05) {
        if (displayDegreeRef.current !== target) {
          displayDegreeRef.current = target;
          setDisplayDegree(target);
        }
        return;
      }

      const next = normalizeAngle(normalizedCurrent + delta * 0.1);
      displayDegreeRef.current = next;
      setDisplayDegree(next);
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [progress]);

  const SIZE = 500;
  const CENTER = SIZE / 2;
  const TRACK_RADIUS = isMobile ? 160 : 175;
  const HAND_LENGTH = TRACK_RADIUS - 20;
  const MAJOR_LABEL_OFFSET = isMobile ? 55 : 48;
  const MINOR_LABEL_OFFSET = isMobile ? 45 : 38;
  const TIME_LABEL_OFFSET = 16;

  const getNodeOffset = (node) => {
    const baseLabelOffset = node.isMinor ? MINOR_LABEL_OFFSET : MAJOR_LABEL_OFFSET;
    const baseTimeOffset = TIME_LABEL_OFFSET;
    const tweak = language !== "ar" ? EN_LABEL_TWEAKS[node.name] : undefined;

    return {
      labelOffset: baseLabelOffset + (tweak?.label ?? 0),
      timeOffset: baseTimeOffset + (tweak?.time ?? 0),
    };
  };

  const handAngleRad = (displayDegree - 90) * (Math.PI / 180);
  const handX = CENTER + HAND_LENGTH * Math.cos(handAngleRad);
  const handY = CENTER + HAND_LENGTH * Math.sin(handAngleRad);

  return (
    <div className="relative w-full h-full max-w-125 aspect-square flex items-center justify-center">
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

          {/* Heritage Text Gradient (White to Gold) */}
          <linearGradient
            id="heritageTextGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>

          {/* Node Gradients (Saturated Amber Gems) */}
          <radialGradient id="majorNodeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#E65100" />
          </radialGradient>
          <radialGradient id="minorNodeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF9F1C" />
            <stop offset="100%" stopColor="#E65100" stopOpacity="0.5" />
          </radialGradient>

          {/* Smoked Glass Pivot Gradient */}
          <radialGradient id="glassPivotGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(10,17,40,0.6)" />
            <stop offset="100%" stopColor="rgba(255,159,28,0.2)" />
          </radialGradient>

          {/* Hand Glow */}
          <filter id="handGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* DIAL BACKGROUND (Smoked Glass) */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={TRACK_RADIUS + 10}
          fill="rgba(0,0,0,0.2)"
          stroke="url(#heritageAmber)"
          strokeWidth="1"
          strokeOpacity="0.4"
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
          const radius = isMinor ? 4.5 : 7;

          return (
            <g key={node.name}>
              {isNext ? (
                <circle
                  cx={nodeX}
                  cy={nodeY}
                  r={radius + 2}
                  fill="url(#majorNodeGradient)"
                  stroke="#FFD700"
                  strokeWidth="2"
                  style={{
                    filter: "drop-shadow(0 0 8px rgba(255,159,28,0.8))",
                  }}
                />
              ) : (
                <circle
                  cx={nodeX}
                  cy={nodeY}
                  r={radius}
                  fill={
                    isNext
                      ? "url(#majorNodeGradient)"
                      : isMinor
                        ? "#FFB300"
                        : "url(#majorNodeGradient)"
                  }
                  stroke="#FF9F1C"
                  strokeWidth={isMinor ? "1" : "3"}
                  strokeOpacity="1"
                />
              )}
            </g>
          );
        })}

        {/* THE NEEDLE (Legacy Logic Recreation) */}
        {progress && (
          <line
            x1={CENTER}
            y1={CENTER}
            x2={handX}
            y2={handY}
            stroke="#FF9F1C"
            strokeWidth="4"
            strokeLinecap="round"
            style={{
              filter: "drop-shadow(0 0 8px rgba(255,159,28,0.8))",
            }}
          />
        )}

        {/* CENTER PIVOT (Modern Hub) */}
        <g>
          <circle
            cx={CENTER}
            cy={CENTER}
            r="14"
            fill="url(#glassPivotGradient)"
            stroke="#FFD700"
            strokeWidth="1.5"
            strokeOpacity="0.8"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r="4"
            fill="#FF9F1C"
            style={{ filter: "drop-shadow(0 0 5px #FF9F1C)" }}
          />
        </g>

        {/* LABELS LAYER */}
        {PRAYER_POSITIONS.map((node) => {
          const { labelOffset, timeOffset } = getNodeOffset(node);
          const angleRad = (node.degree - 90) * (Math.PI / 180);
          const textRadius = TRACK_RADIUS + labelOffset;
          const labelX = CENTER + textRadius * Math.cos(angleRad);
          const labelY = CENTER + textRadius * Math.sin(angleRad);

          return (
            <g key={node.name}>
              {/* PRAYER NAME */}
              <text
                x={labelX}
                y={labelY - 10 + (language === "ar" ? 4 : 0)}
                fill={
                  node.isMinor
                    ? "rgba(255,255,255,0.6)"
                    : "url(#heritageTextGradient)"
                }
                fontSize={node.isMinor ? "12" : "18"}
                fontWeight={language === "ar" ? "600" : "700"}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  filter: node.isMinor
                    ? "none"
                    : "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
                }}
              >
                {translations[language].prayers[node.name]}
              </text>

              {/* PRAYER TIME (If available) */}
              {prayerTimes?.[node.name] && (
                <g transform={`translate(${labelX}, ${labelY + timeOffset})`}>
                  <rect
                    x="-25"
                    y="-10"
                    width="50"
                    height="20"
                    rx="6"
                    fill={
                      node.isMinor
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(255,255,255,0.08)"
                    }
                    stroke="none"
                  />
                  <text
                    fill={node.isMinor ? "rgba(255,255,255,0.7)" : "#FFD700"}
                    fontSize="11"
                    fontWeight="400"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="tabular-nums"
                    style={{ opacity: 0.9 }}
                  >
                    {prayerTimes[node.name]}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default memo(AnalogClock);

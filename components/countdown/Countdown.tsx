// components/countdown/Countdown.tsx
"use client";

import { useEffect, useState, useMemo } from "react";

// Date de départ fixe (fuseau horaire explicite : Europe/Brussels = UTC+2 en été)
const DEPARTURE_DATE = "2026-08-29T15:00:00+02:00";

interface TimeUnitProps {
  value: number;
  label: string;
}

function TimeUnit({ value, label }: TimeUnitProps) {
  return (
    <div className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 md:px-6 md:py-4 min-w-[72px] md:min-w-[96px]">
      <span className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  );
}

export function Countdown() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const targetTime = new Date(DEPARTURE_DATE).getTime();

    const update = () => {
      const now = Date.now();
      const difference = targetTime - now;
      setRemaining(Math.max(0, difference));
    };

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeUnits = useMemo(() => {
    if (remaining === null || remaining <= 0) {
      return null;
    }

    const totalSeconds = Math.floor(remaining / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds };
  }, [remaining]);

  // État initial (SSR safe)
  if (remaining === null) {
    return (
      <div className="flex items-center justify-center gap-3 md:gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 md:px-6 md:py-4 min-w-[72px] md:min-w-[96px] animate-pulse"
          >
            <div className="h-8 md:h-12 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Date dépassée
  if (remaining <= 0) {
    return (
      <div className="inline-flex items-center justify-center gap-3 bg-orange-600/20 border border-orange-500/30 text-orange-400 font-semibold px-6 py-3 rounded-full backdrop-blur-sm">
        <span className="text-lg">🚢</span>
        <span>Départ en cours</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
      <TimeUnit value={timeUnits!.days} label="Jours" />
      <TimeUnit value={timeUnits!.hours} label="Heures" />
      <TimeUnit value={timeUnits!.minutes} label="Minutes" />
      <TimeUnit value={timeUnits!.seconds} label="Secondes" />
    </div>
  );
}
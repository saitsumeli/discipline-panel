"use client";

import { useEffect, useState } from "react";
import type { Habit, HabitTodayStatus } from "@/types/habit";

type Props = {
  habit: Habit;
  onUpdateStatus: (habitId: string, status: HabitTodayStatus) => void;
  onDeleteHabit: (habitId: string) => void;
};

function formatElapsedTime(createdAt: string, now: number) {
  const start = new Date(createdAt).getTime();
  const diffMs = Math.max(now - start, 0);
  return formatCompactDuration(Math.floor(diffMs / 1000));
}

function formatCompactDuration(totalSeconds: number) {
  const safeSeconds = Math.max(totalSeconds, 0);
  const days = Math.floor(safeSeconds / 86400);
  const hours = Math.floor((safeSeconds % 86400) / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (days > 0) {
    return `${days}g ${String(hours).padStart(2, "0")}s`;
  }

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

function formatCreatedAtParts(createdAt: string) {
  const date = new Date(createdAt);

  return {
    date: date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }),
    time: date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function getStatusLabel(status: HabitTodayStatus) {
  if (status === "done") return "Tamamlandı";
  if (status === "missed") return "Kaçırıldı";
  return "Bekliyor";
}

function getStatusTone(status: HabitTodayStatus) {
  if (status === "done") {
    return "border-emerald-400/15 bg-emerald-400/8 text-emerald-100";
  }

  if (status === "missed") {
    return "border-rose-400/15 bg-rose-400/8 text-rose-100";
  }

  return "border-slate-200/10 bg-slate-200/5 text-slate-200";
}

export default function HabitItemCard({
  habit,
  onUpdateStatus,
  onDeleteHabit,
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  const createdAtParts = formatCreatedAtParts(habit.createdAt);
  const elapsedTime = formatElapsedTime(habit.createdAt, now);
  const bestValue =
    habit.kind === "quit"
      ? formatCompactDuration(habit.longestStreak)
      : `${habit.longestStreak} gün`;
  const statusLabel = getStatusLabel(habit.todayStatus);
  const statusTone = getStatusTone(habit.todayStatus);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="panel-surface relative flex h-full w-full flex-col overflow-hidden rounded-[30px] p-5">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-24 rounded-b-[28px] bg-gradient-to-b from-white/[0.04] to-transparent" />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                {habit.kind === "build" ? "Rutin" : "Bırakma"}
              </span>
              <span className="text-xs text-slate-500">{habit.category}</span>
              <span className="text-xs text-slate-500">
                {habit.isShareable ? "Partnerle paylaşılabilir" : "Özel"}
              </span>
            </div>

            <p className="mt-4 max-w-[12ch] text-[28px] font-semibold leading-[1.02] tracking-[-0.05em] text-slate-50">
              {habit.name}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onDeleteHabit(habit.id)}
            className="panel-button-secondary shrink-0 rounded-full px-3 py-2 text-[11px] font-medium transition hover:bg-slate-800"
          >
            Sil
          </button>
        </div>

        <div className="mt-6 rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(9,14,28,0.98),rgba(6,10,21,0.96))] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500">
            Geçen süre
          </p>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            {habit.kind === "build"
              ? "Bugünkü ilerleme canlı olarak akıyor."
              : "Bırakma süresi canlı olarak akıyor."}
          </p>
          <p className="mt-4 font-mono text-[clamp(2.1rem,5vw,2.5rem)] font-semibold leading-none tracking-[-0.06em] tabular-nums text-slate-50">
            {elapsedTime}
          </p>
        </div>

        <div className="mt-4 space-y-2.5">
          <div className="rounded-[22px] border border-white/8 bg-white/[0.02] px-4 py-3.5">
            <p className="text-[10px] font-medium tracking-[0.04em] text-slate-500">
              Başlangıç
            </p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="font-mono text-[clamp(1rem,3.2vw,1.15rem)] font-medium leading-none tabular-nums text-slate-100">
                {createdAtParts.date}
              </p>
              <p className="font-mono text-[clamp(0.85rem,2.5vw,0.95rem)] leading-none tabular-nums text-slate-500">
                {createdAtParts.time}
              </p>
            </div>
          </div>

          <div className="rounded-[22px] border border-white/8 bg-white/[0.02] px-4 py-3.5">
            <p className="text-[10px] font-medium tracking-[0.04em] text-slate-500">
              {habit.kind === "quit" ? "En iyi süre" : "Rekor"}
            </p>
            <p className="mt-2.5 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[clamp(1.45rem,4.8vw,1.95rem)] font-semibold leading-none tracking-[-0.04em] tabular-nums text-slate-50">
              {bestValue}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.02] px-4 py-3.5">
          <p className="text-[10px] font-medium tracking-[0.04em] text-slate-500">
            Bugünkü durum
          </p>
          <div className="mt-3">
            <span
              className={`inline-flex rounded-full border px-3 py-1.5 text-[12px] font-medium ${statusTone}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-5">
          {habit.kind === "build" ? (
            <>
              <button
                type="button"
                onClick={() => onUpdateStatus(habit.id, "done")}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-105"
              >
                Yaptım
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus(habit.id, "missed")}
                className="w-full rounded-2xl bg-gradient-to-r from-rose-400 to-rose-500 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-105"
              >
                Yapmadım
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onUpdateStatus(habit.id, "missed")}
              className="w-full rounded-[20px] border border-rose-400/20 bg-gradient-to-r from-rose-500/95 via-orange-400/95 to-amber-300/95 px-4 py-3.5 text-base font-semibold text-slate-950 shadow-[0_18px_40px_rgba(251,113,133,0.2)] transition hover:brightness-105"
            >
              Bugün bozdum
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

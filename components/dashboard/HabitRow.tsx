"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  getHabitPrimaryActionLabel,
  getHabitPrimaryMetric,
  getHabitProgressHeadline,
  getHabitProgressSupport,
  getHabitStatusLabel,
  getHabitStatusTone,
  getHabitTypeLabel,
  getHabitTypeTone,
  isHabitPartnerVisible,
} from "@/app/lib/habits/presentation";
import type { Habit } from "@/types/habit";

type HabitRowProps = {
  habit: Habit;
  actionLabel?: string;
  actionTone?: "primary" | "secondary" | "danger";
  actionDisabled?: boolean;
  onAction?: () => void;
  extra?: ReactNode;
  manageHref?: string;
  onArchive?: () => void;
  onDelete?: () => void;
};

export default function HabitRow({
  habit,
  actionLabel,
  actionTone = "primary",
  actionDisabled = false,
  onAction,
  extra,
  manageHref,
  onArchive,
  onDelete,
}: HabitRowProps) {
  const [referenceNow, setReferenceNow] = useState(() => Date.now());
  const statusLabel = getHabitStatusLabel(habit.todayStatus);
  const resolvedActionLabel = actionLabel ?? getHabitPrimaryActionLabel(habit);
  const referenceDate = new Date(referenceNow);
  const primaryMetric = getHabitPrimaryMetric(habit, referenceDate);
  const progressHeadline = getHabitProgressHeadline(habit, referenceDate);
  const progressSupport = getHabitProgressSupport(habit);
  const hasManagementActions = Boolean(manageHref || onArchive || onDelete);

  useEffect(() => {
    if (habit.kind !== "quit") return;

    const interval = window.setInterval(() => {
      setReferenceNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [habit.kind]);

  return (
    <div className="panel-list-row rounded-[26px] px-4 py-4 transition hover:border-white/12 hover:bg-white/[0.035]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-50">{habit.name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getHabitTypeTone(
                    habit
                  )}`}
                >
                  {getHabitTypeLabel(habit)}
                </span>
                <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-400">
                  {habit.category}
                </span>
                {habit.kind === "build" ? (
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getHabitStatusTone(
                      habit.todayStatus
                    )}`}
                  >
                    {statusLabel}
                  </span>
                ) : (
                  <span className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-100">
                    Canlı sayaç
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0">
              <p
                className={`font-semibold tracking-tight text-slate-50 ${
                  habit.kind === "quit" ? "font-mono text-xl tabular-nums" : "text-xl"
                }`}
              >
                {primaryMetric}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {habit.kind === "quit" ? "Geçen süre" : "Aktif seri"}
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm font-medium text-slate-200">{progressHeadline}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <span>{progressSupport}</span>
            {isHabitPartnerVisible(habit) ? (
              <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-400">
                Partner görebilir
              </span>
            ) : (
              <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-500">
                Gizli
              </span>
            )}
          </div>
        </div>

        <div className="flex max-w-full shrink-0 flex-wrap items-center gap-2 self-start xl:self-center">
          {extra}
          {onAction ? (
            <button
              type="button"
              disabled={actionDisabled}
              onClick={onAction}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                actionTone === "primary"
                  ? "panel-button-primary"
                  : actionTone === "danger"
                    ? "border border-rose-400/15 bg-rose-500/10 text-rose-100"
                    : "panel-button-secondary"
              } ${actionDisabled ? "opacity-70" : ""}`}
            >
              {resolvedActionLabel}
            </button>
          ) : null}

          {hasManagementActions ? (
            <details className="group relative">
              <summary className="panel-button-secondary list-none rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-200">
                Yönet
              </summary>

              <div className="panel-surface absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[170px] rounded-2xl p-2 shadow-[0_20px_40px_rgba(2,6,23,0.32)]">
                {manageHref ? (
                  <Link
                    href={manageHref}
                    className="block rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-white/[0.04]"
                  >
                    Düzenle
                  </Link>
                ) : null}
                {onArchive ? (
                  <button
                    type="button"
                    onClick={onArchive}
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/[0.04]"
                  >
                    Arşivle
                  </button>
                ) : null}
                {onDelete ? (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm text-rose-100 transition hover:bg-rose-500/10"
                  >
                    Sil
                  </button>
                ) : null}
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </div>
  );
}

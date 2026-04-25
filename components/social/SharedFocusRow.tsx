"use client";

import { useEffect, useState } from "react";
import {
  getSharedHabitCurrentStreak,
  getSharedHabitMomentumLabel,
  getSharedHabitPartnerStatus,
  getSharedHabitStatusLabel,
  getSharedHabitStatusTone,
  getSharedHabitTodaySummary,
  getSharedHabitTypeLabel,
  getSharedHabitTypeTone,
  getSharedQuitMemberElapsedLabel,
  getSharedQuitSharedElapsedLabel,
  getTodayStatusForSharedHabit,
} from "@/app/lib/social/helpers";
import { useAppState } from "@/components/providers/AppStateProvider";
import type { SharedHabit } from "@/types/social";

type SharedFocusRowProps = {
  sharedHabit: SharedHabit;
};

export default function SharedFocusRow({ sharedHabit }: SharedFocusRowProps) {
  const { state, currentUser, updateSharedHabitStatus } = useAppState();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (sharedHabit.kind !== "quit") return;

    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [sharedHabit.kind]);

  if (!currentUser) return null;

  const myStatus = getTodayStatusForSharedHabit(state, sharedHabit.id, currentUser.id);
  const partnerSnapshot = getSharedHabitPartnerStatus(state, sharedHabit.id, currentUser.id);
  const summary = getSharedHabitTodaySummary(state, sharedHabit, currentUser.id);
  const isQuitHabit = sharedHabit.kind === "quit";
  const actionLabel = myStatus === "done" ? "Tamamlandı" : "Bugünü tamamla";
  const partnerUser = partnerSnapshot?.user;

  return (
    <div className="panel-list-row rounded-[26px] px-4 py-4 transition hover:border-white/12 hover:bg-white/[0.035]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-50">
                {sharedHabit.name}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getSharedHabitTypeTone(
                    sharedHabit
                  )}`}
                >
                  {getSharedHabitTypeLabel(sharedHabit)}
                </span>
                <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-400">
                  {sharedHabit.category}
                </span>
                <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-300">
                  {isQuitHabit
                    ? `${getSharedHabitCurrentStreak(state, sharedHabit)} gün temiz`
                    : `${getSharedHabitCurrentStreak(state, sharedHabit)} gün ortak seri`}
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <p
                className={`font-semibold tracking-tight text-slate-50 ${
                  sharedHabit.kind === "quit" ? "text-2xl" : "text-xl"
                }`}
              >
                {getSharedHabitMomentumLabel(state, sharedHabit, now)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {sharedHabit.kind === "quit" ? "Temiz geçen süre" : "Bugünkü ortak tempo"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isQuitHabit ? (
              <>
                <span className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
                  Sen: {getSharedQuitMemberElapsedLabel(state, sharedHabit, currentUser.id, now)}
                </span>
                {partnerUser ? (
                  <span className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
                    {partnerUser.displayName}:{" "}
                    {getSharedQuitMemberElapsedLabel(
                      state,
                      sharedHabit,
                      partnerUser.id,
                      now
                    )}
                  </span>
                ) : null}
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-slate-200">
                  Ortak: {getSharedQuitSharedElapsedLabel(state, sharedHabit, now)}
                </span>
              </>
            ) : (
              <>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getSharedHabitStatusTone(
                    myStatus
                  )}`}
                >
                  Sen: {getSharedHabitStatusLabel(myStatus)}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getSharedHabitStatusTone(
                    partnerSnapshot?.status ?? "pending"
                  )}`}
                >
                  {partnerSnapshot?.user?.displayName ?? "Partner"}:{" "}
                  {getSharedHabitStatusLabel(partnerSnapshot?.status ?? "pending")}
                </span>
              </>
            )}
          </div>

          <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${summary.tone}`}>
            <p className="font-medium">{summary.label}</p>
            <p className="mt-1 text-xs opacity-80">{summary.detail}</p>
          </div>
        </div>

        <div className="flex max-w-full shrink-0 flex-wrap items-center gap-3 self-start xl:self-center">
          {isQuitHabit ? (
            <button
              type="button"
              onClick={() => updateSharedHabitStatus(sharedHabit.id, "missed")}
              className="rounded-xl border border-rose-400/15 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-100"
            >
              Bozuldu
            </button>
          ) : (
            <button
              type="button"
              disabled={myStatus === "done"}
              onClick={() => updateSharedHabitStatus(sharedHabit.id, "done")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                myStatus === "done" ? "panel-button-secondary opacity-70" : "panel-button-primary"
              }`}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

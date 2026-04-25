"use client";

import { useEffect, useState } from "react";
import {
  formatDisplayDate,
  getSharedHabitCurrentStreak,
  getSharedHabitElapsedLabel,
  getSharedHabitLongestStreak,
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
import SharedWeekStrip from "@/components/social/SharedWeekStrip";
import { useAppState } from "@/components/providers/AppStateProvider";
import type { SharedHabit } from "@/types/social";

type SharedHabitCardProps = {
  sharedHabit: SharedHabit;
  mode: "active" | "pending";
  onAccept?: () => void;
  onDecline?: () => void;
};

export default function SharedHabitCard({
  sharedHabit,
  mode,
  onAccept,
  onDecline,
}: SharedHabitCardProps) {
  const { state, currentUser, updateSharedHabitStatus } = useAppState();
  const [now, setNow] = useState(() => new Date());
  const currentStreak = getSharedHabitCurrentStreak(state, sharedHabit);
  const longestStreak = getSharedHabitLongestStreak(state, sharedHabit);
  const myStatus = currentUser
    ? getTodayStatusForSharedHabit(state, sharedHabit.id, currentUser.id)
    : "pending";
  const partnerSnapshot = currentUser
    ? getSharedHabitPartnerStatus(state, sharedHabit.id, currentUser.id)
    : null;
  const todaySummary = currentUser
    ? getSharedHabitTodaySummary(state, sharedHabit, currentUser.id)
    : null;
  const isQuitHabit = sharedHabit.kind === "quit";
  const partnerUser = partnerSnapshot?.user;
  const myCleanLabel =
    isQuitHabit && currentUser
      ? getSharedQuitMemberElapsedLabel(state, sharedHabit, currentUser.id, now)
      : null;
  const partnerCleanLabel =
    isQuitHabit && partnerUser
      ? getSharedQuitMemberElapsedLabel(state, sharedHabit, partnerUser.id, now)
      : null;
  const sharedCleanLabel = isQuitHabit
    ? getSharedQuitSharedElapsedLabel(state, sharedHabit, now)
    : null;
  const acceptedDate = sharedHabit.acceptedAt
    ? formatDisplayDate(sharedHabit.acceptedAt)
    : formatDisplayDate(sharedHabit.createdAt);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="panel-surface rounded-[28px] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
            {mode === "active" ? "Aktif ortak alışkanlık" : "Bekleyen ortak alışkanlık"}
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">
            {sharedHabit.name}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {sharedHabit.category} · {acceptedDate}
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-medium ${getSharedHabitTypeTone(
            sharedHabit
          )}`}
        >
          {getSharedHabitTypeLabel(sharedHabit)}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-400">
        {sharedHabit.note ??
          (isQuitHabit
            ? "Bozan kişinin temiz süresi ve ortak temiz süre sıfırlanır; diğer kişinin kişisel temiz süresi devam eder."
            : "İki taraf da aynı gün tamamladığında ortak seri birlikte ilerler.")}
      </p>

      <div className="mt-5 grid gap-3 lg:grid-cols-4">
        <div className="panel-surface-soft rounded-2xl px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            {isQuitHabit ? "Sen" : "Ortak seri"}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
            {isQuitHabit ? myCleanLabel ?? "-" : `${currentStreak} gün`}
          </p>
        </div>
        <div className="panel-surface-soft rounded-2xl px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            {isQuitHabit ? partnerUser?.displayName ?? "Partner" : "Kabulden beri"}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
            {isQuitHabit
              ? partnerCleanLabel ?? "-"
              : getSharedHabitElapsedLabel(sharedHabit, now)}
          </p>
        </div>
        <div className="panel-surface-soft rounded-2xl px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            {isQuitHabit ? "Ortak temiz süre" : "En güçlü seri"}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
            {isQuitHabit ? sharedCleanLabel ?? "-" : `${longestStreak} gün`}
          </p>
        </div>
        <div className="panel-surface-soft rounded-2xl px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            {isQuitHabit ? "Ortak durum" : "Partner durumu"}
          </p>
          <p className="mt-2 text-sm font-medium text-slate-200">
            {isQuitHabit
              ? "Temiz sayaç açık"
              : `${partnerSnapshot?.user?.displayName ?? "Partner"} · ${getSharedHabitStatusLabel(
                  partnerSnapshot?.status ?? "pending"
                )}`}
          </p>
        </div>
      </div>

      {mode === "active" ? (
        <div className="mt-5 space-y-4">
          {todaySummary ? (
            <div className={`rounded-2xl border px-4 py-4 text-sm ${todaySummary.tone}`}>
              <p className="font-medium">{todaySummary.label}</p>
              <p className="mt-1 text-xs opacity-80">{todaySummary.detail}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {isQuitHabit ? (
              <span className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
                Otomatik temiz sayaç
              </span>
            ) : (
              <>
                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${getSharedHabitStatusTone(
                    myStatus
                  )}`}
                >
                  Sen: {getSharedHabitStatusLabel(myStatus)}
                </span>
                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${getSharedHabitStatusTone(
                    partnerSnapshot?.status ?? "pending"
                  )}`}
                >
                  {partnerSnapshot?.user?.displayName ?? "Partner"}:{" "}
                  {getSharedHabitStatusLabel(partnerSnapshot?.status ?? "pending")}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {!isQuitHabit ? (
              <button
                type="button"
                onClick={() => updateSharedHabitStatus(sharedHabit.id, "done")}
                className="panel-button-primary rounded-2xl px-4 py-3 text-sm font-semibold"
              >
                Ben tamamladım
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => updateSharedHabitStatus(sharedHabit.id, "missed")}
              className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100"
            >
              {isQuitHabit ? "Bozuldu / sıfırla" : "Bugün kaçtı"}
            </button>
          </div>

          {!isQuitHabit ? (
            <div className="panel-surface-soft rounded-[24px] px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Son 7 gün görünümü
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Yalnızca iki tarafın da tamamladığı günler birlikte sayılır.
              </p>
              <div className="mt-4">
                <SharedWeekStrip
                  state={state}
                  sharedHabit={sharedHabit}
                  currentUserId={currentUser?.id ?? ""}
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onAccept}
            className="panel-button-primary rounded-2xl px-4 py-3 text-sm font-semibold"
          >
            Ortak alışkanlığı kabul et
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="panel-button-secondary rounded-2xl px-4 py-3 text-sm font-semibold"
          >
            Şimdilik alma
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import AddHabitCard from "@/components/dashboard/AddHabitCard";
import DailyFocusCard from "@/components/dashboard/DailyFocusCard";
import DemoUserSwitcher from "@/components/panel/DemoUserSwitcher";
import PanelShell from "@/components/panel/PanelShell";
import PartnerStatusCard from "@/components/dashboard/PartnerStatusCard";
import SharedPreviewCard from "@/components/dashboard/SharedPreviewCard";
import { useAppState } from "@/components/providers/AppStateProvider";
import {
  getActivePersonalStreak,
  isHabitActive,
} from "@/app/lib/habits/presentation";
import { formatWeightValue } from "@/app/lib/body/weightStorage";
import { useWeightProgress } from "@/app/lib/body/useWeightProgress";
import { getHighestSharedStreakForUser } from "@/app/lib/social/helpers";
import type { HabitDraft } from "@/types/habit";

function formatTodayLabel() {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export default function DashboardPage() {
  const {
    state,
    currentPartner,
    currentUserHabits,
    activeSharedHabits,
    addHabit,
    archiveHabit,
    deleteHabit,
    updateHabitStatus,
  } = useAppState();
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const { weightProgress, storageMode, isLoading: isWeightLoading } = useWeightProgress(
    state.currentUserId
  );
  const activeHabits = currentUserHabits.filter(isHabitActive);
  const completedToday = activeHabits.filter((habit) => habit.todayStatus === "done").length;
  const activeStreak = getActivePersonalStreak(activeHabits);
  const sharedStreak = getHighestSharedStreakForUser(state, state.currentUserId);

  const handleAddHabit = async (draft: HabitDraft) => {
    await addHabit(draft);
    return true;
  };

  return (
    <PanelShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              {formatTodayLabel()}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
              Bugünkü akış
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Bugün neyi tamamlayacağını, seri durumunu ve partner akışını tek bakışta gör.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DemoUserSwitcher compact />
            <button
              type="button"
              onClick={() => setIsAddHabitOpen(true)}
              className="panel-button-primary rounded-2xl px-4 py-3 text-sm font-semibold"
            >
              + Yeni alışkanlık
            </button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="panel-surface rounded-[24px] p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Bugün tamamlanan
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
              {completedToday}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {activeHabits.length} aktif alışkanlığın içinde
            </p>
          </div>

          <div className="panel-surface rounded-[24px] p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Aktif seri
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
              {activeStreak} gün
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Kişisel alışkanlıklar içindeki en güçlü seri
            </p>
          </div>

          <div className="panel-surface rounded-[24px] p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Ortak seri
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
              {sharedStreak} gün
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {currentPartner
                ? `${currentPartner.displayName} ile canlı ortak akış`
                : "Partner bağlantısı kurulduğunda başlar"}
            </p>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <div className="space-y-6">
            <DailyFocusCard
              habits={activeHabits}
              onCompleteHabit={(habitId) => updateHabitStatus(habitId, "done")}
              onResetQuitHabit={(habitId) => updateHabitStatus(habitId, "missed")}
              onArchiveHabit={archiveHabit}
              onDeleteHabit={deleteHabit}
            />
          </div>

          <div className="space-y-6">
            <PartnerStatusCard
              partner={currentPartner}
              sharedHabitCount={activeSharedHabits.length}
            />

            <SharedPreviewCard
              state={state}
              currentUserId={state.currentUserId}
              sharedHabits={activeSharedHabits}
            />

            <section className="panel-surface rounded-[28px] p-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Kilo / vücut
              </p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-50">
                Mini özet
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Form ve detaylar ayrı sayfada. Burada sadece son durum gösterilir.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4">
                <div>
                  <p className="text-xs text-slate-500">Güncel durum</p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">
                    {weightProgress
                      ? `${formatWeightValue(weightProgress.currentWeight)} kg`
                      : isWeightLoading
                        ? "Yükleniyor"
                        : "Henüz kurulu değil"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {storageMode === "supabase" ? "Bulutta saklanıyor" : "Cihazda geçici"}
                  </p>
                </div>

                <Link
                  href="/body"
                  className="panel-button-secondary rounded-xl px-4 py-2.5 text-sm font-semibold"
                >
                  Detayı aç
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>

      <AddHabitCard
        onAddHabit={handleAddHabit}
        open={isAddHabitOpen}
        onOpenChange={setIsAddHabitOpen}
      />
    </PanelShell>
  );
}

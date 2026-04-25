"use client";

import Link from "next/link";
import PanelShell from "@/components/panel/PanelShell";
import DemoUserSwitcher from "@/components/panel/DemoUserSwitcher";
import { useAppState } from "@/components/providers/AppStateProvider";
import SharedFocusRow from "@/components/social/SharedFocusRow";
import SharedHabitCard from "@/components/social/SharedHabitCard";
import {
  getHighestSharedStreakForUser,
  getSharedHabitsCompletedTodayCount,
} from "@/app/lib/social/helpers";

export default function SharedSpacePage() {
  const {
    state,
    currentPartner,
    activeSharedHabits,
    pendingSharedInvitations,
    acceptSharedHabit,
    declineSharedHabit,
  } = useAppState();
  const totalSharedStreak = getHighestSharedStreakForUser(state, state.currentUserId);
  const syncedTodayCount = getSharedHabitsCompletedTodayCount(state, state.currentUserId);

  return (
    <PanelShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Ortak alan
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
              Ortak alışkanlık akışı
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Birlikte hangi ortak serilerin ilerlediğini ve nerede risk olduğunu buradan gör.
            </p>
          </div>

          <DemoUserSwitcher compact />
        </div>

        <section className="grid gap-4 xl:grid-cols-4">
          <div className="panel-surface rounded-[24px] p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Partner
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">
              {currentPartner ? currentPartner.displayName : "Bağlı değil"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {currentPartner ? "Ortak akış açık" : "Önce partner bağlantısı kur"}
            </p>
          </div>

          <div className="panel-surface rounded-[24px] p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Aktif ortak alışkanlık
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
              {activeSharedHabits.length}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Şu anda birlikte yürüyen hedef sayısı
            </p>
          </div>

          <div className="panel-surface rounded-[24px] p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              En güçlü ortak seri
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
              {totalSharedStreak} gün
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Bugüne kadar birlikte korunan en iyi ritim
            </p>
          </div>

          <div className="panel-surface rounded-[24px] p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Bugün senkron
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
              {syncedTodayCount}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              İkinizin de tamamladığı ortak hedef sayısı
            </p>
          </div>
        </section>

        {pendingSharedInvitations.length > 0 ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-200">Bekleyen ortak davetler</p>
                <p className="mt-2 text-sm text-slate-400">
                  Aktif akıştan ayrı tutuyoruz; önce hangi hedefi kabul edeceğine karar ver.
                </p>
              </div>
              <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
                {pendingSharedInvitations.length} davet
              </span>
            </div>

            <div className="grid gap-4">
              {pendingSharedInvitations.map((sharedHabit) => (
                <SharedHabitCard
                  key={sharedHabit.id}
                  sharedHabit={sharedHabit}
                  mode="pending"
                  onAccept={() => acceptSharedHabit(sharedHabit.id)}
                  onDecline={() => declineSharedHabit(sharedHabit.id)}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-200">Tüm ortak alışkanlıklar</p>
              <p className="mt-2 text-sm text-slate-400">
                Aktif ortak hedefleri tek listede canlı süreleriyle takip et.
              </p>
            </div>
            {currentPartner ? (
              <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
                {currentPartner.displayName} ile canlı görünüm
              </span>
            ) : null}
          </div>

          {activeSharedHabits.length > 0 ? (
            <div className="space-y-3">
              {activeSharedHabits.map((sharedHabit) => (
                <SharedFocusRow key={sharedHabit.id} sharedHabit={sharedHabit} />
              ))}
            </div>
          ) : (
            <div className="panel-surface rounded-[28px] p-6">
              <p className="text-base font-medium text-slate-100">
                Açık ortak alışkanlık yok
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {currentPartner
                  ? "Partner sayfasından paylaşılabilir bir alışkanlığı ortak hedefe dönüştürerek başlayabilirsin."
                  : "Önce bir partner bağlantısı kur, sonra ortak alan birlikte işlemeye başlasın."}
              </p>
              <Link
                href={currentPartner ? "/partner" : "/partner?tab=discover"}
                className="panel-button-secondary mt-5 inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold"
              >
                {currentPartner ? "Partner alanını aç" : "Partner bul"}
              </Link>
            </div>
          )}
        </section>
      </div>
    </PanelShell>
  );
}

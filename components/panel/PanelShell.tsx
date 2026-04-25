"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import Sidebar, { type SidebarGroup } from "@/components/dashboard/Sidebar";
import { useAppState } from "@/components/providers/AppStateProvider";
import { isHabitActive } from "@/app/lib/habits/presentation";
import { getHighestSharedStreakForUser } from "@/app/lib/social/helpers";

type PanelShellProps = {
  children: ReactNode;
};

export default function PanelShell({ children }: PanelShellProps) {
  const router = useRouter();
  const {
    state,
    currentUser,
    currentPartner,
    currentUserHabits,
    activeSharedHabits,
    incomingPartnerRequests,
    authResolved,
    isAuthenticated,
  } = useAppState();
  const highestSharedStreak = getHighestSharedStreakForUser(
    state,
    state.currentUserId
  );
  const activeHabits = currentUserHabits.filter(isHabitActive);
  const pendingBuildHabits = activeHabits.filter(
    (habit) => habit.kind === "build" && habit.todayStatus !== "done"
  );
  const sidebarGroups: SidebarGroup[] = [
    {
      title: "Navigasyon",
      items: [
        {
          label: "Dashboard",
          detail: "Bugünkü kontrol merkezi",
          href: "/dashboard",
          badge:
            pendingBuildHabits.length > 0
              ? {
                  label: `${pendingBuildHabits.length} kaldı`,
                  tone: "warning",
                }
              : undefined,
        },
        {
          label: "Alışkanlıklarım",
          detail: "Detaylı yönetim alanı",
          href: "/habits",
          badge:
            activeHabits.length > 0
              ? {
                  label: `${activeHabits.length} aktif`,
                  tone: "info",
                }
              : undefined,
        },
        {
          label: "Ortak Alan",
          detail:
            activeSharedHabits.length > 0
              ? `${activeSharedHabits.length} aktif ortak hedef`
              : "Ortak hedef özeti",
          href: "/shared-space",
          badge:
            activeSharedHabits.length > 0
              ? {
                  label: `${activeSharedHabits.length} aktif`,
                  tone: "active",
                }
              : undefined,
        },
        {
          label: "Partner",
          detail: currentPartner
            ? `${currentPartner.displayName} ile bağlantı`
            : "İstekler ve keşif",
          href: "/partner",
          badge: currentPartner
            ? {
                label: "aktif",
                tone: "active",
              }
            : incomingPartnerRequests.length > 0
              ? {
                  label: `${incomingPartnerRequests.length} istek`,
                  tone: "warning",
                }
              : undefined,
        },
        {
          label: "Kilo / Vücut",
          detail: "Trend ve hedef takibi",
          href: "/body",
        },
        {
          label: "Ayarlar",
          detail: "Tercihler ve demo kontrolü",
          href: "/settings",
        },
      ],
    },
  ];

  useEffect(() => {
    if (authResolved && !isAuthenticated) {
      router.replace("/");
    }
  }, [authResolved, isAuthenticated, router]);

  if (!authResolved || !isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="absolute right-16 top-24 h-72 w-72 rounded-full bg-sky-400/6 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-slate-200/4 blur-3xl" />
      </div>

      <div className="relative min-h-screen lg:flex">
        <Sidebar
          title="Disiplin Paneli"
          subtitle={
            currentPartner
              ? `${currentUser?.displayName ?? "Sen"} ve ${currentPartner.displayName} için ortak akış`
              : "Kişisel ritim ve partner akışını tek yerden yönet"
          }
          groups={sidebarGroups}
          summaryTitle="Ortak Seri"
          summaryValue={`${highestSharedStreak} gün`}
          summaryDescription={
            currentPartner
              ? activeSharedHabits.length > 0
                ? `${currentPartner.displayName} ile senkron akış sürüyor`
                : `${currentPartner.displayName} ile ortak hedef başlatılmayı bekliyor`
              : "Partner bağlantısı kurulduğunda ortak seri burada görünür"
          }
        />

        <section className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </section>
      </div>
    </main>
  );
}

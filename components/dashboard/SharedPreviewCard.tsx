"use client";

import Link from "next/link";
import {
  getSharedHabitCurrentStreak,
  getSharedHabitPartnerStatus,
  getSharedQuitSharedElapsedLabel,
} from "@/app/lib/social/helpers";
import type { SharedHabit, SocialGraphState } from "@/types/social";

type SharedPreviewCardProps = {
  state: SocialGraphState;
  currentUserId: string;
  sharedHabits: SharedHabit[];
};

export default function SharedPreviewCard({
  state,
  currentUserId,
  sharedHabits,
}: SharedPreviewCardProps) {
  const previewHabits = sharedHabits.slice(0, 2);

  return (
    <section className="panel-surface rounded-[28px] p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Ortak alışkanlıklar
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">
            Kısa görünüm
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Detaya boğmadan yalnızca aktif ortak akışların özetini gösterir.
          </p>
        </div>

        <Link
          href="/shared-space"
          className="text-sm font-medium text-slate-300 transition hover:text-slate-100"
        >
          Detayı aç
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {previewHabits.length > 0 ? (
          previewHabits.map((sharedHabit) => {
            const partnerSnapshot = getSharedHabitPartnerStatus(
              state,
              sharedHabit.id,
              currentUserId
            );

            return (
              <div
                key={sharedHabit.id}
                className="panel-list-row rounded-2xl px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-medium text-slate-100">
                      {sharedHabit.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {sharedHabit.kind === "quit"
                        ? `${getSharedQuitSharedElapsedLabel(
                            state,
                            sharedHabit
                          )} birlikte temiz`
                        : `${getSharedHabitCurrentStreak(state, sharedHabit)} gün ortak seri`}
                    </p>
                  </div>

                  <p className="text-sm text-slate-400">
                    {sharedHabit.kind === "quit" ? (
                      <span className="text-slate-100">Temiz sayaç akıyor</span>
                    ) : (
                      <>
                        {partnerSnapshot?.user?.displayName ?? "Partner"} bugün{" "}
                        <span className="text-slate-100">
                          {partnerSnapshot?.status === "done" ? "tamamladı" : "bekliyor"}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
            <p className="text-base font-medium text-slate-100">
              Henüz ortak alışkanlık yok
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Partnerinin paylaşılabilir alışkanlıklarından birini ortak akışa
              dönüştürdüğünde burada göreceksin.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

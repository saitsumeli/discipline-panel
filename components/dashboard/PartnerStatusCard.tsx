"use client";

import Link from "next/link";
import type { AppUser } from "@/types/social";

type PartnerStatusCardProps = {
  partner: AppUser | null;
  sharedHabitCount: number;
};

export default function PartnerStatusCard({
  partner,
  sharedHabitCount,
}: PartnerStatusCardProps) {
  const hasPartner = Boolean(partner);

  return (
    <section className="panel-surface rounded-[28px] p-6">
      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
        Partner durumu
      </p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">
        {hasPartner ? `${partner?.displayName} ile bağlantı aktif` : "Henüz partnerin yok"}
      </h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        {hasPartner
          ? `${sharedHabitCount} ortak alışkanlık akışı açık. Yeni davetler ve paylaşılabilir hedefler Partner sayfasında.`
          : "Partner bulduğunda ortak alışkanlık ve ortak seri akışı açılacak."}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4">
        <div>
          <p className="text-xs text-slate-500">
            {hasPartner ? "Ortak alışkanlık" : "Sonraki adım"}
          </p>
          <p className="mt-1 text-base font-medium text-slate-100">
            {hasPartner ? `${sharedHabitCount} aktif akış` : "Partner bul"}
          </p>
        </div>

        <Link
          href={hasPartner ? "/shared-space" : "/partner?tab=discover"}
          className="panel-button-secondary rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          {hasPartner ? "Ortak alanı aç" : "Partner bul"}
        </Link>
      </div>
    </section>
  );
}

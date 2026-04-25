"use client";

import DemoUserSwitcher from "@/components/panel/DemoUserSwitcher";
import PanelShell from "@/components/panel/PanelShell";
import { useAppState } from "@/components/providers/AppStateProvider";

export default function SettingsPage() {
  const { refreshState, currentPartner, activeSharedHabits } = useAppState();

  return (
    <PanelShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Tercihler
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
              Ayarlar
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Hesabını, partner durumunu ve çalışma alanı görünümünü buradan kontrol et.
            </p>
          </div>

          <DemoUserSwitcher compact />
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="panel-surface rounded-[28px] p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Veri senkronu
            </p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-50">
              Verileri yenile
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Partner istekleri, ortak akışlar ve kişisel alışkanlıklar Supabase&apos;den tekrar okunur.
            </p>
            <button
              type="button"
              onClick={() => {
                void refreshState();
              }}
              className="panel-button-primary mt-5 rounded-2xl px-4 py-3 text-sm font-semibold"
            >
              Verileri yenile
            </button>
          </div>

          <div className="panel-surface rounded-[28px] p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Durum özeti
            </p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-50">
              Mevcut çalışma alanı
            </h3>
            <div className="mt-5 space-y-3 text-sm text-slate-400">
              <p>
                Partner:{" "}
                <span className="text-slate-100">
                  {currentPartner ? currentPartner.displayName : "Bağlı değil"}
                </span>
              </p>
              <p>
                Aktif ortak alışkanlık:{" "}
                <span className="text-slate-100">{activeSharedHabits.length}</span>
              </p>
              <p>
                Tema: <span className="text-slate-100">Koyu / sade premium</span>
              </p>
            </div>
          </div>
        </section>
      </div>
    </PanelShell>
  );
}

"use client";

import WeightProgressCard from "@/components/dashboard/WeightProgressCard";
import DemoUserSwitcher from "@/components/panel/DemoUserSwitcher";
import PanelShell from "@/components/panel/PanelShell";
import { useAppState } from "@/components/providers/AppStateProvider";
import { formatWeightValue } from "@/app/lib/body/weightStorage";
import { useWeightProgress } from "@/app/lib/body/useWeightProgress";

export default function BodyPage() {
  const { state } = useAppState();
  const {
    weightProgress,
    storageMode,
    isLoading,
    isSaving,
    errorMessage,
    initializeWeight,
    updateWeight,
    resetWeight,
  } = useWeightProgress(state.currentUserId);

  return (
    <PanelShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Vücut takibi
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
              Kilo / Vücut
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Grafik, geçmiş kayıtlar ve hedef çizgisi bu sayfada kalır.
            </p>
          </div>

          <DemoUserSwitcher compact />
        </div>

        {errorMessage ? (
          <section className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
            {errorMessage}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="panel-surface rounded-[24px] p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Güncel kilo
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
              {weightProgress
                ? `${formatWeightValue(weightProgress.currentWeight)} kg`
                : "Kurulmadı"}
            </p>
          </div>
          <div className="panel-surface rounded-[24px] p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Hedef kilo
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
              {weightProgress
                ? `${formatWeightValue(weightProgress.targetWeight)} kg`
                : isLoading
                  ? "Yükleniyor"
                  : "-"}
            </p>
          </div>
          <div className="panel-surface rounded-[24px] p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Saklama
            </p>
            <p className="mt-3 text-lg font-semibold tracking-tight text-slate-50">
              {storageMode === "supabase" ? "Supabase" : "Yerel yedek"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {weightProgress
                ? new Date(weightProgress.updatedAt).toLocaleDateString("tr-TR")
                : "Henüz kayıt yok"}
            </p>
          </div>
        </section>

        <WeightProgressCard
          key={`${state.currentUserId}-${weightProgress?.updatedAt ?? "empty"}`}
          weightProgress={weightProgress}
          isSaving={isSaving}
          onInitializeWeight={initializeWeight}
          onUpdateWeight={updateWeight}
          onResetWeight={resetWeight}
        />
      </div>
    </PanelShell>
  );
}

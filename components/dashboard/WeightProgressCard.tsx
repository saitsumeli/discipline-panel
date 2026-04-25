"use client";

import { useState } from "react";
import type { WeightProgress } from "@/types/weight";

type WeightProgressCardProps = {
  weightProgress: WeightProgress | null;
  isSaving?: boolean;
  onInitializeWeight: (startWeight: number, targetWeight: number) => Promise<void>;
  onUpdateWeight: (nextWeight: number) => Promise<void>;
  onResetWeight: () => Promise<void>;
};

function formatWeight(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildSparklinePoints(values: number[]) {
  if (values.length === 0) return "";

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = values.length === 1 ? 100 : (index / (values.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function WeightProgressCard({
  weightProgress,
  isSaving = false,
  onInitializeWeight,
  onUpdateWeight,
  onResetWeight,
}: WeightProgressCardProps) {
  const [startWeight, setStartWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState(() =>
    weightProgress ? String(weightProgress.currentWeight).replace(".", ",") : ""
  );
  const [message, setMessage] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const handleInitialize = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    const parsedStartWeight = Number(startWeight.replace(",", "."));
    const parsedTargetWeight = Number(targetWeight.replace(",", "."));

    if (parsedStartWeight <= 0 || parsedTargetWeight <= 0) {
      setMessage("Başlangıç ve hedef kilo 0'dan büyük olmalı.");
      return;
    }

    try {
      await onInitializeWeight(parsedStartWeight, parsedTargetWeight);
      setMessage("Kilo takibi başlatıldı.");
      setStartWeight("");
      setTargetWeight("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kilo takibi kaydedilemedi.");
    }
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    const parsedWeight = Number(currentWeight.replace(",", "."));

    if (parsedWeight <= 0) {
      setMessage("Geçerli bir kilo gir.");
      return;
    }

    try {
      await onUpdateWeight(parsedWeight);
      setMessage("Güncel kilo kaydedildi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Güncel kilo kaydedilemedi.");
    }
  };

  if (!weightProgress) {
    return (
      <div id="weight-module" className="panel-surface rounded-[28px] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Vücut verisi
            </p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-50">
              Kilo takibi
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              İlk kurulumda başlangıç ve hedef kilonu gir, sonra gelişimi buradan
              güncelleyelim.
            </p>
          </div>

          <span className="panel-chip rounded-full px-3 py-1 text-[11px] font-medium text-slate-300">
            Hazırlanıyor
          </span>
        </div>

        <form onSubmit={handleInitialize} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-300">
                Başlangıç kilosu
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Örn: 87,5"
                value={startWeight}
                onChange={(event) => setStartWeight(event.target.value)}
                className="panel-input mt-2 w-full rounded-2xl px-4 py-3.5 text-slate-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300">Hedef kilo</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Örn: 78"
                value={targetWeight}
                onChange={(event) => setTargetWeight(event.target.value)}
                className="panel-input mt-2 w-full rounded-2xl px-4 py-3.5 text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="panel-button-primary flex h-12 w-full items-center justify-center rounded-2xl font-semibold"
          >
            {isSaving ? "Kaydediliyor..." : "Kilo takibini başlat"}
          </button>

          {message ? (
            <p className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-200">
              {message}
            </p>
          ) : null}
        </form>
      </div>
    );
  }

  const startDifference = weightProgress.currentWeight - weightProgress.startWeight;
  const targetDifference = weightProgress.currentWeight - weightProgress.targetWeight;
  const totalDistance = Math.abs(
    weightProgress.targetWeight - weightProgress.startWeight
  );
  const completedDistance = Math.abs(
    weightProgress.currentWeight - weightProgress.startWeight
  );
  const completionPercentage =
    totalDistance === 0
      ? 100
      : Math.min(Math.round((completedDistance / totalDistance) * 100), 100);
  const recentEntries = weightProgress.entries.slice(0, 3);
  const chartEntries = [...weightProgress.entries].slice(0, 7).reverse();
  const chartValues = chartEntries.map((entry) => entry.value);
  const sparklinePoints = buildSparklinePoints(chartValues);
  const chartMin = chartValues.length > 0 ? Math.min(...chartValues) : 0;
  const chartMax = chartValues.length > 0 ? Math.max(...chartValues) : 0;
  const previousEntry = weightProgress.entries[1];
  const lastDelta = previousEntry
    ? weightProgress.currentWeight - previousEntry.value
    : 0;

  return (
    <div id="weight-module" className="panel-surface rounded-[28px] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Vücut verisi
          </p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-50">
            Kilo takibi
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Başlangıç kilon kaydedildi. İlerledikçe güncel kilonu ekleyip
            değişimi takip edebilirsin.
          </p>
        </div>

        <span className="panel-chip rounded-full px-3 py-1 text-[11px] font-medium text-slate-300">
          Son: {formatDate(weightProgress.updatedAt)}
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(220px,0.9fr)]">
        <div className="panel-surface-soft rounded-2xl px-4 py-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                Güncel kilo
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-50">
                {formatWeight(weightProgress.currentWeight)} kg
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Son değişim
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-100">
                {previousEntry
                  ? `${lastDelta > 0 ? "+" : ""}${formatWeight(lastDelta)} kg`
                  : "Yeni kayıt"}
              </p>
            </div>
          </div>

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-800/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-slate-100 to-violet-200 transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-900/90 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Başlangıç
              </p>
              <p className="mt-2 font-medium text-slate-100">
                {formatWeight(weightProgress.startWeight)} kg
              </p>
            </div>
            <div className="rounded-xl bg-slate-900/90 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Hedef
              </p>
              <p className="mt-2 font-medium text-slate-100">
                {formatWeight(weightProgress.targetWeight)} kg
              </p>
            </div>
            <div className="rounded-xl bg-slate-900/90 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                İlerleme
              </p>
              <p className="mt-2 font-medium text-slate-100">%{completionPercentage}</p>
            </div>
          </div>
        </div>

        <div className="panel-surface-soft rounded-2xl px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
            Hızlı güncelle
          </p>
          <form onSubmit={handleUpdate} className="mt-4 space-y-3">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Örn: 84,8"
              value={currentWeight}
              onChange={(event) => setCurrentWeight(event.target.value)}
              className="panel-input w-full rounded-2xl px-4 py-3.5 text-slate-100"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="submit"
                disabled={isSaving}
                className="panel-button-primary rounded-2xl px-4 py-3 font-semibold"
              >
                {isSaving ? "Kaydediliyor..." : "Güncelle"}
              </button>
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className="panel-button-secondary rounded-2xl px-4 py-3 font-semibold"
              >
                {showDetails ? "Detayı gizle" : "Detayı aç"}
              </button>
            </div>

            {message ? (
              <p className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-200">
                {message}
              </p>
            ) : null}
          </form>
        </div>
      </div>

      <div className="panel-surface-soft mt-5 rounded-2xl px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-200">Kilo trendi</p>
            <p className="mt-1 text-xs text-slate-500">
              Son {chartEntries.length} ölçüm
            </p>
          </div>

          <div className="text-right text-xs text-slate-500">
            <p>Min {formatWeight(chartMin)} kg</p>
            <p className="mt-1">Max {formatWeight(chartMax)} kg</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-900/90 px-3 py-3">
          {chartEntries.length > 1 ? (
            <svg
              viewBox="0 0 100 100"
              className="h-28 w-full overflow-visible"
              preserveAspectRatio="none"
            >
              <polyline
                fill="none"
                stroke="rgba(148, 163, 184, 0.3)"
                strokeWidth="1"
                points="0,85 100,85"
              />
              <polyline
                fill="none"
                stroke="url(#weightLineGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparklinePoints}
              />
              <defs>
                <linearGradient id="weightLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#67e8f9" />
                  <stop offset="55%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#c4b5fd" />
                </linearGradient>
              </defs>
              {chartEntries.map((entry, index) => {
                const min = Math.min(...chartValues);
                const max = Math.max(...chartValues);
                const range = max - min || 1;
                const x =
                  chartEntries.length === 1
                    ? 100
                    : (index / (chartEntries.length - 1)) * 100;
                const y = 100 - ((entry.value - min) / range) * 100;

                return (
                  <circle
                    key={`${entry.recordedAt}-${entry.value}`}
                    cx={x}
                    cy={y}
                    r="2.8"
                    fill="#f8fafc"
                  />
                );
              })}
            </svg>
          ) : (
            <div className="flex h-28 items-center justify-center text-sm text-slate-500">
              Grafik için en az 2 ölçüm gerekli.
            </div>
          )}
        </div>
      </div>

      {showDetails ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="panel-surface-soft rounded-2xl px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Başlangıçtan fark
              </p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-50">
                {startDifference > 0 ? "+" : ""}
                {formatWeight(startDifference)} kg
              </p>
            </div>

            <div className="panel-surface-soft rounded-2xl px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Hedef farkı
              </p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-50">
                {targetDifference > 0 ? "+" : ""}
                {formatWeight(targetDifference)} kg
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                await onResetWeight();
                setMessage("Kilo verisi sıfırlandı.");
              } catch (error) {
                setMessage(
                  error instanceof Error ? error.message : "Kilo verisi sıfırlanamadı."
                );
              }
            }}
            disabled={isSaving}
            className="panel-button-secondary self-start rounded-2xl px-5 py-3 font-semibold transition hover:bg-slate-800"
          >
            {isSaving ? "Sıfırlanıyor..." : "Kilo verisini sıfırla"}
          </button>
        </div>
      ) : null}

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-300">Son kayıtlar</p>
        <div className="mt-3 space-y-2">
          {recentEntries.map((entry) => (
            <div
              key={`${entry.recordedAt}-${entry.value}`}
              className="panel-surface-soft flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-300"
            >
              <span>{formatDate(entry.recordedAt)}</span>
              <span className="font-medium text-slate-100">
                {formatWeight(entry.value)} kg
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

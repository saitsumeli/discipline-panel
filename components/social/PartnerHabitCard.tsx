"use client";

import { useState } from "react";
import type { Habit } from "@/types/habit";

type PartnerHabitCardProps = {
  habit: Habit;
  proposalStateLabel: string;
  canPropose: boolean;
  onPropose: () => Promise<void> | void;
};

function getProposalErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    const message = error.message.toLowerCase();

    if (
      message.includes("could not find the table") &&
      message.includes("shared_habits")
    ) {
      return "Ortak alışkanlık tablosu kurulmamış. Supabase SQL kurulumunu tamamlaman gerekiyor.";
    }

    if (
      message.includes("could not find the table") &&
      message.includes("shared_habit_members")
    ) {
      return "Ortak alışkanlık üyeleri tablosu kurulmamış. Supabase SQL kurulumunu tamamlaman gerekiyor.";
    }

    if (message.includes("row-level security")) {
      return "Birlikte yapalım isteği yetki nedeniyle gönderilemedi. Supabase policy ayarını kontrol et.";
    }

    return error.message;
  }

  return "Birlikte yapalım isteği gönderilemedi. Tekrar dene.";
}

export default function PartnerHabitCard({
  habit,
  proposalStateLabel,
  canPropose,
  onPropose,
}: PartnerHabitCardProps) {
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");

  const handlePropose = async () => {
    if (!canPropose || submitting) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      await onPropose();
      setFeedbackTone("success");
      setFeedback("Birlikte yapalım isteği gönderildi.");
    } catch (error) {
      setFeedbackTone("error");
      setFeedback(getProposalErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="panel-surface rounded-[28px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
            Paylaşılabilir alışkanlık
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">
            {habit.name}
          </h3>
          <p className="mt-2 text-sm text-slate-500">{habit.category}</p>
        </div>

        <span className="rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1 text-[11px] font-medium text-cyan-100">
          {habit.kind === "build" ? "Rutin" : "Bırakma"}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-400">
        {habit.note ?? "Partner kabul ederse ortak alışkanlığa dönüşebilecek akış."}
      </p>

      <button
        type="button"
        disabled={!canPropose || submitting}
        onClick={() => {
          void handlePropose();
        }}
        className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
          canPropose ? "panel-button-primary" : "panel-button-secondary opacity-70"
        }`}
      >
        {submitting
          ? "Gönderiliyor..."
          : canPropose
            ? "Birlikte yapalım"
            : proposalStateLabel}
      </button>

      {feedback ? (
        <p
          className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
            feedbackTone === "success"
              ? "border border-emerald-400/10 bg-emerald-400/5 text-emerald-200"
              : "border border-rose-400/10 bg-rose-400/5 text-rose-200"
          }`}
        >
          {feedback}
        </p>
      ) : null}
    </div>
  );
}

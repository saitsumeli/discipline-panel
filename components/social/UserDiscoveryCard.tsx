"use client";

import { useState } from "react";
import type { AppUser } from "@/types/social";

type UserDiscoveryCardProps = {
  user: AppUser;
  activeSeriesCount: number;
  shareableHabitCount: number;
  statusLabel: string;
  canSend: boolean;
  onSendRequest: () => Promise<void> | void;
};

function getPartnerRequestErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    const message = error.message.toLowerCase();

    if (message.includes("row-level security")) {
      return "Partner isteği yetki nedeniyle gönderilemedi. Supabase RLS policy ayarlarını kontrol et.";
    }

    if (
      message.includes("relation") &&
      message.includes("partner_requests") &&
      message.includes("does not exist")
    ) {
      return "Partner istek sistemi henüz kurulmamış. Supabase SQL kurulumunu tamamlayıp tekrar dene.";
    }

    if (message.includes("duplicate key") || message.includes("already exists")) {
      return "Bu kullanıcıya zaten bekleyen bir istek var.";
    }

    if (message.includes("foreign key")) {
      return "İstek gönderilemedi. Kullanıcı profilleri Supabase tarafında eksik olabilir.";
    }

    return error.message;
  }

  return "Partner isteği gönderilemedi. Tekrar dene.";
}

export default function UserDiscoveryCard({
  user,
  activeSeriesCount,
  shareableHabitCount,
  statusLabel,
  canSend,
  onSendRequest,
}: UserDiscoveryCardProps) {
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");

  const handleSendRequest = async () => {
    if (!canSend || submitting) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      await onSendRequest();
      setFeedbackTone("success");
      setFeedback("Partner isteği gönderildi.");
    } catch (error) {
      setFeedbackTone("error");
      setFeedback(getPartnerRequestErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="panel-surface flex h-full flex-col rounded-[28px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
            Aktif kullanıcı
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">
            {user.displayName}
          </h3>
          <p className="mt-2 text-sm text-slate-500">@{user.username}</p>
        </div>

        <span className="rounded-full border border-emerald-300/15 bg-emerald-300/8 px-3 py-1 text-[11px] font-medium text-emerald-100">
          Çevrimiçi
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-400">{user.bio}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="panel-surface-soft rounded-2xl px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Aktif seri
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
            {activeSeriesCount}
          </p>
        </div>

        <div className="panel-surface-soft rounded-2xl px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Paylaşılabilir hedef
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
            {shareableHabitCount}
          </p>
        </div>

        <div className="panel-surface-soft rounded-2xl px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Durum
          </p>
          <p className="mt-2 text-sm font-medium text-slate-200">{statusLabel}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{user.statusLine}</p>
        </div>
      </div>

      <div className="mt-auto pt-5">
        <button
          type="button"
          disabled={!canSend || submitting}
          onClick={() => {
            void handleSendRequest();
          }}
          className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            canSend
              ? "panel-button-primary"
              : "panel-button-secondary opacity-70"
          }`}
        >
          {submitting
            ? "Gönderiliyor..."
            : canSend
            ? "Partner isteği gönder"
            : statusLabel}
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
    </div>
  );
}

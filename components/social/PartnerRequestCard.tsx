"use client";

import { useState } from "react";
import { formatDisplayDate } from "@/app/lib/social/helpers";
import type { AppUser, PartnerRequest } from "@/types/social";

type PartnerRequestCardProps = {
  request: PartnerRequest;
  fromUser: AppUser | null;
  toUser: AppUser | null;
  direction: "incoming" | "outgoing";
  onAccept?: () => Promise<void> | void;
  onDecline?: () => Promise<void> | void;
  onCancel?: () => Promise<void> | void;
};

function getPartnerActionErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    const message = error.message.toLowerCase();

    if (message.includes("row-level security")) {
      return "Partner işlemi yetki nedeniyle tamamlanamadı. Supabase policy ayarlarını kontrol et.";
    }

    if (
      message.includes("relation") &&
      message.includes("partnerships") &&
      message.includes("does not exist")
    ) {
      return "Partner bağlantı tablosu henüz kurulmamış. Supabase'te `partnerships` SQL kurulumunu tamamlayıp tekrar dene.";
    }

    if (
      message.includes("could not find the table") &&
      message.includes("partnerships")
    ) {
      return "Partner bağlantı tablosu henüz kurulmamış. Supabase'te `partnerships` tablosunu oluşturman gerekiyor.";
    }

    if (message.includes("duplicate key") || message.includes("already exists")) {
      return "Bu kullanıcıyla partner bağlantısı zaten var. Sayfayı yenileyip tekrar kontrol et.";
    }

    return error.message;
  }

  return "Partner işlemi tamamlanamadı. Tekrar dene.";
}

export default function PartnerRequestCard({
  request,
  fromUser,
  toUser,
  direction,
  onAccept,
  onDecline,
  onCancel,
}: PartnerRequestCardProps) {
  const [submittingAction, setSubmittingAction] = useState<"accept" | "decline" | "cancel" | null>(
    null
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");
  const counterpart = direction === "incoming" ? fromUser : toUser;

  const handleAction = async (
    action: "accept" | "decline" | "cancel",
    callback: (() => Promise<void> | void) | undefined,
    successMessage: string
  ) => {
    if (!callback || submittingAction) return;

    setSubmittingAction(action);
    setFeedback(null);

    try {
      await callback();
      setFeedbackTone("success");
      setFeedback(successMessage);
    } catch (error) {
      setFeedbackTone("error");
      setFeedback(getPartnerActionErrorMessage(error));
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <div className="panel-surface rounded-[28px] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
            {direction === "incoming" ? "Gelen istek" : "Gönderilen istek"}
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">
            {counterpart?.displayName ?? "Kullanıcı"}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {formatDisplayDate(request.createdAt)}
          </p>
        </div>

        <span className="rounded-full border border-amber-300/15 bg-amber-300/8 px-3 py-1 text-[11px] font-medium text-amber-100">
          Beklemede
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-400">
        {request.message ??
          "Partner bağlantısı kurulursa paylaşılabilir alışkanlıklar ve ortak hedef akışı açılır."}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        {direction === "incoming" ? (
          <>
            <button
              type="button"
              disabled={submittingAction !== null}
              onClick={() => {
                void handleAction("accept", onAccept, "Partner isteği kabul edildi.");
              }}
              className="panel-button-primary rounded-2xl px-4 py-3 text-sm font-semibold"
            >
              {submittingAction === "accept" ? "Kabul ediliyor..." : "Kabul et"}
            </button>
            <button
              type="button"
              disabled={submittingAction !== null}
              onClick={() => {
                void handleAction("decline", onDecline, "Partner isteği reddedildi.");
              }}
              className="panel-button-secondary rounded-2xl px-4 py-3 text-sm font-semibold"
            >
              {submittingAction === "decline" ? "Reddediliyor..." : "Reddet"}
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={submittingAction !== null}
            onClick={() => {
              void handleAction("cancel", onCancel, "Partner isteği geri çekildi.");
            }}
            className="panel-button-secondary rounded-2xl px-4 py-3 text-sm font-semibold"
          >
            {submittingAction === "cancel" ? "Geri çekiliyor..." : "İsteği geri çek"}
          </button>
        )}
      </div>

      {feedback ? (
        <p
          className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
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

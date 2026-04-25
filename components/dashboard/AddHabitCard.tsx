"use client";

import { useState } from "react";
import type { HabitDraft, HabitVisibility } from "@/types/habit";

type AddHabitCardProps = {
  onAddHabit: (habit: HabitDraft) => Promise<boolean> | boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getAddHabitErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    const message = error.message.toLowerCase();

    if (
      message.includes("relation") &&
      message.includes("habits") &&
      message.includes("does not exist")
    ) {
      return "Alışkanlık sistemi henüz kurulmamış. Supabase SQL kurulumunu tamamlayıp tekrar dene.";
    }

    if (message.includes("column") && message.includes("habits")) {
      return "Alışkanlık tablosu eksik görünüyor. Supabase SQL kurulumunu tamamlayıp tekrar dene.";
    }

    if (
      message.includes("foreign key") ||
      message.includes("owner_user_id") ||
      message.includes("user_id")
    ) {
      return "Profil kaydın hazır değil. Çıkış yapıp tekrar giriş dene ya da SQL kurulumunu kontrol et.";
    }

    return error.message;
  }

  return "Alışkanlık eklenemedi. Tekrar dene.";
}

export default function AddHabitCard({
  onAddHabit,
  open,
  onOpenChange,
}: AddHabitCardProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Fitness");
  const [kind, setKind] = useState<"build" | "quit">("quit");
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState<HabitVisibility>("private");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setMessageTone("success");

    if (!name.trim()) {
      setMessageTone("error");
      setMessage("Alışkanlık adı boş olamaz.");
      return;
    }

    const newHabit: HabitDraft = {
      name: name.trim(),
      category,
      kind,
      note: note.trim() || undefined,
      isShareable: visibility === "partner_visible",
      visibility,
    };

    setSubmitting(true);
    let isAdded = false;

    try {
      isAdded = await onAddHabit(newHabit);
    } catch (error) {
      setMessageTone("error");
      setMessage(getAddHabitErrorMessage(error));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);

    if (!isAdded) {
      setMessageTone("error");
      setMessage("Alışkanlık eklenemedi. Tekrar dene.");
      return;
    }

    setMessageTone("success");
    setMessage("Alışkanlık eklendi.");

    setName("");
    setCategory("Fitness");
    setKind("quit");
    setNote("");
    setVisibility("private");
    onOpenChange(false);
  };

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          <div className="absolute right-0 top-0 h-full w-full max-w-xl border-l border-slate-800/80 bg-slate-950/92 p-6 shadow-[0_0_80px_rgba(2,6,23,0.7)] backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                  Yeni hedef
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">
                  Alışkanlık ekle
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Ritmine uygun yeni bir hedef tanımla ve akışa hemen ekle.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="panel-button-secondary rounded-full px-3 py-2 text-xs font-medium"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-300">
                  Alışkanlık adı
                </label>
                <input
                  type="text"
                  placeholder="Örn: Şeker yemiyorum"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="panel-input mt-2 w-full rounded-2xl px-4 py-3.5 text-slate-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-300">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="panel-input mt-2 w-full rounded-2xl px-4 py-3.5 text-slate-100"
                  >
                    <option>Fitness</option>
                    <option>Sağlık</option>
                    <option>Beslenme</option>
                    <option>Zihin</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300">
                    Alışkanlık türü
                  </label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as "build" | "quit")}
                    className="panel-input mt-2 w-full rounded-2xl px-4 py-3.5 text-slate-100"
                  >
                    <option value="build">Yapmak istediğim</option>
                    <option value="quit">Bırakmak istediğim</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">Not</label>
                <input
                  type="text"
                  placeholder="İsteğe bağlı kısa not"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="panel-input mt-2 w-full rounded-2xl px-4 py-3.5 text-slate-100"
                />
              </div>

              <div className="panel-surface-soft rounded-2xl px-4 py-4">
                <p className="text-sm font-medium text-slate-200">Gizlilik / Görünürlük</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Partner olmak tum aliskanliklari acmaz. Yalnizca partnera acik
                  isaretlenenler partner alaninda gorunur.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setVisibility("private")}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      visibility === "private"
                        ? "border-white/16 bg-white/[0.08] text-slate-50"
                        : "border-white/8 bg-white/[0.02] text-slate-300"
                    }`}
                  >
                    Gizli
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility("partner_visible")}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      visibility === "partner_visible"
                        ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                        : "border-white/8 bg-white/[0.02] text-slate-300"
                    }`}
                  >
                    Partner görebilir
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="panel-button-primary flex h-13 items-center justify-center rounded-2xl px-4 py-3 text-base font-semibold tracking-tight disabled:opacity-50"
                >
                  {submitting ? "Ekleniyor..." : "Alışkanlık Ekle"}
                </button>

                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="panel-button-secondary rounded-2xl px-4 py-3 text-sm font-semibold"
                >
                  Vazgeç
                </button>
              </div>

              {message ? (
                <p
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    messageTone === "success"
                      ? "border border-emerald-400/10 bg-emerald-400/5 text-emerald-200"
                      : "border border-rose-400/10 bg-rose-400/5 text-rose-200"
                  }`}
                >
                  {message}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

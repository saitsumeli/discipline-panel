"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import HabitRow from "@/components/dashboard/HabitRow";
import AddHabitCard from "@/components/dashboard/AddHabitCard";
import DemoUserSwitcher from "@/components/panel/DemoUserSwitcher";
import PanelShell from "@/components/panel/PanelShell";
import { useAppState } from "@/components/providers/AppStateProvider";
import { isHabitActive } from "@/app/lib/habits/presentation";
import type { Habit, HabitDraft, HabitKind, HabitVisibility } from "@/types/habit";

type HabitFilter = "active" | HabitKind;

function buildDraftFromHabit(habit: Habit): HabitDraft {
  return {
    name: habit.name,
    category: habit.category,
    kind: habit.kind,
    note: habit.note,
    isShareable: habit.isShareable,
    visibility: habit.visibility,
  };
}

function getActionErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return "İşlem tamamlanamadı. Lütfen tekrar dene.";
}

export default function HabitsPage() {
  const searchParams = useSearchParams();
  const {
    currentUserHabits,
    addHabit,
    updateHabit,
    updateHabitStatus,
    deleteHabit,
    archiveHabit,
    restoreHabit,
  } = useAppState();
  const [selectedFilter, setSelectedFilter] = useState<HabitFilter | null>(null);
  const [expandedHabitId, setExpandedHabitId] = useState<string | null | undefined>(undefined);
  const [drafts, setDrafts] = useState<Record<string, HabitDraft>>({});
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");
  const activeHabits = currentUserHabits.filter(isHabitActive);
  const archivedHabits = currentUserHabits.filter((habit) => !isHabitActive(habit));
  const targetHabitId = searchParams.get("habit");
  const preselectedHabit = useMemo(() => {
    if (!targetHabitId) return null;

    const matchingHabit = currentUserHabits.find((habit) => habit.id === targetHabitId);
    return matchingHabit && isHabitActive(matchingHabit) ? matchingHabit : null;
  }, [currentUserHabits, targetHabitId]);
  const filter = selectedFilter ?? preselectedHabit?.kind ?? "active";
  const effectiveExpandedHabitId =
    expandedHabitId === undefined ? preselectedHabit?.id ?? null : expandedHabitId;
  const visibleHabits = useMemo(() => {
    if (filter === "active") return activeHabits;
    return activeHabits.filter((habit) => habit.kind === filter);
  }, [activeHabits, filter]);

  const handleOpenDetail = (habit: Habit) => {
    setExpandedHabitId((currentValue) =>
      currentValue === undefined
        ? preselectedHabit?.id === habit.id
          ? null
          : habit.id
        : currentValue === habit.id
          ? null
          : habit.id
    );

    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [habit.id]: currentDrafts[habit.id] ?? buildDraftFromHabit(habit),
    }));
  };

  const handleDraftChange = (
    habitId: string,
    updates: Partial<HabitDraft>
  ) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [habitId]: {
        ...currentDrafts[habitId],
        ...updates,
      },
    }));
  };

  const handleDeleteHabit = async (habitId: string) => {
    setFeedbackMessage(null);

    try {
      await deleteHabit(habitId);
      setFeedbackTone("success");
      setFeedbackMessage("Alışkanlık silindi. Ortak akışta bağlıysa görünümden de düşecek.");
    } catch (error) {
      setFeedbackTone("error");
      setFeedbackMessage(getActionErrorMessage(error));
    }
  };

  return (
    <PanelShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Yönetim alanı
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
              Alışkanlıklarım
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Tüm alışkanlıklarını burada filtrele, düzenle, arşivle veya sil.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DemoUserSwitcher compact />
            <button
              type="button"
              onClick={() => setIsAddHabitOpen(true)}
              className="panel-button-primary rounded-2xl px-4 py-3 text-sm font-semibold"
            >
              + Yeni alışkanlık
            </button>
          </div>
        </div>

        {feedbackMessage ? (
          <div
            className={
              feedbackTone === "success"
                ? "rounded-2xl border border-emerald-400/15 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
                : "rounded-2xl border border-rose-400/15 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
            }
          >
            {feedbackMessage}
          </div>
        ) : null}

        <section className="panel-surface rounded-[28px] p-6">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "active" as HabitFilter, label: "Aktif", count: activeHabits.length },
              {
                id: "build" as HabitFilter,
                label: "Yapmak istediklerim",
                count: activeHabits.filter((habit) => habit.kind === "build").length,
              },
              {
                id: "quit" as HabitFilter,
                label: "Bırakmak istediklerim",
                count: activeHabits.filter((habit) => habit.kind === "quit").length,
              },
            ].map((option) => {
              const isActive = filter === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedFilter(option.id)}
                  className={
                    isActive
                      ? "rounded-full border border-white/14 bg-white/[0.06] px-4 py-2 text-sm font-medium text-slate-50"
                      : "rounded-full border border-white/8 bg-transparent px-4 py-2 text-sm font-medium text-slate-400 transition hover:text-slate-100"
                  }
                >
                  {option.label}
                  <span className="ml-2 text-xs text-slate-500">{option.count}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-3">
            {visibleHabits.map((habit) => {
              const draft = drafts[habit.id] ?? buildDraftFromHabit(habit);
              const isExpanded = effectiveExpandedHabitId === habit.id;

              return (
                <div key={habit.id} className="space-y-3">
                  <HabitRow
                    habit={habit}
                    actionLabel={isExpanded ? "Kapat" : "Detay"}
                    actionTone="secondary"
                    onAction={() => handleOpenDetail(habit)}
                    extra={
                      habit.kind === "build" ? (
                        <button
                          type="button"
                          onClick={() => updateHabitStatus(habit.id, "done")}
                          className="text-xs font-medium text-slate-500 transition hover:text-slate-100"
                        >
                          Bugünü tamamla
                        </button>
                      ) : null
                    }
                  />

                  {isExpanded ? (
                    <div className="panel-list-row rounded-2xl px-4 py-4">
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                          <label className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                            Ad
                          </label>
                          <input
                            value={draft.name}
                            onChange={(event) =>
                              handleDraftChange(habit.id, { name: event.target.value })
                            }
                            className="panel-input mt-2 w-full rounded-xl px-3 py-2.5 text-sm text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                            Kategori
                          </label>
                          <input
                            value={draft.category}
                            onChange={(event) =>
                              handleDraftChange(habit.id, {
                                category: event.target.value,
                              })
                            }
                            className="panel-input mt-2 w-full rounded-xl px-3 py-2.5 text-sm text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                            Tür
                          </label>
                          <select
                            value={draft.kind}
                            onChange={(event) =>
                              handleDraftChange(habit.id, {
                                kind: event.target.value as HabitKind,
                              })
                            }
                            className="panel-input mt-2 w-full rounded-xl px-3 py-2.5 text-sm text-slate-100"
                          >
                            <option value="build">Yapmak istediğim</option>
                            <option value="quit">Bırakmak istediğim</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                            Gizlilik
                          </label>
                          <select
                            value={draft.visibility}
                            onChange={(event) => {
                              const visibility = event.target.value as HabitVisibility;
                              handleDraftChange(habit.id, {
                                visibility,
                                isShareable: visibility === "partner_visible",
                              });
                            }}
                            className="panel-input mt-2 w-full rounded-xl px-3 py-2.5 text-sm text-slate-100"
                          >
                            <option value="private">Gizli</option>
                            <option value="partner_visible">Partner görebilir</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                          Not
                        </label>
                        <textarea
                          value={draft.note ?? ""}
                          onChange={(event) =>
                            handleDraftChange(habit.id, {
                              note: event.target.value || undefined,
                            })
                          }
                          className="panel-input mt-2 min-h-[92px] w-full rounded-xl px-3 py-3 text-sm text-slate-100"
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => updateHabit(habit.id, draft)}
                          className="panel-button-primary rounded-xl px-4 py-3 text-sm font-semibold"
                        >
                          Değişiklikleri kaydet
                        </button>
                        <button
                          type="button"
                          onClick={() => updateHabitStatus(habit.id, "missed")}
                          className="panel-button-secondary rounded-xl px-4 py-3 text-sm font-semibold"
                        >
                          {habit.kind === "quit" ? "Bozuldu / sıfırla" : "Bugünü yapmadım"}
                        </button>
                        <button
                          type="button"
                          onClick={() => archiveHabit(habit.id)}
                          className="panel-button-secondary rounded-xl px-4 py-3 text-sm font-semibold"
                        >
                          Arşivle
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void handleDeleteHabit(habit.id);
                          }}
                          className="rounded-xl border border-rose-400/15 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {visibleHabits.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
                <p className="text-base font-medium text-slate-100">
                  Bu filtrede görünür alışkanlık yok
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Filtreyi değiştir veya yeni bir alışkanlık ekle.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel-surface rounded-[28px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Arşiv
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-50">
                Arşivlenmiş alışkanlıklar
              </h3>
            </div>

            <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
              {archivedHabits.length} kayıt
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {archivedHabits.length > 0 ? (
              archivedHabits.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  actionLabel="Geri al"
                  actionTone="secondary"
                  onAction={() => restoreHabit(habit.id)}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
                <p className="text-sm text-slate-400">
                  Henüz arşivlenmiş alışkanlık yok.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <AddHabitCard
        onAddHabit={async (draft) => {
          await addHabit(draft);
          return true;
        }}
        open={isAddHabitOpen}
        onOpenChange={setIsAddHabitOpen}
      />
    </PanelShell>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { sortHabitsForDailyFlow } from "@/app/lib/habits/presentation";
import HabitRow from "@/components/dashboard/HabitRow";
import type { Habit, HabitKind } from "@/types/habit";

type DailyFocusCardProps = {
  habits: Habit[];
  onCompleteHabit: (habitId: string) => void;
  onResetQuitHabit: (habitId: string) => void;
  onArchiveHabit: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
};

export default function DailyFocusCard({
  habits,
  onCompleteHabit,
  onResetQuitHabit,
  onArchiveHabit,
  onDeleteHabit,
}: DailyFocusCardProps) {
  const [filter, setFilter] = useState<"all" | HabitKind>("all");
  const filteredHabits = useMemo(() => {
    if (filter === "all") return habits;
    return habits.filter((habit) => habit.kind === filter);
  }, [filter, habits]);
  const orderedHabits = sortHabitsForDailyFlow(filteredHabits);

  return (
    <section className="panel-surface rounded-[28px] p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Günün odağı
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">
            Bugün yapılacaklar
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Gün içinde yalnızca bu listeye bakarak ilerleyebilmelisin.
          </p>
        </div>

        <Link
          href="/habits"
          className="text-sm font-medium text-slate-300 transition hover:text-slate-100"
        >
          Tümünü yönet
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {[
          { id: "all" as const, label: "Tümü", count: habits.length },
          {
            id: "build" as const,
            label: "Yapmak istediklerim",
            count: habits.filter((habit) => habit.kind === "build").length,
          },
          {
            id: "quit" as const,
            label: "Bırakmak istediklerim",
            count: habits.filter((habit) => habit.kind === "quit").length,
          },
        ].map((option) => {
          const isActive = filter === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
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

      <div className="mt-5 space-y-3">
        {orderedHabits.length > 0 ? (
          orderedHabits.map((habit) => {
            const isDone = habit.todayStatus === "done";
            const isQuitHabit = habit.kind === "quit";
            const actionDisabled = isQuitHabit ? false : isDone;
            const actionLabel = isQuitHabit ? "Bozuldu" : isDone ? "Tamamlandı" : "Tamamla";

            return (
              <HabitRow
                key={habit.id}
                habit={habit}
                actionDisabled={actionDisabled}
                actionLabel={actionLabel}
                actionTone={isQuitHabit ? "danger" : "primary"}
                onAction={() =>
                  isQuitHabit ? onResetQuitHabit(habit.id) : onCompleteHabit(habit.id)
                }
                manageHref={`/habits?habit=${habit.id}`}
                onArchive={() => onArchiveHabit(habit.id)}
                onDelete={() => onDeleteHabit(habit.id)}
              />
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
            <p className="text-base font-medium text-slate-100">
              Bugün için aktif alışkanlık yok
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Yeni bir hedef ekleyerek günlük akışı yeniden başlatabilirsin.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

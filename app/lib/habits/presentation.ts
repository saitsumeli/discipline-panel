import type { Habit, HabitTodayStatus } from "@/types/habit";

export function getHabitStatusLabel(status: HabitTodayStatus) {
  if (status === "done") return "Tamamlandı";
  if (status === "missed") return "Bozuldu";
  return "Bekliyor";
}

export function getHabitStatusTone(status: HabitTodayStatus) {
  if (status === "done") {
    return "border-emerald-400/15 bg-emerald-400/10 text-emerald-100";
  }

  if (status === "missed") {
    return "border-rose-400/15 bg-rose-400/10 text-rose-100";
  }

  return "border-white/10 bg-white/[0.03] text-slate-300";
}

export function getHabitPrimaryActionLabel(habit: Habit) {
  if (habit.kind === "quit") return "Bozuldu";
  if (habit.todayStatus === "done") return "Tamamlandı";
  return "Tamamla";
}

export function getHabitTypeLabel(habit: Habit) {
  return habit.kind === "quit" ? "Bırakmak istiyorum" : "Yapmak istiyorum";
}

export function getHabitTypeTone(habit: Habit) {
  if (habit.kind === "quit") {
    return "border-amber-400/15 bg-amber-400/10 text-amber-100";
  }

  return "border-sky-400/15 bg-sky-400/10 text-sky-100";
}

export function getHabitStreakLabel(habit: Habit) {
  if (habit.kind === "quit") {
    return formatHabitDuration(habit.longestStreak);
  }

  return `${habit.currentStreak} gün`;
}

export function isHabitPartnerVisible(habit: Habit) {
  return habit.visibility === "partner_visible";
}

export function isHabitActive(habit: Habit) {
  return !habit.archivedAt;
}

export function sortHabitsForDailyFlow(habits: Habit[]) {
  const statusRank: Record<HabitTodayStatus, number> = {
    pending: 0,
    missed: 1,
    done: 2,
  };

  return [...habits].sort((first, second) => {
    const statusDiff = statusRank[first.todayStatus] - statusRank[second.todayStatus];
    if (statusDiff !== 0) return statusDiff;

    return first.name.localeCompare(second.name, "tr");
  });
}

export function getActivePersonalStreak(habits: Habit[]) {
  const buildHabits = habits.filter((habit) => habit.kind === "build");
  if (buildHabits.length === 0) return 0;

  return buildHabits.reduce((highest, habit) => {
    return Math.max(highest, habit.currentStreak);
  }, 0);
}

export function formatHabitDuration(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}g ${String(hours).padStart(2, "0")}s`;
  }

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export function getHabitPrimaryMetric(habit: Habit, referenceDate = new Date()) {
  if (habit.kind === "build") {
    return `${habit.currentStreak} gün`;
  }

  const elapsedMs =
    referenceDate.getTime() - new Date(habit.createdAt).getTime();

  return formatHabitDuration(Math.max(0, Math.floor(elapsedMs / 1000)));
}

export function getHabitProgressHeadline(habit: Habit, referenceDate = new Date()) {
  if (habit.kind === "build") {
    if (habit.currentStreak > 0) {
      return `${habit.currentStreak} gündür devam ediyor`;
    }

    return habit.todayStatus === "done"
      ? "Bugün tamamlandı"
      : "Bugün seri yeniden başlayabilir";
  }

  if (habit.todayStatus === "missed") {
    return "Sayaç yeniden başladı";
  }

  const elapsedLabel = getHabitPrimaryMetric(habit, referenceDate);
  return `${elapsedLabel} bozmadın`;
}

export function getHabitProgressSupport(habit: Habit) {
  if (habit.kind === "build") {
    return `En iyi seri: ${habit.longestStreak} gün`;
  }

  const bestDuration = formatHabitDuration(habit.longestStreak);

  if (habit.todayStatus === "missed") {
    return `Yeni temiz seri hazır. En iyi süre: ${bestDuration}`;
  }

  return `En iyi süre: ${bestDuration}`;
}

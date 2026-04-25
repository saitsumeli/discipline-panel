export type HabitKind = "build" | "quit";
export type HabitTodayStatus = "done" | "missed" | "pending";
export type HabitVisibility = "private" | "partner_visible";

export type Habit = {
  id: string;
  ownerUserId: string;
  name: string;
  category: string;
  kind: HabitKind;
  createdAt: string;
  currentStreak: number;
  longestStreak: number;
  todayStatus: HabitTodayStatus;
  isShareable: boolean;
  visibility: HabitVisibility;
  archivedAt?: string;
  note?: string;
};

export type HabitDraft = {
  name: string;
  category: string;
  kind: HabitKind;
  note?: string;
  isShareable: boolean;
  visibility: HabitVisibility;
};

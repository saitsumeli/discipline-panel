import type { HabitKind, HabitTodayStatus } from "@/types/habit";

export type AppUser = {
  id: string;
  displayName: string;
  username: string;
  email: string;
  isActive: boolean;
  joinedAt: string;
  bio: string;
  statusLine: string;
  shareableHabitCount?: number;
  activeSeriesCount?: number;
};

export type PartnerRequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled";

export type PartnerRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: PartnerRequestStatus;
  createdAt: string;
  respondedAt?: string;
  message?: string;
};

export type Partnership = {
  id: string;
  memberIds: [string, string];
  status: "active";
  connectedAt: string;
};

export type SharedHabitStatus = "pending" | "active" | "archived";
export type SharedHabitMemberStatus = "pending" | "accepted";

export type SharedHabit = {
  id: string;
  sourceHabitId: string;
  name: string;
  category: string;
  kind: HabitKind;
  note?: string;
  proposedByUserId: string;
  createdAt: string;
  acceptedAt?: string;
  status: SharedHabitStatus;
};

export type SharedHabitMember = {
  id: string;
  sharedHabitId: string;
  userId: string;
  status: SharedHabitMemberStatus;
  joinedAt?: string;
  respondedAt?: string;
};

export type SharedHabitLog = {
  id: string;
  sharedHabitId: string;
  userId: string;
  date: string;
  status: HabitTodayStatus;
  recordedAt: string;
};

export type SocialGraphState = {
  currentUserId: string;
  users: AppUser[];
  habits: import("@/types/habit").Habit[];
  partnerRequests: PartnerRequest[];
  partnerships: Partnership[];
  sharedHabits: SharedHabit[];
  sharedHabitMembers: SharedHabitMember[];
  sharedHabitLogs: SharedHabitLog[];
};

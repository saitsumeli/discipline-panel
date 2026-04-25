import type { Habit, HabitTodayStatus } from "@/types/habit";
import type {
  AppUser,
  SharedHabitStatus,
  Partnership,
  SharedHabit,
  SharedHabitLog,
  SocialGraphState,
} from "@/types/social";

export function getTodayDateKey(referenceDate = new Date()) {
  return referenceDate.toISOString().slice(0, 10);
}

export function formatDisplayDate(value: string) {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getUserById(state: SocialGraphState, userId: string) {
  return state.users.find((user) => user.id === userId) ?? null;
}

export function getPartnershipForUser(
  state: SocialGraphState,
  userId: string
): Partnership | null {
  return (
    state.partnerships.find(
      (partnership) =>
        partnership.status === "active" && partnership.memberIds.includes(userId)
    ) ?? null
  );
}

export function getPartnerUser(
  state: SocialGraphState,
  userId: string
): AppUser | null {
  const partnership = getPartnershipForUser(state, userId);
  if (!partnership) return null;

  const partnerId = partnership.memberIds.find((memberId) => memberId !== userId);
  return partnerId ? getUserById(state, partnerId) : null;
}

export function getHabitsForUser(state: SocialGraphState, userId: string) {
  return state.habits.filter((habit) => habit.ownerUserId === userId);
}

export function getActiveHabitsForUser(state: SocialGraphState, userId: string) {
  return getHabitsForUser(state, userId).filter((habit) => !habit.archivedAt);
}

export function getArchivedHabitsForUser(state: SocialGraphState, userId: string) {
  return getHabitsForUser(state, userId).filter((habit) => Boolean(habit.archivedAt));
}

export function getVisiblePartnerHabits(
  state: SocialGraphState,
  ownerUserId: string,
  viewerUserId: string
) {
  const partnership = getPartnershipForUser(state, viewerUserId);
  if (!partnership || !partnership.memberIds.includes(ownerUserId)) return [];

  return getActiveHabitsForUser(state, ownerUserId).filter(
    (habit) => habit.visibility === "partner_visible" && !habit.archivedAt
  );
}

export function getPendingPartnerRequestBetweenUsers(
  state: SocialGraphState,
  firstUserId: string,
  secondUserId: string
) {
  return (
    state.partnerRequests.find((request) => {
      const isSamePair =
        (request.fromUserId === firstUserId && request.toUserId === secondUserId) ||
        (request.fromUserId === secondUserId && request.toUserId === firstUserId);

      return isSamePair && request.status === "pending";
    }) ?? null
  );
}

export function getSharedHabitMembers(
  state: SocialGraphState,
  sharedHabitId: string
) {
  return state.sharedHabitMembers.filter(
    (member) => member.sharedHabitId === sharedHabitId
  );
}

export function getSharedHabitLogs(
  state: SocialGraphState,
  sharedHabitId: string
) {
  return state.sharedHabitLogs.filter((log) => log.sharedHabitId === sharedHabitId);
}

export function getSharedHabitLogForDate(
  logs: SharedHabitLog[],
  userId: string,
  dateKey: string
) {
  return logs.find((log) => log.userId === userId && log.date === dateKey) ?? null;
}

export function getTodayStatusForSharedHabit(
  state: SocialGraphState,
  sharedHabitId: string,
  userId: string
): HabitTodayStatus {
  const log = getSharedHabitLogForDate(
    getSharedHabitLogs(state, sharedHabitId),
    userId,
    getTodayDateKey()
  );

  return log?.status ?? "pending";
}

function buildDateRange(startDateKey: string, endDateKey: string) {
  const days: string[] = [];
  const currentDate = new Date(`${startDateKey}T00:00:00.000Z`);
  const endDate = new Date(`${endDateKey}T00:00:00.000Z`);

  while (currentDate <= endDate) {
    days.push(getTodayDateKey(currentDate));
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return days;
}

export function getRecentDateKeys(days: number, referenceDate = new Date()) {
  const dates: string[] = [];
  const cursor = new Date(referenceDate);

  for (let index = 0; index < days; index += 1) {
    dates.unshift(getTodayDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return dates;
}

export function getSharedHabitCurrentStreak(
  state: SocialGraphState,
  sharedHabit: SharedHabit
) {
  if (sharedHabit.status !== "active" || !sharedHabit.acceptedAt) return 0;

  if (sharedHabit.kind === "quit") {
    return buildDateRange(
      getTodayDateKey(new Date(getSharedQuitSharedCleanStartedAt(state, sharedHabit))),
      getTodayDateKey()
    ).length;
  }

  const members = getSharedHabitMembers(state, sharedHabit.id)
    .filter((member) => member.status === "accepted")
    .map((member) => member.userId);

  if (members.length < 2) return 0;

  const logs = getSharedHabitLogs(state, sharedHabit.id);
  const acceptedDay = getTodayDateKey(new Date(sharedHabit.acceptedAt));
  const dates = buildDateRange(acceptedDay, getTodayDateKey()).reverse();

  let streak = 0;

  for (const dateKey of dates) {
    const allDone = members.every((memberId) => {
      const log = getSharedHabitLogForDate(logs, memberId, dateKey);
      return log?.status === "done";
    });

    if (!allDone) break;
    streak += 1;
  }

  return streak;
}

export function getSharedHabitLongestStreak(
  state: SocialGraphState,
  sharedHabit: SharedHabit
) {
  if (sharedHabit.status !== "active" || !sharedHabit.acceptedAt) return 0;

  if (sharedHabit.kind === "quit") {
    return getSharedHabitCurrentStreak(state, sharedHabit);
  }

  const members = getSharedHabitMembers(state, sharedHabit.id)
    .filter((member) => member.status === "accepted")
    .map((member) => member.userId);

  if (members.length < 2) return 0;

  const logs = getSharedHabitLogs(state, sharedHabit.id);
  const acceptedDay = getTodayDateKey(new Date(sharedHabit.acceptedAt));
  const dates = buildDateRange(acceptedDay, getTodayDateKey());
  let current = 0;
  let longest = 0;

  dates.forEach((dateKey) => {
    const allDone = members.every((memberId) => {
      const log = getSharedHabitLogForDate(logs, memberId, dateKey);
      return log?.status === "done";
    });

    if (allDone) {
      current += 1;
      longest = Math.max(longest, current);
      return;
    }

    current = 0;
  });

  return longest;
}

export function getSharedHabitPartnerStatus(
  state: SocialGraphState,
  sharedHabitId: string,
  currentUserId: string
) {
  const members = getSharedHabitMembers(state, sharedHabitId).filter(
    (member) => member.status === "accepted"
  );
  const partnerMember = members.find((member) => member.userId !== currentUserId);

  if (!partnerMember) return null;

  return {
    user: getUserById(state, partnerMember.userId),
    status: getTodayStatusForSharedHabit(state, sharedHabitId, partnerMember.userId),
  };
}

export function getSharedHabitTypeLabel(sharedHabit: SharedHabit) {
  return sharedHabit.kind === "quit" ? "Bırak" : "Yap";
}

export function getSharedHabitTypeTone(sharedHabit: SharedHabit) {
  if (sharedHabit.kind === "quit") {
    return "border-amber-400/15 bg-amber-400/10 text-amber-100";
  }

  return "border-sky-400/15 bg-sky-400/10 text-sky-100";
}

function formatElapsedDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
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

export function getSharedQuitMemberCleanStartedAt(
  state: SocialGraphState,
  sharedHabit: SharedHabit,
  userId: string
) {
  const member = getSharedHabitMembers(state, sharedHabit.id).find(
    (item) => item.userId === userId
  );
  const baseStartedAt =
    member?.joinedAt ?? sharedHabit.acceptedAt ?? sharedHabit.createdAt;
  const latestBreakLog = getSharedHabitLogs(state, sharedHabit.id)
    .filter((log) => log.userId === userId && log.status === "missed")
    .sort(
      (first, second) =>
        new Date(second.recordedAt).getTime() - new Date(first.recordedAt).getTime()
    )[0];

  if (!latestBreakLog) return baseStartedAt;

  return new Date(latestBreakLog.recordedAt).getTime() >
    new Date(baseStartedAt).getTime()
    ? latestBreakLog.recordedAt
    : baseStartedAt;
}

export function getSharedQuitSharedCleanStartedAt(
  state: SocialGraphState,
  sharedHabit: SharedHabit
) {
  const acceptedMembers = getSharedHabitMembers(state, sharedHabit.id).filter(
    (member) => member.status === "accepted"
  );

  const startedAtValues =
    acceptedMembers.length > 0
      ? acceptedMembers.map((member) =>
          getSharedQuitMemberCleanStartedAt(state, sharedHabit, member.userId)
        )
      : [sharedHabit.acceptedAt ?? sharedHabit.createdAt];

  return startedAtValues.reduce((latest, startedAt) => {
    return new Date(startedAt).getTime() > new Date(latest).getTime()
      ? startedAt
      : latest;
  });
}

export function getSharedQuitMemberElapsedLabel(
  state: SocialGraphState,
  sharedHabit: SharedHabit,
  userId: string,
  referenceDate = new Date()
) {
  const startedAt = getSharedQuitMemberCleanStartedAt(state, sharedHabit, userId);
  return formatElapsedDuration(referenceDate.getTime() - new Date(startedAt).getTime());
}

export function getSharedQuitSharedElapsedLabel(
  state: SocialGraphState,
  sharedHabit: SharedHabit,
  referenceDate = new Date()
) {
  const startedAt = getSharedQuitSharedCleanStartedAt(state, sharedHabit);
  return formatElapsedDuration(referenceDate.getTime() - new Date(startedAt).getTime());
}

export function getSharedHabitElapsedLabel(
  sharedHabit: SharedHabit,
  referenceDate = new Date()
) {
  const startedAt = sharedHabit.acceptedAt ?? sharedHabit.createdAt;
  return formatElapsedDuration(referenceDate.getTime() - new Date(startedAt).getTime());
}

export function getSharedHabitStatusTone(status: HabitTodayStatus) {
  if (status === "done") {
    return "border-emerald-400/15 bg-emerald-400/10 text-emerald-100";
  }

  if (status === "missed") {
    return "border-rose-400/15 bg-rose-400/10 text-rose-100";
  }

  return "border-white/10 bg-white/[0.03] text-slate-300";
}

export function getSharedHabitStatusLabel(status: HabitTodayStatus) {
  if (status === "done") return "Tamamlandı";
  if (status === "missed") return "Kaçtı";
  return "Bekliyor";
}

export function getSharedHabitMomentumLabel(
  state: SocialGraphState,
  sharedHabit: SharedHabit,
  referenceDate = new Date()
) {
  if (sharedHabit.kind === "quit") {
    return `${getSharedQuitSharedElapsedLabel(
      state,
      sharedHabit,
      referenceDate
    )} birlikte temiz`;
  }

  return `${getSharedHabitCurrentStreak(state, sharedHabit)} günlük ortak seri`;
}

export function getSharedHabitTodaySummary(
  state: SocialGraphState,
  sharedHabit: SharedHabit,
  currentUserId: string
) {
  const myStatus = getTodayStatusForSharedHabit(state, sharedHabit.id, currentUserId);
  const partnerSnapshot = getSharedHabitPartnerStatus(state, sharedHabit.id, currentUserId);
  const partnerStatus = partnerSnapshot?.status ?? "pending";
  const partnerName = partnerSnapshot?.user?.displayName ?? "Partner";

  if (sharedHabit.kind === "quit") {
    if (myStatus === "missed" || partnerStatus === "missed") {
      return {
        tone: "border-rose-400/15 bg-rose-400/10 text-rose-100",
        label: "Temiz süre sıfırlandı",
        detail: "Ortak temiz sayaç yeniden başladı.",
      };
    }

    return {
      tone: "border-emerald-400/15 bg-emerald-400/10 text-emerald-100",
      label: "Temiz süre akıyor",
      detail: "Biriniz bozuldu olarak işaretlemediği sürece ortak sayaç devam eder.",
    };
  }

  if (myStatus === "done" && partnerStatus === "done") {
    return {
      tone: "border-emerald-400/15 bg-emerald-400/10 text-emerald-100",
      label: "İkiniz de tamamladınız",
      detail: "Ortak seri bugün de birlikte ilerledi.",
    };
  }

  if (myStatus === "done" && partnerStatus === "pending") {
    return {
      tone: "border-amber-400/15 bg-amber-400/10 text-amber-100",
      label: "Sen tamamladın, partner bekliyor",
      detail: `${partnerName} bugünkü durumunu henüz işaretlemedi.`,
    };
  }

  if (myStatus === "pending" && partnerStatus === "done") {
    return {
      tone: "border-sky-400/15 bg-sky-400/10 text-sky-100",
      label: `${partnerName} tamamladı, sıra sende`,
      detail: "Bugünkü ortak seriyi korumak için senin güncellemen gerekiyor.",
    };
  }

  if (myStatus === "missed" || partnerStatus === "missed") {
    return {
      tone: "border-rose-400/15 bg-rose-400/10 text-rose-100",
      label: "Bugün seri kırıldı",
      detail: "Bugünkü ortak rutin tamamlanamadı.",
    };
  }

  return {
    tone: "border-white/10 bg-white/[0.03] text-slate-300",
    label: "Bugün seri riskte",
    detail: "İkinizin de bugünü tamamlaması gerekiyor.",
  };
}

export function getHighestSharedStreakForUser(
  state: SocialGraphState,
  userId: string
) {
  const userSharedHabits = state.sharedHabits.filter(
    (sharedHabit) =>
      sharedHabit.status === "active" &&
      getSharedHabitMembers(state, sharedHabit.id).some(
        (member) => member.userId === userId && member.status === "accepted"
      )
  );

  return userSharedHabits.reduce((maxStreak, sharedHabit) => {
    return Math.max(maxStreak, getSharedHabitCurrentStreak(state, sharedHabit));
  }, 0);
}

export function getSharedHabitsCompletedTodayCount(
  state: SocialGraphState,
  userId: string
) {
  return state.sharedHabits.filter((sharedHabit) => {
    if (sharedHabit.status !== "active") return false;
    if (sharedHabit.kind !== "build") return false;

    const members = getSharedHabitMembers(state, sharedHabit.id)
      .filter((member) => member.status === "accepted")
      .map((member) => member.userId);

    if (!members.includes(userId) || members.length < 2) return false;

    const todayLogs = getSharedHabitLogs(state, sharedHabit.id);
    return members.every((memberId) => {
      const log = getSharedHabitLogForDate(todayLogs, memberId, getTodayDateKey());
      return log?.status === "done";
    });
  }).length;
}

export function getSharedHabitStatusBadge(status: SharedHabitStatus) {
  if (status === "active") return "Aktif";
  if (status === "pending") return "Bekliyor";
  return "Arşiv";
}

export function mapHabitToShareSummary(habit: Habit) {
  return habit.visibility === "partner_visible"
    ? "Partner görebilir"
    : "Gizli";
}

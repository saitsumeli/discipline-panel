"use client";

import {
  getRecentDateKeys,
  getSharedHabitLogForDate,
  getSharedHabitLogs,
  getSharedHabitPartnerStatus,
} from "@/app/lib/social/helpers";
import type { SharedHabit, SocialGraphState } from "@/types/social";

type SharedWeekStripProps = {
  state: SocialGraphState;
  sharedHabit: SharedHabit;
  currentUserId: string;
};

export default function SharedWeekStrip({
  state,
  sharedHabit,
  currentUserId,
}: SharedWeekStripProps) {
  const recentDates = getRecentDateKeys(7);
  const logs = getSharedHabitLogs(state, sharedHabit.id);
  const partnerSnapshot = getSharedHabitPartnerStatus(state, sharedHabit.id, currentUserId);

  return (
    <div className="grid grid-cols-7 gap-2">
      {recentDates.map((dateKey) => {
        const myLog = getSharedHabitLogForDate(logs, currentUserId, dateKey);
        const partnerLog = partnerSnapshot?.user
          ? getSharedHabitLogForDate(logs, partnerSnapshot.user.id, dateKey)
          : null;
        const isJointDone = myLog?.status === "done" && partnerLog?.status === "done";

        return (
          <div
            key={dateKey}
            className={`rounded-2xl border px-2 py-3 text-center text-xs ${
              isJointDone
                ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-100"
                : "border-white/8 bg-white/[0.03] text-slate-400"
            }`}
          >
            <p>{dateKey.slice(8, 10)}</p>
            <p className="mt-1">{isJointDone ? "Birlikte" : "Açık"}</p>
          </div>
        );
      })}
    </div>
  );
}

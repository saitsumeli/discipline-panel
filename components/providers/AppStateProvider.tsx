"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SUPABASE_IS_CONFIGURED, supabase } from "@/app/lib/supabaseClient";
import {
  acceptSharedHabitRecord,
  archiveHabitRecord,
  archiveSharedHabitRecord,
  createHabitRecord,
  createPartnerRequestRecord,
  createPartnershipRecord,
  createSharedHabitRecord,
  deletePartnershipsBetweenUsers,
  deleteHabitRecord,
  ensureProfileForAuthUser,
  fetchSocialGraphState,
  restoreHabitRecord,
  resetSharedQuitHabitRecord,
  updateHabitRecord,
  updateHabitStatusRecord,
  updatePartnerRequestStatusRecord,
  upsertSharedHabitLogRecord,
} from "@/app/lib/supabase/socialRepository";
import {
  getHabitsForUser,
  getPartnerUser,
  getPartnershipForUser,
  getPendingPartnerRequestBetweenUsers,
  getSharedHabitMembers,
  getVisiblePartnerHabits,
} from "@/app/lib/social/helpers";
import type { Habit, HabitDraft, HabitTodayStatus } from "@/types/habit";
import type {
  AppUser,
  PartnerRequest,
  Partnership,
  SharedHabit,
  SocialGraphState,
} from "@/types/social";

type AppStateContextValue = {
  state: SocialGraphState;
  currentUser: AppUser | null;
  currentPartner: AppUser | null;
  currentPartnership: Partnership | null;
  profileLabel: string;
  currentUserHabits: Habit[];
  discoverableUsers: AppUser[];
  incomingPartnerRequests: PartnerRequest[];
  outgoingPartnerRequests: PartnerRequest[];
  activeSharedHabits: SharedHabit[];
  pendingSharedInvitations: SharedHabit[];
  pendingSharedOutgoing: SharedHabit[];
  authResolved: boolean;
  isAuthenticated: boolean;
  refreshState: () => Promise<void>;
  logout: () => Promise<void>;
  addHabit: (draft: HabitDraft) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<HabitDraft>) => Promise<void>;
  updateHabitStatus: (
    habitId: string,
    nextStatus: HabitTodayStatus
  ) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;
  restoreHabit: (habitId: string) => Promise<void>;
  sendPartnerRequest: (targetUserId: string) => Promise<void>;
  acceptPartnerRequest: (requestId: string) => Promise<void>;
  declinePartnerRequest: (requestId: string) => Promise<void>;
  cancelPartnerRequest: (requestId: string) => Promise<void>;
  disconnectPartnership: () => Promise<void>;
  getPartnerHabits: (partnerId: string) => Habit[];
  proposeSharedHabit: (
    sourceHabitId: string,
    partnerUserId: string
  ) => Promise<void>;
  acceptSharedHabit: (sharedHabitId: string) => Promise<void>;
  declineSharedHabit: (sharedHabitId: string) => Promise<void>;
  updateSharedHabitStatus: (
    sharedHabitId: string,
    status: HabitTodayStatus
  ) => Promise<void>;
};

const EMPTY_STATE: SocialGraphState = {
  currentUserId: "",
  users: [],
  habits: [],
  partnerRequests: [],
  partnerships: [],
  sharedHabits: [],
  sharedHabitMembers: [],
  sharedHabitLogs: [],
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Bilinmeyen hata";
  }
}

function resolveProfileLabel(email?: string | null, username?: string | null) {
  if (username?.trim()) return username.trim();
  if (!email) return "Profil";
  return email.split("@")[0] || "Profil";
}

function buildNextHabitStatus(
  habit: Habit,
  nextStatus: HabitTodayStatus
): Pick<Habit, "todayStatus" | "currentStreak" | "longestStreak" | "createdAt"> {
  const now = new Date().toISOString();
  const elapsedSeconds = Math.max(
    0,
    Math.floor((new Date(now).getTime() - new Date(habit.createdAt).getTime()) / 1000)
  );

  if (nextStatus === "done") {
    const alreadyDone = habit.todayStatus === "done";
    const nextStreak = alreadyDone ? habit.currentStreak : habit.currentStreak + 1;

    return {
      todayStatus: "done",
      currentStreak: nextStreak,
      longestStreak: Math.max(habit.longestStreak, nextStreak),
      createdAt: habit.createdAt,
    };
  }

  if (nextStatus === "missed") {
    return {
      todayStatus: "missed",
      currentStreak: 0,
      longestStreak:
        habit.kind === "quit"
          ? Math.max(habit.longestStreak, elapsedSeconds)
          : Math.max(habit.longestStreak, habit.currentStreak),
      createdAt: habit.kind === "quit" ? now : habit.createdAt,
    };
  }

  return {
    todayStatus: "pending",
    currentStreak: 0,
    longestStreak: Math.max(habit.longestStreak, habit.currentStreak),
    createdAt: habit.createdAt,
  };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SocialGraphState>(EMPTY_STATE);
  const [profileLabel, setProfileLabel] = useState("");
  const [authUserId, setAuthUserId] = useState("");
  const [authResolved, setAuthResolved] = useState(() => !SUPABASE_IS_CONFIGURED);
  const effectiveCurrentUserId = state.currentUserId || authUserId;

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === effectiveCurrentUserId) ?? null,
    [effectiveCurrentUserId, state.users]
  );

  const currentPartnership = useMemo(
    () => getPartnershipForUser(state, effectiveCurrentUserId),
    [effectiveCurrentUserId, state]
  );

  const currentPartner = useMemo(
    () => getPartnerUser(state, effectiveCurrentUserId),
    [effectiveCurrentUserId, state]
  );

  const currentUserHabits = useMemo(
    () => getHabitsForUser(state, effectiveCurrentUserId),
    [effectiveCurrentUserId, state]
  );

  const discoverableUsers = useMemo(
    () => state.users.filter((user) => user.id !== effectiveCurrentUserId),
    [effectiveCurrentUserId, state.users]
  );

  const incomingPartnerRequests = useMemo(
    () =>
      state.partnerRequests.filter(
        (request) =>
          request.toUserId === effectiveCurrentUserId && request.status === "pending"
      ),
    [effectiveCurrentUserId, state.partnerRequests]
  );

  const outgoingPartnerRequests = useMemo(
    () =>
      state.partnerRequests.filter(
        (request) =>
          request.fromUserId === effectiveCurrentUserId && request.status === "pending"
      ),
    [effectiveCurrentUserId, state.partnerRequests]
  );

  const activeSharedHabits = useMemo(
    () =>
      state.sharedHabits.filter((sharedHabit) => {
        if (sharedHabit.status !== "active") return false;

        return getSharedHabitMembers(state, sharedHabit.id).some(
          (member) =>
            member.userId === effectiveCurrentUserId && member.status === "accepted"
        );
      }),
    [effectiveCurrentUserId, state]
  );

  const pendingSharedInvitations = useMemo(
    () =>
      state.sharedHabits.filter((sharedHabit) => {
        if (sharedHabit.status !== "pending") return false;

        return getSharedHabitMembers(state, sharedHabit.id).some(
          (member) =>
            member.userId === effectiveCurrentUserId && member.status === "pending"
        );
      }),
    [effectiveCurrentUserId, state]
  );

  const pendingSharedOutgoing = useMemo(
    () =>
      state.sharedHabits.filter((sharedHabit) => {
        if (sharedHabit.status !== "pending") return false;

        return (
          sharedHabit.proposedByUserId === effectiveCurrentUserId &&
          getSharedHabitMembers(state, sharedHabit.id).some(
            (member) =>
              member.userId !== effectiveCurrentUserId && member.status === "pending"
          )
        );
      }),
    [effectiveCurrentUserId, state]
  );

  const handleAppStateError = useCallback((scope: string, error: unknown) => {
    console.warn(`[AppStateProvider:${scope}] ${getErrorMessage(error)}`, error);
    setAuthResolved(true);
  }, []);

  const refreshState = useCallback(async () => {
    if (!authUserId) {
      setState(EMPTY_STATE);
      return;
    }

    try {
      const nextState = await fetchSocialGraphState(authUserId);
      setState(nextState);
    } catch (error) {
      handleAppStateError("refreshState", error);
    }
  }, [authUserId, handleAppStateError]);

  useEffect(() => {
    if (!SUPABASE_IS_CONFIGURED) {
      return;
    }

    let isMounted = true;

    async function syncUser() {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data.user;

        if (!isMounted) return;

        if (!user) {
          setAuthUserId("");
          setProfileLabel("");
          setState(EMPTY_STATE);
          setAuthResolved(true);
          return;
        }

        await ensureProfileForAuthUser(user);

        if (!isMounted) return;

        setAuthUserId(user.id);
        setProfileLabel(
          resolveProfileLabel(
            user.email,
            user.user_metadata?.username?.toString() ??
              user.user_metadata?.full_name?.toString()
          )
        );

        const nextState = await fetchSocialGraphState(user.id);
        if (!isMounted) return;
        setState(nextState);
        setAuthResolved(true);
      } catch (error) {
        if (!isMounted) return;
        handleAppStateError("syncUser", error);
      }
    }

    void syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;

      if (!user) {
        setAuthUserId("");
        setProfileLabel("");
        setState(EMPTY_STATE);
        setAuthResolved(true);
        return;
      }

      void (async () => {
        try {
          await ensureProfileForAuthUser(user);
          setAuthUserId(user.id);
          setProfileLabel(
            resolveProfileLabel(
              user.email,
              user.user_metadata?.username?.toString() ??
                user.user_metadata?.full_name?.toString()
            )
          );
          const nextState = await fetchSocialGraphState(user.id);
          setState(nextState);
          setAuthResolved(true);
        } catch (error) {
          handleAppStateError("onAuthStateChange", error);
        }
      })();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [handleAppStateError]);

  useEffect(() => {
    if (!authUserId) return;

    const handleFocus = () => {
      void refreshState();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [authUserId, refreshState]);

  const addHabit = useCallback(
    async (draft: HabitDraft) => {
      if (!authUserId) return;

      const createdHabit = await createHabitRecord(authUserId, draft);
      setState((currentState) => ({
        ...currentState,
        currentUserId: currentState.currentUserId || authUserId,
        habits: [
          createdHabit,
          ...currentState.habits.filter((habit) => habit.id !== createdHabit.id),
        ],
      }));

      window.setTimeout(() => {
        void refreshState();
      }, 500);
    },
    [authUserId, refreshState]
  );

  const updateHabit = useCallback(
    async (habitId: string, updates: Partial<HabitDraft>) => {
      await updateHabitRecord(habitId, updates);
      await refreshState();
    },
    [refreshState]
  );

  const updateHabitStatus = useCallback(
    async (habitId: string, nextStatus: HabitTodayStatus) => {
      const habit = currentUserHabits.find((item) => item.id === habitId);
      if (!habit) return;

      const nextHabitState = buildNextHabitStatus(habit, nextStatus);

      await updateHabitStatusRecord(habitId, nextHabitState);

      setState((currentState) => ({
        ...currentState,
        habits: currentState.habits.map((item) =>
          item.id === habitId
            ? {
                ...item,
                todayStatus: nextHabitState.todayStatus,
                currentStreak: nextHabitState.currentStreak,
                longestStreak: nextHabitState.longestStreak,
                createdAt: nextHabitState.createdAt,
              }
            : item
        ),
      }));

      window.setTimeout(() => {
        void refreshState();
      }, 300);
    },
    [currentUserHabits, refreshState]
  );

  const deleteHabit = useCallback(
    async (habitId: string) => {
      await deleteHabitRecord(habitId);
      await refreshState();
    },
    [refreshState]
  );

  const archiveHabit = useCallback(
    async (habitId: string) => {
      await archiveHabitRecord(habitId);
      await refreshState();
    },
    [refreshState]
  );

  const restoreHabit = useCallback(
    async (habitId: string) => {
      await restoreHabitRecord(habitId);
      await refreshState();
    },
    [refreshState]
  );

  const sendPartnerRequest = useCallback(
    async (targetUserId: string) => {
      if (!authUserId || currentPartnership) return;

      const existing = getPendingPartnerRequestBetweenUsers(
        state,
        authUserId,
        targetUserId
      );
      if (existing) return;

      await createPartnerRequestRecord(authUserId, targetUserId);
      await refreshState();
    },
    [authUserId, currentPartnership, refreshState, state]
  );

  const acceptPartnerRequest = useCallback(
    async (requestId: string) => {
      const request = state.partnerRequests.find((item) => item.id === requestId);
      if (!request) return;

      await createPartnershipRecord(request.fromUserId, request.toUserId);
      await updatePartnerRequestStatusRecord(requestId, "accepted");
      await refreshState();
    },
    [refreshState, state.partnerRequests]
  );

  const declinePartnerRequest = useCallback(
    async (requestId: string) => {
      await updatePartnerRequestStatusRecord(requestId, "declined");
      await refreshState();
    },
    [refreshState]
  );

  const cancelPartnerRequest = useCallback(
    async (requestId: string) => {
      await updatePartnerRequestStatusRecord(requestId, "cancelled");
      await refreshState();
    },
    [refreshState]
  );

  const disconnectPartnership = useCallback(async () => {
    if (!currentPartnership) return;

    const [firstMemberId, secondMemberId] = currentPartnership.memberIds;
    await deletePartnershipsBetweenUsers(firstMemberId, secondMemberId);
    setState((currentState) => ({
      ...currentState,
      partnerships: currentState.partnerships.filter(
        (partnership) =>
          !(
            partnership.memberIds.includes(firstMemberId) &&
            partnership.memberIds.includes(secondMemberId)
          )
      ),
    }));

    window.setTimeout(() => {
      void refreshState();
    }, 750);
  }, [currentPartnership, refreshState]);

  const getPartnerHabits = useCallback(
    (partnerId: string) => getVisiblePartnerHabits(state, partnerId, effectiveCurrentUserId),
    [effectiveCurrentUserId, state]
  );

  const proposeSharedHabit = useCallback(
    async (sourceHabitId: string, partnerUserId: string) => {
      if (!authUserId) return;

      const sourceHabit = state.habits.find((habit) => habit.id === sourceHabitId);
      if (!sourceHabit) return;

      await createSharedHabitRecord(authUserId, partnerUserId, sourceHabit);
      await refreshState();
    },
    [authUserId, refreshState, state.habits]
  );

  const acceptSharedHabit = useCallback(
    async (sharedHabitId: string) => {
      if (!authUserId) return;
      await acceptSharedHabitRecord(sharedHabitId, authUserId);
      await refreshState();
    },
    [authUserId, refreshState]
  );

  const declineSharedHabit = useCallback(
    async (sharedHabitId: string) => {
      await archiveSharedHabitRecord(sharedHabitId);
      await refreshState();
    },
    [refreshState]
  );

  const updateSharedHabitStatus = useCallback(
    async (sharedHabitId: string, status: HabitTodayStatus) => {
      if (!authUserId) return;
      const sharedHabit = state.sharedHabits.find((item) => item.id === sharedHabitId);

      if (sharedHabit?.kind === "quit" && status === "missed") {
        await resetSharedQuitHabitRecord(sharedHabitId, authUserId);
        await refreshState();
        return;
      }

      await upsertSharedHabitLogRecord(sharedHabitId, authUserId, status);
      await refreshState();
    },
    [authUserId, refreshState, state.sharedHabits]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthUserId("");
    setProfileLabel("");
    setState(EMPTY_STATE);
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      currentUser,
      currentPartner,
      currentPartnership,
      profileLabel,
      currentUserHabits,
      discoverableUsers,
      incomingPartnerRequests,
      outgoingPartnerRequests,
      activeSharedHabits,
      pendingSharedInvitations,
      pendingSharedOutgoing,
      authResolved,
      isAuthenticated: Boolean(authUserId),
      refreshState,
      logout,
      addHabit,
      updateHabit,
      updateHabitStatus,
      deleteHabit,
      archiveHabit,
      restoreHabit,
      sendPartnerRequest,
      acceptPartnerRequest,
      declinePartnerRequest,
      cancelPartnerRequest,
      disconnectPartnership,
      getPartnerHabits,
      proposeSharedHabit,
      acceptSharedHabit,
      declineSharedHabit,
      updateSharedHabitStatus,
    }),
    [
      state,
      currentUser,
      currentPartner,
      currentPartnership,
      profileLabel,
      currentUserHabits,
      discoverableUsers,
      incomingPartnerRequests,
      outgoingPartnerRequests,
      activeSharedHabits,
      pendingSharedInvitations,
      pendingSharedOutgoing,
      authResolved,
      authUserId,
      refreshState,
      logout,
      addHabit,
      updateHabit,
      updateHabitStatus,
      deleteHabit,
      archiveHabit,
      restoreHabit,
      sendPartnerRequest,
      acceptPartnerRequest,
      declinePartnerRequest,
      cancelPartnerRequest,
      disconnectPartnership,
      getPartnerHabits,
      proposeSharedHabit,
      acceptSharedHabit,
      declineSharedHabit,
      updateSharedHabitStatus,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }

  return context;
}

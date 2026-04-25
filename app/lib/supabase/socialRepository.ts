import type { User } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabaseClient";
import type { Habit, HabitDraft, HabitTodayStatus } from "@/types/habit";
import type {
  AppUser,
  PartnerRequest,
  Partnership,
  SharedHabit,
  SharedHabitLog,
  SharedHabitMember,
  SocialGraphState,
} from "@/types/social";

type ProfileRow = {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  is_active: boolean | null;
  created_at: string | null;
  joined_at: string | null;
  bio: string | null;
  status_line: string | null;
  shareable_habit_count: number | null;
  active_series_count: number | null;
};

type HabitRow = {
  id: string;
  user_id: string | null;
  owner_user_id?: string | null;
  name: string;
  category: string;
  kind: Habit["kind"];
  created_at: string;
  current_streak: number | null;
  longest_streak: number | null;
  today_status: HabitTodayStatus | null;
  is_shareable?: boolean | null;
  visibility?: Habit["visibility"] | null;
  archived_at?: string | null;
  note: string | null;
};

type PartnerRequestRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: PartnerRequest["status"];
  created_at: string;
  responded_at: string | null;
  message: string | null;
};

type PartnershipRow = {
  id: string;
  first_user_id: string;
  second_user_id: string;
  status: Partnership["status"];
  connected_at: string;
};

type SharedHabitRow = {
  id: string;
  source_habit_id: string | null;
  name: string;
  category: string;
  kind: SharedHabit["kind"];
  note: string | null;
  proposed_by_user_id: string;
  created_at: string;
  accepted_at: string | null;
  status: SharedHabit["status"];
};

type SharedHabitMemberRow = {
  id: string;
  shared_habit_id: string;
  user_id: string;
  status: SharedHabitMember["status"];
  joined_at: string | null;
  responded_at: string | null;
};

type SharedHabitLogRow = {
  id: string;
  shared_habit_id: string;
  user_id: string;
  date: string;
  status: SharedHabitLog["status"];
  recorded_at: string;
};

type ProfilesDiscoveryRow = ProfileRow;

function isOptionalRelationError(error: { code?: string | null; message?: string | null }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("could not find the column")
  );
}

function isMissingColumnError(
  error: { code?: string | null; message?: string | null },
  columnName: string
) {
  const message = error.message?.toLowerCase() ?? "";
  return error.code === "42703" && message.includes(columnName.toLowerCase());
}

function isMissingFunctionError(error: { code?: string | null; message?: string | null }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42883" ||
    message.includes("function") ||
    message.includes("could not find the function")
  );
}

function isDuplicateRecordError(error: { code?: string | null; message?: string | null }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "23505" ||
    message.includes("duplicate key") ||
    message.includes("already exists")
  );
}

async function resolveOptionalQuery<T>(
  query: PromiseLike<{ data: T[] | null; error: { code?: string | null; message?: string | null } | null }>
) {
  const result = await query;

  if (result.error && isOptionalRelationError(result.error)) {
    return { data: [] as T[], error: null };
  }

  return result;
}

function toNumericValue(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeHabitVisibility(
  visibility: Habit["visibility"] | "partners" | null | undefined,
  isShareable?: boolean | null
): Habit["visibility"] {
  if (visibility === "partner_visible" || visibility === "partners") {
    return "partner_visible";
  }

  if (isShareable) {
    return "partner_visible";
  }

  return "private";
}

function toAppUser(row: ProfileRow): AppUser {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name || row.username,
    isActive: row.is_active ?? true,
    joinedAt: row.created_at ?? row.joined_at ?? new Date().toISOString(),
    bio: row.bio ?? "Profil açıklaması henüz eklenmedi.",
    statusLine: row.status_line ?? "Bugünkü ritmine odaklanıyor.",
    shareableHabitCount: row.shareable_habit_count ?? 0,
    activeSeriesCount: row.active_series_count ?? 0,
  };
}

function toHabit(row: HabitRow): Habit {
  const visibility = normalizeHabitVisibility(row.visibility, row.is_shareable);

  return {
    id: row.id,
    ownerUserId: row.user_id ?? row.owner_user_id ?? "",
    name: row.name,
    category: row.category,
    kind: row.kind,
    createdAt: row.created_at,
    currentStreak: toNumericValue(row.current_streak),
    longestStreak: toNumericValue(row.longest_streak),
    todayStatus: row.today_status ?? "pending",
    isShareable: visibility === "partner_visible",
    visibility,
    archivedAt: row.archived_at ?? undefined,
    note: row.note ?? undefined,
  };
}

function toPartnerRequest(row: PartnerRequestRow): PartnerRequest {
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    status: row.status,
    createdAt: row.created_at,
    respondedAt: row.responded_at ?? undefined,
    message: row.message ?? undefined,
  };
}

function toPartnership(row: PartnershipRow): Partnership {
  return {
    id: row.id,
    memberIds: [row.first_user_id, row.second_user_id],
    status: row.status,
    connectedAt: row.connected_at,
  };
}

function toSharedHabit(row: SharedHabitRow): SharedHabit {
  return {
    id: row.id,
    sourceHabitId: row.source_habit_id ?? "",
    name: row.name,
    category: row.category,
    kind: row.kind,
    note: row.note ?? undefined,
    proposedByUserId: row.proposed_by_user_id,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at ?? undefined,
    status: row.status,
  };
}

function toSharedHabitMember(row: SharedHabitMemberRow): SharedHabitMember {
  return {
    id: row.id,
    sharedHabitId: row.shared_habit_id,
    userId: row.user_id,
    status: row.status,
    joinedAt: row.joined_at ?? undefined,
    respondedAt: row.responded_at ?? undefined,
  };
}

function toSharedHabitLog(row: SharedHabitLogRow): SharedHabitLog {
  return {
    id: row.id,
    sharedHabitId: row.shared_habit_id,
    userId: row.user_id,
    date: row.date,
    status: row.status,
    recordedAt: row.recorded_at,
  };
}

function getProfileDefaults(user: User) {
  const metadataUsername = user.user_metadata?.username?.toString().trim();
  const username = (metadataUsername || user.email?.split("@")[0] || user.id.slice(0, 8)).toLowerCase();

  return {
    username,
  };
}

async function fetchProfilesForDiscovery() {
  const rpcResult = await supabase
    .rpc("list_discoverable_profiles")
    .returns<ProfilesDiscoveryRow[]>();

  if (!rpcResult.error) {
    return rpcResult;
  }

  const directResult = await supabase.from("profiles").select("*").returns<ProfileRow[]>();

  if (!directResult.error) {
    return directResult;
  }

  if (isMissingFunctionError(rpcResult.error)) {
    return directResult;
  }

  return rpcResult;
}

async function fetchHabitsForOwner(userId: string) {
  const primaryResult = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<HabitRow[]>();

  if (!primaryResult.error) {
    return primaryResult;
  }

  if (isMissingColumnError(primaryResult.error, "user_id")) {
    return resolveOptionalQuery(
      supabase
        .from("habits")
        .select("*")
        .eq("owner_user_id", userId)
        .order("created_at", { ascending: false })
        .returns<HabitRow[]>()
    );
  }

  if (isOptionalRelationError(primaryResult.error)) {
    return { data: [] as HabitRow[], error: null };
  }

  return primaryResult;
}

async function fetchPartnerVisibleHabits(partnerIds: string[]) {
  if (partnerIds.length === 0) {
    return { data: [] as HabitRow[], error: null };
  }

  const primaryResult = await supabase
    .from("habits")
    .select("*")
    .in("user_id", partnerIds)
    .eq("visibility", "partner_visible")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .returns<HabitRow[]>();

  if (!primaryResult.error) {
    return primaryResult;
  }

  if (isOptionalRelationError(primaryResult.error)) {
    const ownerColumn = isMissingColumnError(primaryResult.error, "user_id")
      ? "owner_user_id"
      : "user_id";

    const fallbackResult = await resolveOptionalQuery(
      supabase
        .from("habits")
        .select("*")
        .in(ownerColumn, partnerIds)
        .order("created_at", { ascending: false })
        .returns<HabitRow[]>()
    );

    if (fallbackResult.error) {
      return fallbackResult;
    }

    return {
      data: (fallbackResult.data ?? []).filter((row) => {
        const visibility = normalizeHabitVisibility(row.visibility, row.is_shareable);
        return visibility === "partner_visible" && !row.archived_at;
      }),
      error: null,
    };
  }

  return primaryResult;
}

export async function ensureProfileForAuthUser(user: User) {
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile) return;

  const defaults = getProfileDefaults(user);
  const now = new Date().toISOString();

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    email: user.email?.trim().toLowerCase() ?? "",
    created_at: now,
    ...defaults,
  });

  if (error) {
    throw error;
  }
}

export async function fetchSocialGraphState(currentUserId: string): Promise<SocialGraphState> {
  const profilesPromise = fetchProfilesForDiscovery();

  const partnerRequestsPromise = resolveOptionalQuery(
    supabase
      .from("partner_requests")
      .select("*")
      .or(`from_user_id.eq.${currentUserId},to_user_id.eq.${currentUserId}`)
      .order("created_at", { ascending: false })
      .returns<PartnerRequestRow[]>()
  );

  const partnershipsPromise = resolveOptionalQuery(
    supabase
      .from("partnerships")
      .select("*")
      .or(`first_user_id.eq.${currentUserId},second_user_id.eq.${currentUserId}`)
      .eq("status", "active")
      .returns<PartnershipRow[]>()
  );

  const myHabitsPromise = fetchHabitsForOwner(currentUserId);

  const sharedMemberRowsPromise = resolveOptionalQuery(
    supabase
      .from("shared_habit_members")
      .select("*")
      .eq("user_id", currentUserId)
      .returns<SharedHabitMemberRow[]>()
  );

  const [
    profilesResult,
    partnerRequestsResult,
    partnershipsResult,
    myHabitsResult,
    sharedMemberRowsResult,
  ] = await Promise.all([
    profilesPromise,
    partnerRequestsPromise,
    partnershipsPromise,
    myHabitsPromise,
    sharedMemberRowsPromise,
  ]);

  if (myHabitsResult.error) throw myHabitsResult.error;
  const profileRows = Array.isArray(profilesResult.data) ? profilesResult.data : [];
  const partnerRequestRows = partnerRequestsResult.error
    ? []
    : partnerRequestsResult.data ?? [];
  const partnershipRows = partnershipsResult.error
    ? []
    : partnershipsResult.data ?? [];
  const partnerIds = partnershipRows.flatMap((row) =>
    [row.first_user_id, row.second_user_id].filter((id) => id !== currentUserId)
  );

  const partnerHabitsResult = await fetchPartnerVisibleHabits(partnerIds);
  const partnerHabitRows = partnerHabitsResult.error ? [] : partnerHabitsResult.data ?? [];
  const sharedMemberRows = sharedMemberRowsResult.error
    ? []
    : sharedMemberRowsResult.data ?? [];
  const sharedHabitIds = [...new Set(sharedMemberRows.map((row) => row.shared_habit_id))];

  const sharedHabitsResult = sharedHabitIds.length
    ? await resolveOptionalQuery(
        supabase
          .from("shared_habits")
          .select("*")
          .in("id", sharedHabitIds)
          .order("created_at", { ascending: false })
          .returns<SharedHabitRow[]>()
      )
    : { data: [] as SharedHabitRow[], error: null };
  const allSharedMemberRowsResult = sharedHabitIds.length
    ? await resolveOptionalQuery(
        supabase
          .from("shared_habit_members")
          .select("*")
          .in("shared_habit_id", sharedHabitIds)
          .returns<SharedHabitMemberRow[]>()
      )
    : { data: [] as SharedHabitMemberRow[], error: null };
  const sharedLogsResult = sharedHabitIds.length
    ? await resolveOptionalQuery(
        supabase
          .from("shared_habit_logs")
          .select("*")
          .in("shared_habit_id", sharedHabitIds)
          .returns<SharedHabitLogRow[]>()
      )
    : { data: [] as SharedHabitLogRow[], error: null };
  const sharedHabitRows = sharedHabitsResult.error ? [] : sharedHabitsResult.data ?? [];
  const allSharedMemberRows = allSharedMemberRowsResult.error
    ? []
    : allSharedMemberRowsResult.data ?? [];
  const sharedLogRows = sharedLogsResult.error ? [] : sharedLogsResult.data ?? [];

  return {
    currentUserId,
    users: profileRows
      .filter((profile) => profile.is_active ?? true)
      .map(toAppUser),
    habits: [...(myHabitsResult.data ?? []), ...partnerHabitRows].map(toHabit),
    partnerRequests: partnerRequestRows.map(toPartnerRequest),
    partnerships: partnershipRows.map(toPartnership),
    sharedHabits: sharedHabitRows.map(toSharedHabit),
    sharedHabitMembers: allSharedMemberRows.map(toSharedHabitMember),
    sharedHabitLogs: sharedLogRows.map(toSharedHabitLog),
  };
}

export async function createHabitRecord(currentUserId: string, draft: HabitDraft) {
  const visibility = draft.visibility === "partner_visible" ? "partner_visible" : "private";
  const basePayload = {
    name: draft.name,
    category: draft.category,
    kind: draft.kind,
    note: draft.note ?? null,
    current_streak: 0,
    longest_streak: 0,
    today_status: "pending" as HabitTodayStatus,
  };

  const insertAttempts: Array<Record<string, unknown>> = [
    {
      user_id: currentUserId,
      visibility,
      ...basePayload,
    },
    {
      owner_user_id: currentUserId,
      visibility,
      ...basePayload,
    },
    {
      user_id: currentUserId,
      is_shareable: visibility === "partner_visible",
      ...basePayload,
    },
    {
      owner_user_id: currentUserId,
      is_shareable: visibility === "partner_visible",
      ...basePayload,
    },
    {
      user_id: currentUserId,
      ...basePayload,
    },
    {
      owner_user_id: currentUserId,
      ...basePayload,
    },
  ];

  let lastError: { code?: string | null; message?: string | null } | null = null;

  for (const payload of insertAttempts) {
    const { data, error } = await supabase
      .from("habits")
      .insert(payload)
      .select("*")
      .single<HabitRow>();

    if (!error && data) {
      return toHabit({
        ...data,
        user_id: data.user_id ?? currentUserId,
        owner_user_id: data.owner_user_id ?? currentUserId,
        visibility:
          data.visibility ??
          (typeof payload.visibility === "string"
            ? (payload.visibility as Habit["visibility"])
            : null),
        is_shareable:
          data.is_shareable ??
          (typeof payload.is_shareable === "boolean"
            ? (payload.is_shareable as boolean)
            : visibility === "partner_visible"),
      });
    }

    lastError = error;

    if (
      !error ||
      (!isMissingColumnError(error, "user_id") &&
        !isMissingColumnError(error, "owner_user_id") &&
        !isMissingColumnError(error, "visibility") &&
        !isMissingColumnError(error, "is_shareable"))
    ) {
      break;
    }
  }

  throw lastError;
}

export async function updateHabitRecord(
  habitId: string,
  updates: Partial<
    Pick<Habit, "name" | "category" | "kind" | "note" | "isShareable" | "visibility">
  >
) {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.kind !== undefined) payload.kind = updates.kind;
  if (updates.note !== undefined) payload.note = updates.note ?? null;
  if (updates.visibility !== undefined) {
    payload.visibility =
      updates.visibility === "partner_visible" ? "partner_visible" : "private";
  }

  const { error } = await supabase.from("habits").update(payload).eq("id", habitId);
  if (error) throw error;
}

export async function updateHabitStatusRecord(
  habitId: string,
  updates: Pick<Habit, "todayStatus" | "currentStreak" | "longestStreak" | "createdAt">
) {
  const { error } = await supabase
    .from("habits")
    .update({
      today_status: updates.todayStatus,
      current_streak: updates.currentStreak,
      longest_streak: updates.longestStreak,
      created_at: updates.createdAt,
    })
    .eq("id", habitId);

  if (error) throw error;
}

export async function archiveHabitRecord(habitId: string) {
  const { error } = await supabase
    .from("habits")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", habitId);
  if (error) throw error;
}

export async function restoreHabitRecord(habitId: string) {
  const { error } = await supabase
    .from("habits")
    .update({ archived_at: null })
    .eq("id", habitId);
  if (error) throw error;
}

export async function deleteHabitRecord(habitId: string) {
  const { error } = await supabase.from("habits").delete().eq("id", habitId);
  if (error) throw error;
}

export async function createPartnerRequestRecord(
  currentUserId: string,
  targetUserId: string
) {
  const basePayload = {
    from_user_id: currentUserId,
    to_user_id: targetUserId,
  };

  const fullPayload = {
    ...basePayload,
    status: "pending",
    message: "Partner olarak birlikte ilerleyelim.",
  };

  const firstAttempt = await supabase.from("partner_requests").insert(fullPayload);

  if (!firstAttempt.error) {
    return;
  }

  if (isMissingColumnError(firstAttempt.error, "message")) {
    const secondAttempt = await supabase.from("partner_requests").insert({
      ...basePayload,
      status: "pending",
    });

    if (!secondAttempt.error) {
      return;
    }

    if (isMissingColumnError(secondAttempt.error, "status")) {
      const thirdAttempt = await supabase.from("partner_requests").insert(basePayload);
      if (!thirdAttempt.error) {
        return;
      }

      throw thirdAttempt.error;
    }

    throw secondAttempt.error;
  }

  if (isMissingColumnError(firstAttempt.error, "status")) {
    const secondAttempt = await supabase.from("partner_requests").insert(basePayload);
    if (!secondAttempt.error) {
      return;
    }

    throw secondAttempt.error;
  }

  throw firstAttempt.error;
}

export async function updatePartnerRequestStatusRecord(
  requestId: string,
  status: PartnerRequest["status"]
) {
  const { error } = await supabase
    .from("partner_requests")
    .update({
      status,
      responded_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) throw error;
}

export async function createPartnershipRecord(firstUserId: string, secondUserId: string) {
  const normalizedIds = [firstUserId, secondUserId].sort();
  const connectedAt = new Date().toISOString();
  const basePayload = {
    first_user_id: normalizedIds[0],
    second_user_id: normalizedIds[1],
  };

  const fullAttempt = await supabase.from("partnerships").insert({
    ...basePayload,
    status: "active",
    connected_at: connectedAt,
  });

  if (!fullAttempt.error || isDuplicateRecordError(fullAttempt.error)) {
    return;
  }

  if (
    isMissingColumnError(fullAttempt.error, "connected_at") ||
    isMissingColumnError(fullAttempt.error, "status")
  ) {
    const fallbackPayload = {
      ...basePayload,
      ...(isMissingColumnError(fullAttempt.error, "status") ? {} : { status: "active" }),
      ...(isMissingColumnError(fullAttempt.error, "connected_at")
        ? {}
        : { connected_at: connectedAt }),
    };

    const secondAttempt = await supabase.from("partnerships").insert(fallbackPayload);
    if (!secondAttempt.error || isDuplicateRecordError(secondAttempt.error)) {
      return;
    }

    throw secondAttempt.error;
  }

  throw fullAttempt.error;
}

export async function deletePartnershipsBetweenUsers(
  firstUserId: string,
  secondUserId: string
) {
  const normalizedIds = [firstUserId, secondUserId].sort();
  const pairFilter = `and(first_user_id.eq.${normalizedIds[0]},second_user_id.eq.${normalizedIds[1]}),and(first_user_id.eq.${normalizedIds[1]},second_user_id.eq.${normalizedIds[0]})`;
  const partnershipsQuery = supabase
    .from("partnerships")
    .select("id")
    .or(pairFilter);

  const { data: existingRows, error: existingError } = await partnershipsQuery;
  if (existingError) {
    throw existingError;
  }

  if (!existingRows || existingRows.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("partnerships")
    .delete()
    .or(pairFilter);

  if (error) {
    throw error;
  }

  const { data: remainingRows, error: remainingError } = await supabase
    .from("partnerships")
    .select("id")
    .or(pairFilter);

  if (remainingError) {
    throw remainingError;
  }

  if (remainingRows && remainingRows.length > 0) {
    throw new Error(
      "Partner bağlantısı veritabanından silinemedi. Supabase'te `partnerships_involved_delete` policy'sini çalıştırman gerekiyor."
    );
  }
}

export async function createSharedHabitRecord(
  currentUserId: string,
  partnerUserId: string,
  sourceHabit: Habit
) {
  const now = new Date().toISOString();
  const sharedHabitId = crypto.randomUUID();

  const { error } = await supabase
    .from("shared_habits")
    .insert({
      id: sharedHabitId,
      source_habit_id: sourceHabit.id,
      name: sourceHabit.name,
      category: sourceHabit.category,
      kind: sourceHabit.kind,
      note: sourceHabit.note ?? null,
      proposed_by_user_id: currentUserId,
      created_at: now,
      status: "pending",
    });

  if (error) throw error;

  const { error: membersError } = await supabase.from("shared_habit_members").insert([
    {
      shared_habit_id: sharedHabitId,
      user_id: currentUserId,
      status: "accepted",
      joined_at: now,
      responded_at: now,
    },
    {
      shared_habit_id: sharedHabitId,
      user_id: partnerUserId,
      status: "pending",
    },
  ]);

  if (membersError) throw membersError;
}

export async function acceptSharedHabitRecord(sharedHabitId: string, currentUserId: string) {
  const now = new Date().toISOString();

  const { error: habitError } = await supabase
    .from("shared_habits")
    .update({
      status: "active",
      accepted_at: now,
    })
    .eq("id", sharedHabitId);

  if (habitError) throw habitError;

  const { error: memberError } = await supabase
    .from("shared_habit_members")
    .update({
      status: "accepted",
      joined_at: now,
      responded_at: now,
    })
    .eq("shared_habit_id", sharedHabitId)
    .eq("user_id", currentUserId);

  if (memberError) throw memberError;
}

export async function archiveSharedHabitRecord(sharedHabitId: string) {
  const { error } = await supabase
    .from("shared_habits")
    .update({
      status: "archived",
    })
    .eq("id", sharedHabitId);

  if (error) throw error;
}

export async function upsertSharedHabitLogRecord(
  sharedHabitId: string,
  currentUserId: string,
  status: HabitTodayStatus
) {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const { error } = await supabase.from("shared_habit_logs").upsert(
    {
      shared_habit_id: sharedHabitId,
      user_id: currentUserId,
      date: today,
      status,
      recorded_at: now,
    },
    { onConflict: "shared_habit_id,user_id,date" }
  );

  if (error) throw error;
}

export async function resetSharedQuitHabitRecord(
  sharedHabitId: string,
  currentUserId: string
) {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const { error: logError } = await supabase.from("shared_habit_logs").upsert(
    {
      shared_habit_id: sharedHabitId,
      user_id: currentUserId,
      date: today,
      status: "missed",
      recorded_at: now,
    },
    { onConflict: "shared_habit_id,user_id,date" }
  );

  if (logError) throw logError;
}

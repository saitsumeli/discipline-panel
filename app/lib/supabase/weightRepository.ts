import { SUPABASE_IS_CONFIGURED, supabase } from "@/app/lib/supabaseClient";
import type { WeightProgress } from "@/types/weight";

type WeightProfileRow = {
  user_id: string;
  start_weight: number | string;
  current_weight: number | string;
  target_weight: number | string;
  updated_at: string | null;
  created_at: string | null;
};

type WeightEntryRow = {
  id: string;
  user_id: string;
  value?: number | string | null;
  weight_value?: number | string | null;
  recorded_at: string;
};

type SupabaseErrorLike = {
  code?: string | null;
  message?: string | null;
};

export class WeightStorageUnavailableError extends Error {
  constructor(message = "Weight storage is not available in Supabase yet.") {
    super(message);
    this.name = "WeightStorageUnavailableError";
  }
}

function isOptionalRelationError(error: SupabaseErrorLike) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("could not find the column")
  );
}

function ensureStorageReady(error: SupabaseErrorLike | null) {
  if (error && isOptionalRelationError(error)) {
    throw new WeightStorageUnavailableError(
      "Supabase'te `weight_profiles` / `weight_entries` tabloları henüz hazır değil."
    );
  }
}

function isMissingColumnError(error: SupabaseErrorLike | null, columnName: string) {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "42703" && message.includes(columnName.toLowerCase());
}

function toNumber(value: number | string) {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toWeightProgress(profile: WeightProfileRow, entries: WeightEntryRow[]): WeightProgress {
  return {
    startWeight: toNumber(profile.start_weight),
    currentWeight: toNumber(profile.current_weight),
    targetWeight: toNumber(profile.target_weight),
    updatedAt: profile.updated_at ?? profile.created_at ?? new Date().toISOString(),
    entries: entries.map((entry) => ({
      value: toNumber(entry.value ?? entry.weight_value ?? 0),
      recordedAt: entry.recorded_at,
    })),
  };
}

async function insertWeightEntry(
  userId: string,
  weight: number,
  recordedAt: string
) {
  const attempts: Array<Record<string, unknown>> = [
    {
      user_id: userId,
      value: weight,
      weight_value: weight,
      recorded_at: recordedAt,
    },
    {
      user_id: userId,
      value: weight,
      recorded_at: recordedAt,
    },
    {
      user_id: userId,
      weight_value: weight,
      recorded_at: recordedAt,
    },
  ];

  let lastError: SupabaseErrorLike | null = null;

  for (const payload of attempts) {
    const result = await supabase.from("weight_entries").insert(payload);

    ensureStorageReady(result.error);

    if (!result.error) {
      return;
    }

    lastError = result.error;

    if (
      !isMissingColumnError(result.error, "value") &&
      !isMissingColumnError(result.error, "weight_value")
    ) {
      break;
    }
  }

  throw lastError;
}

export async function fetchWeightProgress(userId: string) {
  if (!SUPABASE_IS_CONFIGURED || !userId) return null;

  const [profileResult, entriesResult] = await Promise.all([
    supabase
      .from("weight_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle<WeightProfileRow>(),
    supabase
      .from("weight_entries")
      .select("*")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(30)
      .returns<WeightEntryRow[]>(),
  ]);

  ensureStorageReady(profileResult.error);
  ensureStorageReady(entriesResult.error);

  if (profileResult.error) throw profileResult.error;
  if (entriesResult.error) throw entriesResult.error;
  if (!profileResult.data) return null;

  return toWeightProgress(profileResult.data, entriesResult.data ?? []);
}

export async function createWeightProfileRecord(
  userId: string,
  startWeight: number,
  targetWeight: number,
  recordedAt: string
) {
  const profileResult = await supabase.from("weight_profiles").upsert(
    {
      user_id: userId,
      start_weight: startWeight,
      current_weight: startWeight,
      target_weight: targetWeight,
      updated_at: recordedAt,
    },
    { onConflict: "user_id" }
  );

  ensureStorageReady(profileResult.error);
  if (profileResult.error) throw profileResult.error;

  await insertWeightEntry(userId, startWeight, recordedAt);
}

export async function updateWeightProfileRecord(
  userId: string,
  startWeight: number,
  currentWeight: number,
  targetWeight: number,
  recordedAt: string
) {
  const profileResult = await supabase.from("weight_profiles").upsert(
    {
      user_id: userId,
      start_weight: startWeight,
      current_weight: currentWeight,
      target_weight: targetWeight,
      updated_at: recordedAt,
    },
    { onConflict: "user_id" }
  );

  ensureStorageReady(profileResult.error);
  if (profileResult.error) throw profileResult.error;

  await insertWeightEntry(userId, currentWeight, recordedAt);
}

export async function resetWeightProfileRecord(userId: string) {
  const entriesResult = await supabase.from("weight_entries").delete().eq("user_id", userId);
  ensureStorageReady(entriesResult.error);
  if (entriesResult.error) throw entriesResult.error;

  const profileResult = await supabase
    .from("weight_profiles")
    .delete()
    .eq("user_id", userId);

  ensureStorageReady(profileResult.error);
  if (profileResult.error) throw profileResult.error;
}

export async function importWeightProgress(userId: string, weightProgress: WeightProgress) {
  const profileResult = await supabase.from("weight_profiles").upsert(
    {
      user_id: userId,
      start_weight: weightProgress.startWeight,
      current_weight: weightProgress.currentWeight,
      target_weight: weightProgress.targetWeight,
      updated_at: weightProgress.updatedAt,
    },
    { onConflict: "user_id" }
  );

  ensureStorageReady(profileResult.error);
  if (profileResult.error) throw profileResult.error;

  const countResult = await supabase
    .from("weight_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  ensureStorageReady(countResult.error);
  if (countResult.error) throw countResult.error;

  if ((countResult.count ?? 0) > 0 || weightProgress.entries.length === 0) {
    return;
  }

  for (const entry of weightProgress.entries) {
    await insertWeightEntry(userId, entry.value, entry.recordedAt);
  }
}

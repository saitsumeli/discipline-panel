import type { WeightProgress } from "@/types/weight";

export function getWeightStorageKey(userId: string | null) {
  return userId ? `weight-progress:${userId}` : "weight-progress:guest";
}

export function getWeightStorageBackupKey(userId: string | null) {
  return userId ? `weight-progress-backup:${userId}` : "weight-progress-backup:guest";
}

export function readSavedWeightProgress(userId: string | null) {
  if (typeof window === "undefined") return null;

  const savedWeight = window.localStorage.getItem(getWeightStorageKey(userId));
  if (!savedWeight) return null;

  try {
    return JSON.parse(savedWeight) as WeightProgress;
  } catch {
    return null;
  }
}

export function writeSavedWeightProgress(
  userId: string | null,
  weightProgress: WeightProgress | null
) {
  if (typeof window === "undefined") return;

  const storageKey = getWeightStorageKey(userId);

  if (!weightProgress) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(weightProgress));
}

export function backupSavedWeightProgress(
  userId: string | null,
  weightProgress: WeightProgress
) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    getWeightStorageBackupKey(userId),
    JSON.stringify(weightProgress)
  );
}

export function clearSavedWeightProgress(userId: string | null) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getWeightStorageKey(userId));
}

export function migrateSavedWeightProgressToBackup(userId: string | null) {
  const savedWeight = readSavedWeightProgress(userId);
  if (!savedWeight) return null;

  backupSavedWeightProgress(userId, savedWeight);
  clearSavedWeightProgress(userId);
  return savedWeight;
}

export function formatWeightValue(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);
}

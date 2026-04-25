"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearSavedWeightProgress,
  migrateSavedWeightProgressToBackup,
  readSavedWeightProgress,
  writeSavedWeightProgress,
} from "@/app/lib/body/weightStorage";
import { SUPABASE_IS_CONFIGURED } from "@/app/lib/supabaseClient";
import {
  createWeightProfileRecord,
  fetchWeightProgress,
  importWeightProgress,
  resetWeightProfileRecord,
  updateWeightProfileRecord,
  WeightStorageUnavailableError,
} from "@/app/lib/supabase/weightRepository";
import type { WeightProgress, WeightStorageMode } from "@/types/weight";

type UseWeightProgressResult = {
  weightProgress: WeightProgress | null;
  storageMode: WeightStorageMode;
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string;
  initializeWeight: (startWeight: number, targetWeight: number) => Promise<void>;
  updateWeight: (nextWeight: number) => Promise<void>;
  resetWeight: () => Promise<void>;
  refreshWeightProgress: () => Promise<void>;
};

const LOCAL_STORAGE_WARNING =
  "Kilo verisi şu an geçici olarak bu cihazda tutuluyor. `weight_profiles` ve `weight_entries` migration'ını uyguladığında buluta taşınacak.";

function getWeightErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = error.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error && typeof error === "object" && "code" in error) {
    const code = error.code;

    if (code === "42501") {
      return "Supabase yetkisi yetersiz. `weight_profiles` / `weight_entries` RLS policy'lerini kontrol et.";
    }

    if (code === "23503") {
      return "Kullanıcı oturumu çözümlenemediği için kilo verisi ilişkilendirilemedi.";
    }

    if (code === "23514") {
      return "Girilen kilo değeri veritabanı kurallarını sağlamıyor.";
    }
  }

  return "Kilo verisi Supabase'e kaydedilemedi.";
}

function buildWeightProgress(
  startWeight: number,
  currentWeight: number,
  targetWeight: number,
  entries: WeightProgress["entries"],
  updatedAt: string
): WeightProgress {
  return {
    startWeight,
    currentWeight,
    targetWeight,
    updatedAt,
    entries,
  };
}

function isWeightStorageUnavailable(error: unknown) {
  return error instanceof WeightStorageUnavailableError;
}

export function useWeightProgress(userId: string): UseWeightProgressResult {
  const [weightProgress, setWeightProgress] = useState<WeightProgress | null>(null);
  const [storageMode, setStorageMode] = useState<WeightStorageMode>("supabase");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const applyLocalState = useCallback(
    (nextProgress: WeightProgress | null, nextMessage = LOCAL_STORAGE_WARNING) => {
      writeSavedWeightProgress(userId || null, nextProgress);
      setWeightProgress(nextProgress);
      setStorageMode("local");
      setErrorMessage(nextProgress ? nextMessage : "");
    },
    [userId]
  );

  const applySupabaseState = useCallback((nextProgress: WeightProgress | null) => {
    setWeightProgress(nextProgress);
    setStorageMode("supabase");
    setErrorMessage("");
  }, []);

  const refreshWeightProgress = useCallback(async () => {
    const legacyWeightProgress = readSavedWeightProgress(userId || null);

    if (!userId || !SUPABASE_IS_CONFIGURED) {
      setWeightProgress(legacyWeightProgress);
      setStorageMode("local");
      setErrorMessage(legacyWeightProgress ? LOCAL_STORAGE_WARNING : "");
      setIsLoading(false);
      return;
    }

    try {
      const remoteWeightProgress = await fetchWeightProgress(userId);

      if (remoteWeightProgress) {
        applySupabaseState(remoteWeightProgress);
        if (legacyWeightProgress) {
          migrateSavedWeightProgressToBackup(userId);
        }
        return;
      }

      if (!legacyWeightProgress) {
        applySupabaseState(null);
        return;
      }

      await importWeightProgress(userId, legacyWeightProgress);
      const importedWeightProgress = await fetchWeightProgress(userId);

      if (importedWeightProgress) {
        applySupabaseState(importedWeightProgress);
        migrateSavedWeightProgressToBackup(userId);
        return;
      }

      applyLocalState(legacyWeightProgress);
    } catch (error) {
      if (legacyWeightProgress && isWeightStorageUnavailable(error)) {
        applyLocalState(legacyWeightProgress);
        return;
      }

      if (!legacyWeightProgress && isWeightStorageUnavailable(error)) {
        setWeightProgress(null);
        setStorageMode("local");
        setErrorMessage(LOCAL_STORAGE_WARNING);
        return;
      }

      const fallbackMessage = getWeightErrorMessage(error);

      setWeightProgress(legacyWeightProgress);
      setStorageMode(legacyWeightProgress ? "local" : "supabase");
      setErrorMessage(legacyWeightProgress ? LOCAL_STORAGE_WARNING : fallbackMessage);
    } finally {
      setIsLoading(false);
    }
  }, [applyLocalState, applySupabaseState, userId]);

  useEffect(() => {
    void refreshWeightProgress();
  }, [refreshWeightProgress]);

  const initializeWeight = useCallback(
    async (startWeight: number, targetWeight: number) => {
      const now = new Date().toISOString();
      const nextProgress = buildWeightProgress(
        startWeight,
        startWeight,
        targetWeight,
        [{ value: startWeight, recordedAt: now }],
        now
      );

      setIsSaving(true);

      try {
        if (!SUPABASE_IS_CONFIGURED || !userId) {
          applyLocalState(nextProgress);
          return;
        }

        await createWeightProfileRecord(userId, startWeight, targetWeight, now);
        clearSavedWeightProgress(userId);
        const remoteWeightProgress = await fetchWeightProgress(userId);
        applySupabaseState(remoteWeightProgress ?? nextProgress);
      } catch (error) {
        const fallbackMessage = `Kilo verisi Supabase'e yazılamadı, bu cihazda geçici olarak saklandı. ${getWeightErrorMessage(
          error
        )}`;

        console.warn("[useWeightProgress.initializeWeight]", error);
        applyLocalState(nextProgress, fallbackMessage);
        throw new Error(fallbackMessage);
      } finally {
        setIsSaving(false);
      }
    },
    [applyLocalState, applySupabaseState, userId]
  );

  const updateWeight = useCallback(
    async (nextWeight: number) => {
      if (!weightProgress) return;

      const now = new Date().toISOString();
      const nextProgress = buildWeightProgress(
        weightProgress.startWeight,
        nextWeight,
        weightProgress.targetWeight,
        [{ value: nextWeight, recordedAt: now }, ...weightProgress.entries].slice(0, 30),
        now
      );

      setIsSaving(true);

      try {
        if (!SUPABASE_IS_CONFIGURED || !userId) {
          applyLocalState(nextProgress);
          return;
        }

        await updateWeightProfileRecord(
          userId,
          weightProgress.startWeight,
          nextWeight,
          weightProgress.targetWeight,
          now
        );
        clearSavedWeightProgress(userId);
        const remoteWeightProgress = await fetchWeightProgress(userId);
        applySupabaseState(remoteWeightProgress ?? nextProgress);
      } catch (error) {
        const fallbackMessage = `Kilo verisi Supabase'e yazılamadı, bu cihazda geçici olarak saklandı. ${getWeightErrorMessage(
          error
        )}`;

        console.warn("[useWeightProgress.updateWeight]", error);
        applyLocalState(nextProgress, fallbackMessage);
        throw new Error(fallbackMessage);
      } finally {
        setIsSaving(false);
      }
    },
    [applyLocalState, applySupabaseState, userId, weightProgress]
  );

  const resetWeight = useCallback(async () => {
    setIsSaving(true);

    try {
      if (!SUPABASE_IS_CONFIGURED || !userId) {
        applyLocalState(null, "");
        return;
      }

      await resetWeightProfileRecord(userId);
      clearSavedWeightProgress(userId);
      applySupabaseState(null);
    } catch (error) {
      if (isWeightStorageUnavailable(error)) {
        applyLocalState(null, "");
        return;
      }

      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [applyLocalState, applySupabaseState, userId]);

  return {
    weightProgress,
    storageMode,
    isLoading,
    isSaving,
    errorMessage,
    initializeWeight,
    updateWeight,
    resetWeight,
    refreshWeightProgress,
  };
}

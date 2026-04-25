export type WeightEntry = {
  value: number;
  recordedAt: string;
};

export type WeightProgress = {
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
  updatedAt: string;
  entries: WeightEntry[];
};

export type WeightStorageMode = "supabase" | "local";

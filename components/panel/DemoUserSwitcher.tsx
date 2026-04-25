"use client";

import { useRouter } from "next/navigation";
import { useAppState } from "@/components/providers/AppStateProvider";

type DemoUserSwitcherProps = {
  compact?: boolean;
};

export default function DemoUserSwitcher({
  compact = false,
}: DemoUserSwitcherProps) {
  const router = useRouter();
  const { currentUser, profileLabel, logout } = useAppState();
  const visibleLabel =
    profileLabel || currentUser?.username || currentUser?.displayName || "Profil";

  return (
    <div
      className={`panel-surface-soft flex w-full max-w-full flex-wrap items-center gap-3 rounded-2xl border border-white/8 sm:w-auto sm:flex-nowrap ${
        compact ? "px-3 py-2.5" : "px-4 py-3"
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Profil</p>

      <div className="panel-input min-w-0 flex-1 truncate rounded-xl px-3 py-2 text-sm font-medium text-slate-100 sm:min-w-[148px]">
        {visibleLabel}
      </div>

      <button
        type="button"
        onClick={async () => {
          await logout();
          router.replace("/");
        }}
        className="panel-button-secondary rounded-xl px-3 py-2 text-xs font-semibold"
      >
        Çıkış yap
      </button>
    </div>
  );
}

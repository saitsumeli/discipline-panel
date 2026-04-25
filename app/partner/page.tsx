"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import DemoUserSwitcher from "@/components/panel/DemoUserSwitcher";
import PanelShell from "@/components/panel/PanelShell";
import { useAppState } from "@/components/providers/AppStateProvider";
import PartnerHabitCard from "@/components/social/PartnerHabitCard";
import PartnerRequestCard from "@/components/social/PartnerRequestCard";
import UserDiscoveryCard from "@/components/social/UserDiscoveryCard";
import {
  getPendingPartnerRequestBetweenUsers,
  getUserById,
  getVisiblePartnerHabits,
} from "@/app/lib/social/helpers";

const TABS = [
  { id: "partner", label: "Partnerim" },
  { id: "discover", label: "Kullanıcı keşfet" },
  { id: "incoming", label: "Gelen istekler" },
  { id: "outgoing", label: "Gönderilen istekler" },
] as const;

type PartnerTab = (typeof TABS)[number]["id"];

function getDisconnectErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    const message = error.message.toLowerCase();

    if (message.includes("row-level security")) {
      return "Bağlantı yetki nedeniyle kaldırılamadı. Supabase'te `partnerships` delete policy eklenmeli.";
    }

    if (
      message.includes("veritabanından silinemedi") ||
      message.includes("partnerships_involved_delete")
    ) {
      return "Bağlantı veritabanından silinemedi. Supabase'te `partnerships_involved_delete` policy'sini çalıştırman gerekiyor.";
    }

    if (
      message.includes("could not find the table") &&
      message.includes("partnerships")
    ) {
      return "Partner bağlantı tablosu bulunamadı. Supabase'te `partnerships` kurulumunu kontrol et.";
    }

    return error.message;
  }

  return "Bağlantı kaldırılamadı. Tekrar dene.";
}

export default function PartnerPage() {
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get("tab") as PartnerTab) || "partner";
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectFeedback, setDisconnectFeedback] = useState<string | null>(null);
  const [disconnectTone, setDisconnectTone] = useState<"success" | "error">("success");
  const {
    state,
    currentPartner,
    currentPartnership,
    discoverableUsers,
    incomingPartnerRequests,
    outgoingPartnerRequests,
    activeSharedHabits,
    sendPartnerRequest,
    acceptPartnerRequest,
    declinePartnerRequest,
    cancelPartnerRequest,
    disconnectPartnership,
    proposeSharedHabit,
  } = useAppState();
  const partnerHabits = currentPartner
    ? getVisiblePartnerHabits(state, currentPartner.id, state.currentUserId)
    : [];
  const otherUsersCount = state.users.filter((user) => user.id !== state.currentUserId).length;
  const sortedDiscoverableUsers = [...discoverableUsers].sort((firstUser, secondUser) => {
    return (firstUser.displayName || firstUser.username).localeCompare(
      secondUser.displayName || secondUser.username,
      "tr"
    );
  });
  const discoverEmptyTitle = currentPartner
    ? "Keşifte yeni kullanıcı görünmüyor."
    : "Keşifte henüz başka kullanıcı görünmüyor.";
  const discoverEmptyDescription = currentPartner
    ? "Şu anda kayıtlı diğer kullanıcı zaten aktif partnerin olduğu için keşif listesinde gösterilmiyor. Bağlantıyı kaldırırsan ya da yeni bir kullanıcı kayıt olursa burada görünür."
    : otherUsersCount > 0
      ? "Kayıtlı kullanıcılar var ama şu an keşfe uygun görünmüyorlar. Bekleyen istek, aktif partnerlik veya görünürlük filtresi nedeniyle burada listelenmiyor olabilirler."
      : "Burada yalnızca `profiles` tablosunda kaydı olan diğer kullanıcılar listelenir. Başka bir hesapla kayıt olunup giriş yapıldığında burada görünürler.";

  const handleDisconnect = async () => {
    if (!currentPartnership || disconnecting) return;

    setDisconnecting(true);
    setDisconnectFeedback(null);

    try {
      await disconnectPartnership();
      setDisconnectTone("success");
      setDisconnectFeedback("Partner bağlantısı kaldırıldı. İstersen daha sonra yeniden istek gönderebilirsin.");
    } catch (error) {
      setDisconnectTone("error");
      setDisconnectFeedback(getDisconnectErrorMessage(error));
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <PanelShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Partner alanı
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
              Partner
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Partner bağlantını, kullanıcı keşfini ve istek kutusunu tek sayfada yönet.
            </p>
          </div>

          <DemoUserSwitcher compact />
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const isActive = currentTab === tab.id;

            return (
              <Link
                key={tab.id}
                href={`/partner?tab=${tab.id}`}
                className={
                  isActive
                    ? "rounded-full border border-white/14 bg-white/[0.06] px-4 py-2 text-sm font-medium text-slate-50"
                    : "rounded-full border border-white/8 bg-transparent px-4 py-2 text-sm font-medium text-slate-400 transition hover:text-slate-100"
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {currentTab === "partner" ? (
          <div className="space-y-6">
            <section className="panel-surface rounded-[28px] p-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Aktif bağlantı
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">
                {currentPartner
                  ? `${currentPartner.displayName} ile bağlantı aktif`
                  : "Henüz partner bağlantısı yok"}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {currentPartner
                  ? `${activeSharedHabits.length} ortak alışkanlık akışı açık. Paylaşılabilir alışkanlıklardan yeni ortak hedef başlatabilirsin.`
                  : "Partner kabul edilmeden özel veriler görünmez. Önce keşif alanından bir kullanıcıya istek gönder."}
              </p>

              {currentPartner ? (
                <div className="mt-5">
                  <button
                    type="button"
                    disabled={disconnecting}
                    onClick={() => {
                      void handleDisconnect();
                    }}
                    className="panel-button-secondary rounded-2xl px-4 py-3 text-sm font-semibold"
                  >
                    {disconnecting ? "Bağlantı kaldırılıyor..." : "Bağlantıyı iptal et"}
                  </button>

                  {disconnectFeedback ? (
                    <p
                      className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
                        disconnectTone === "success"
                          ? "border border-emerald-400/10 bg-emerald-400/5 text-emerald-200"
                          : "border border-rose-400/10 bg-rose-400/5 text-rose-200"
                      }`}
                    >
                      {disconnectFeedback}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>

            {currentPartner ? (
              <section className="space-y-4">
                <p className="text-sm font-semibold text-slate-200">
                  {currentPartner.displayName} paylaşılabilir alışkanlıkları
                </p>
                <div className="grid gap-6 lg:grid-cols-2">
                  {partnerHabits.map((habit) => {
                    const alreadyProposed = state.sharedHabits.some(
                      (sharedHabit) =>
                        sharedHabit.sourceHabitId === habit.id &&
                        sharedHabit.status !== "archived"
                    );

                    return (
                      <PartnerHabitCard
                        key={habit.id}
                        habit={habit}
                        proposalStateLabel={
                          alreadyProposed ? "Davette veya aktif" : "Ortak akışa uygun"
                        }
                        canPropose={!alreadyProposed}
                        onPropose={() => proposeSharedHabit(habit.id, currentPartner.id)}
                      />
                    );
                  })}
                </div>

                {partnerHabits.length === 0 ? (
                  <div className="panel-surface rounded-[28px] p-6 text-sm text-slate-400">
                    Partnerin henüz paylaşılabilir alışkanlık açmamış.
                  </div>
                ) : null}
              </section>
            ) : (
              <div className="panel-surface rounded-[28px] p-6 text-sm text-slate-400">
                Henüz aktif partner bağlantısı yok. Keşif sekmesinden bir kullanıcı seçerek başla.
              </div>
            )}
          </div>
        ) : null}

        {currentTab === "discover" ? (
          sortedDiscoverableUsers.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {sortedDiscoverableUsers.map((user) => {
                const pendingRequest = getPendingPartnerRequestBetweenUsers(
                  state,
                  state.currentUserId,
                  user.id
                );
                const isCurrentPartner = currentPartner?.id === user.id;
                const hasAnotherActivePartner =
                  Boolean(currentPartner) && !isCurrentPartner;
                const activeHabitCount = user.activeSeriesCount ?? 0;
                const shareableCount = user.shareableHabitCount ?? 0;
                const statusLabel = isCurrentPartner
                  ? "Zaten partnerin"
                  : pendingRequest
                    ? "İstek beklemede"
                    : hasAnotherActivePartner
                      ? "Aktif partnerin var"
                      : `${activeHabitCount} aktif seri kaydı`;
                const canSend = !isCurrentPartner && !hasAnotherActivePartner && !pendingRequest;

                return (
                  <UserDiscoveryCard
                    key={user.id}
                    user={user}
                    activeSeriesCount={activeHabitCount}
                    shareableHabitCount={shareableCount}
                    statusLabel={statusLabel}
                    canSend={canSend}
                    onSendRequest={() => sendPartnerRequest(user.id)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="panel-surface rounded-[28px] p-6">
              <p className="text-sm font-semibold text-slate-100">
                {discoverEmptyTitle}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {discoverEmptyDescription}
              </p>
            </div>
          )
        ) : null}

        {currentTab === "incoming" ? (
          <div className="space-y-4">
            {incomingPartnerRequests.length > 0 ? (
              incomingPartnerRequests.map((request) => (
                <PartnerRequestCard
                  key={request.id}
                  request={request}
                  fromUser={getUserById(state, request.fromUserId)}
                  toUser={getUserById(state, request.toUserId)}
                  direction="incoming"
                  onAccept={() => acceptPartnerRequest(request.id)}
                  onDecline={() => declinePartnerRequest(request.id)}
                />
              ))
            ) : (
              <div className="panel-surface rounded-[28px] p-6 text-sm text-slate-400">
                Bekleyen gelen istek yok.
              </div>
            )}
          </div>
        ) : null}

        {currentTab === "outgoing" ? (
          <div className="space-y-4">
            {outgoingPartnerRequests.length > 0 ? (
              outgoingPartnerRequests.map((request) => (
                <PartnerRequestCard
                  key={request.id}
                  request={request}
                  fromUser={getUserById(state, request.fromUserId)}
                  toUser={getUserById(state, request.toUserId)}
                  direction="outgoing"
                  onCancel={() => cancelPartnerRequest(request.id)}
                />
              ))
            ) : (
              <div className="panel-surface rounded-[28px] p-6 text-sm text-slate-400">
                Gönderilmiş aktif istek yok.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </PanelShell>
  );
}

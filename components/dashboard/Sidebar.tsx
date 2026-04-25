"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type SidebarItem = {
  label: string;
  detail: string;
  href: string;
  badge?: {
    label: string;
    tone: "active" | "info" | "warning" | "muted";
  };
};

export type SidebarGroup = {
  title: string;
  items: SidebarItem[];
};

type SidebarProps = {
  title: string;
  subtitle: string;
  groups: SidebarGroup[];
  summaryTitle: string;
  summaryValue: string;
  summaryDescription: string;
};

function isItemActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname.startsWith(href);
}

export default function Sidebar({
  title,
  subtitle,
  groups,
  summaryTitle,
  summaryValue,
  summaryDescription,
}: SidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const activeItem =
    groups
      .flatMap((group) => group.items)
      .find((item) => isItemActive(pathname, item.href)) ?? groups[0]?.items[0];

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 px-4 py-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_18px_45px_rgba(2,6,23,0.28)]">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.26em] text-slate-500">
              Discipline OS
            </p>
            <p className="mt-1 truncate text-sm font-medium text-slate-100">
              {activeItem?.label ?? title}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((currentValue) => !currentValue)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Menüyü aç veya kapat"
            className="panel-chip rounded-xl px-4 py-2 text-sm font-medium text-slate-100"
          >
            Menü
          </button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[340px] flex-col border-r border-white/10 bg-slate-950/92 px-5 py-6 backdrop-blur-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:w-80 lg:max-w-none lg:translate-x-0 lg:bg-slate-950/55 lg:px-6 lg:py-8 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-[105%]"
        }`}
      >
        <div className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">
            Discipline OS
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-50">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p>
        </div>

        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-2 text-[10px] uppercase tracking-[0.24em] text-slate-500">
                {group.title}
              </p>
              <nav className="space-y-2" aria-label={group.title}>
                {group.items.map((item) => {
                  const isActive = isItemActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`group sidebar-nav-item flex w-full items-center justify-between rounded-[24px] border px-4 py-3.5 text-left transition ${
                        isActive
                          ? "sidebar-nav-active border-white/10 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                          : "sidebar-nav-idle border-transparent bg-transparent hover:border-white/8 hover:bg-white/4"
                      }`}
                    >
                      <div className="min-w-0">
                        <p
                          className={`text-base font-semibold tracking-tight ${
                            isActive ? "text-slate-50" : "text-slate-300"
                          }`}
                        >
                          {item.label}
                        </p>
                        <p
                          className={`mt-1 text-xs ${
                            isActive ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {item.detail}
                        </p>
                      </div>

                      {item.badge ? (
                        <span
                          className={`ml-4 shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                            item.badge.tone === "active"
                              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                              : item.badge.tone === "info"
                                ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                                : item.badge.tone === "warning"
                                  ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
                                  : "border-white/8 bg-white/4 text-slate-400"
                          }`}
                        >
                          {item.badge.label}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="panel-surface mt-auto rounded-[30px] p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
            {summaryTitle}
          </p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-50">
            {summaryValue}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{summaryDescription}</p>
        </div>
      </aside>
    </>
  );
}

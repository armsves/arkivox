"use client";

import type { ReactNode } from "react";
import { IconAddBox, IconDashboard, IconInfo, IconLock, IconShare, IconWallet } from "./icons";

export type AppTab = "about" | "ledger" | "record" | "encrypt" | "auditor";

export function AppHeader({
  title,
  chainBadge,
  subtitle,
  walletAction,
}: {
  title: string;
  chainBadge?: string;
  subtitle?: string;
  walletAction?: ReactNode;
}) {
  return (
    <header className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between gap-3 border-b border-outline-variant bg-surface px-4 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 text-primary-container">
          <IconWallet />
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-headline-md text-on-surface">{title}</h1>
          {subtitle && (
            <p className="font-label-sm text-on-surface-variant normal-case tracking-normal">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {chainBadge && (
          <span className="hidden border border-primary-container bg-surface-container-highest px-2 py-1 font-label-sm text-primary-container sm:inline">
            {chainBadge}
          </span>
        )}
        {walletAction}
      </div>
    </header>
  );
}

export function BottomNav({
  tab,
  onTab,
}: {
  tab: AppTab;
  onTab: (t: AppTab) => void;
}) {
  const items: { id: AppTab; label: string }[] = [
    { id: "about", label: "About" },
    { id: "ledger", label: "Ledger" },
    { id: "record", label: "Record" },
    { id: "encrypt", label: "Encrypt" },
    { id: "auditor", label: "Shared" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-outline-variant bg-surface-container pb-safe">
      {items.map(({ id, label }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTab(id)}
            className={`flex flex-col items-center justify-center transition-all active-scale ${
              active
                ? "font-bold text-primary-container"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <NavIcon id={id} active={active} />
            <span className="font-label-sm mt-1 max-w-[4.5rem] text-center normal-case leading-tight">
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function NavIcon({ id, active }: { id: AppTab; active: boolean }) {
  const cn = "w-6 h-6";
  if (id === "about") return <IconInfo className={cn} filled={active} />;
  if (id === "ledger") return <IconDashboard className={cn} filled={active} />;
  if (id === "record") return <IconAddBox className={cn} filled={active} />;
  if (id === "encrypt") return <IconLock className={cn} />;
  return <IconShare className={cn} filled={active} />;
}

export function AppShell({
  header,
  children,
  footer,
}: {
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background text-on-surface">
      {header}
      <main className={`mx-auto w-full max-w-3xl flex-grow px-4 pt-20 md:max-w-4xl md:px-8 ${footer ? "pb-28" : "pb-12"}`}>
        {children}
      </main>
      {footer}
      <div
        className="pointer-events-none fixed inset-0 z-[100] opacity-[0.02] mix-blend-overlay"
        aria-hidden
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
        }}
      />
    </div>
  );
}

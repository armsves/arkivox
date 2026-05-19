/** Inline SVG icons (Material Symbols–style) — no external font dependency */

export function IconWallet({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21 7H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Zm-1 10h-3a2 2 0 1 1 0-4h3v4ZM5 11h14v2H5v-2Z" />
    </svg>
  );
}

export function IconLock({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18 8h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2Zm-7 8.41V17h2v-.59a2 2 0 1 0-2 0ZM9 8V6a3 3 0 0 1 6 0v2H9Z" />
    </svg>
  );
}

export function IconLockOpen({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 17a2 2 0 0 0 2-2v-2h-4v2a2 2 0 0 0 2 2Zm6-6h-1V6a5 5 0 0 0-9.9-1h2.1a3 3 0 0 1 5.8 1v5h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h12Z" />
    </svg>
  );
}

export function IconDashboard({ className = "w-6 h-6", filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1.5} aria-hidden>
      {filled ? (
        <path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" />
      )}
    </svg>
  );
}

export function IconAddBox({ className = "w-6 h-6", filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1.5} aria-hidden>
      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2Z" />
    </svg>
  );
}

export function IconShare({ className = "w-6 h-6", filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1.5} aria-hidden>
      <path d="M6 14l3 3v-2h9v-2H9V9l-3 3Zm12-8H9v2H6v2h3v2h9V6Z" />
    </svg>
  );
}

export function IconSecurity({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4Zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8Z" />
    </svg>
  );
}

export function IconInfo({ className = "w-6 h-6", filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      aria-hidden
    >
      {filled ? (
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z" />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 11v6m0-3.5V11M12 6.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      )}
    </svg>
  );
}

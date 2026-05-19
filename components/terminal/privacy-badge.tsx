import { IconLock, IconLockOpen } from "./icons";

export function PrivacyBadge({
  state,
}: {
  state: "encrypted" | "decrypted" | "public" | "pending";
}) {
  if (state === "public") {
    return (
      <span className="inline-flex items-center gap-1 border border-outline px-2 py-0.5 font-label-sm text-on-surface-variant">
        Public
      </span>
    );
  }
  if (state === "encrypted") {
    return (
      <span className="inline-flex items-center gap-1 border border-outline px-2 py-0.5 font-label-sm text-on-surface-variant">
        <IconLock />
        Encrypted
      </span>
    );
  }
  if (state === "decrypted") {
    return (
      <span className="inline-flex items-center gap-1 border border-secondary-fixed-dim px-2 py-0.5 font-label-sm text-secondary-fixed-dim">
        <IconLockOpen />
        Decrypted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 border border-outline-variant px-2 py-0.5 font-label-sm text-outline">
      Pending
    </span>
  );
}

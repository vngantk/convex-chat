import usePresence from "@convex-dev/presence/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";

/**
 * Props for the online-avatar stack in the channel header.
 */
export interface PresencePileProps {
  /** Convex channel id, used as the presence "room" id. */
  roomId: Id<"channels">;
  /** Signed-in user; the hook heartbeats as this id. */
  userId: Id<"users">;
}

/**
 * Initials for an avatar fallback (up to two words).
 *
 * @param name Display name from the `users` document.
 * @returns Uppercase initials, e.g. `"Ada Lovelace"` → `"AL"`.
 */
function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Who is online in this channel (presence component + `users` names).
 *
 * `usePresence` heartbeats through `api.presence.heartbeat` and lists
 * members via `api.presence.list`. Avatars update when people join/leave,
 * not on every heartbeat.
 *
 * @param props {@link PresencePileProps}
 */
export function PresencePile({
  roomId,
  userId,
}: PresencePileProps) {
  const presenceState = usePresence(api.presence, roomId, userId);
  const online = (presenceState ?? []).filter((entry) => entry.online);
  const visible = online.slice(0, 5);
  const extra = online.length - visible.length;

  if (presenceState === undefined) {
    return (
      <p className="text-xs text-muted-foreground">Checking who’s here…</p>
    );
  }

  if (online.length === 0) {
    return <p className="text-xs text-muted-foreground">Nobody else here</p>;
  }

  return (
    <div className="flex items-center gap-2">
      <AvatarGroup>
        {visible.map((entry) => (
          <Avatar key={entry.userId} size="sm" title={entry.name ?? entry.userId}>
            <AvatarFallback>{initials(entry.name ?? "?")}</AvatarFallback>
          </Avatar>
        ))}
        {extra > 0 ? <AvatarGroupCount>+{extra}</AvatarGroupCount> : null}
      </AvatarGroup>
      <span className="text-xs text-muted-foreground">
        {online.length} online
      </span>
    </div>
  );
}

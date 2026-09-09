import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

/**
 * Props for the "X is typing…" line under the thread.
 */
export interface TypingIndicatorProps {
  /** Channel whose typing rows to subscribe to. */
  channelId: Id<"channels">;
  /** Current user; excluded from the label. */
  viewerId: Id<"users">;
}

/**
 * Live typing label for other users in this channel.
 *
 * Subscribes to `api.typing.list`. When the scheduled `clearIfStale`
 * mutation deletes a row, this query reruns and the label updates.
 *
 * @param props {@link TypingIndicatorProps}
 */
export function TypingIndicator({
  channelId,
  viewerId,
}: TypingIndicatorProps) {
  const typing = useQuery(api.typing.list, { channelId });
  const others = typing?.filter((entry) => entry.userId !== viewerId) ?? [];

  if (others.length === 0) {
    return <div className="h-6 px-4" />;
  }

  const names = others.map((entry) => entry.name);
  const label =
    names.length === 1
      ? `${names[0]} is typing…`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing…`
        : `${names[0]} and ${names.length - 1} others are typing…`;

  return (
    <p className="h-6 px-4 text-xs text-muted-foreground italic">{label}</p>
  );
}

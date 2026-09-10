import { useMutation, useQuery } from "convex/react";
import { Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Props for the live message thread.
 */
export interface MessageListProps {
  /** Channel whose messages to subscribe to. */
  channelId: Id<"channels">;
  /** Signed-in user; used to align "own" bubbles and show delete. */
  viewerId: Id<"users">;
}

/**
 * Scrollable message history for one channel.
 *
 * `useQuery(api.messages.list)` is a subscription: when anyone sends or
 * deletes a message in this channel, `messages` updates and this re-renders.
 *
 * @param props {@link MessageListProps}
 */
export function MessageList({
  channelId,
  viewerId,
}: MessageListProps) {
  const messages = useQuery(api.messages.list, { channelId });
  const removeOwn = useMutation(api.messages.removeOwn);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = rootRef.current?.querySelector<HTMLElement>(
      "[data-slot='scroll-area-viewport']",
    );
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  if (messages === undefined) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-12 w-1/2 self-end" />
        <Skeleton className="h-12 w-3/5" />
      </div>
    );
  }

  return (
    <ScrollArea ref={rootRef} className="min-h-0 flex-1 overflow-hidden">
      <div className="flex flex-col gap-3 p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No messages yet. Say hello — every client subscribed to this query
            will update instantly.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.authorId === viewerId;
            return (
              <div
                key={message._id}
                className={`group flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="text-xs font-medium opacity-80">
                      {message.authorName}
                    </span>
                    {mine ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="opacity-0 group-hover:opacity-100"
                        aria-label="Delete message"
                        onClick={() => void removeOwn({ messageId: message._id })}
                      >
                        <Trash2 />
                      </Button>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
}

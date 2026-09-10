import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ChannelList } from "@/components/ChannelList";
import { MessageInput } from "@/components/MessageInput";
import { MessageList } from "@/components/MessageList";
import { PresencePile } from "@/components/PresencePile";
import { TypingIndicator } from "@/components/TypingIndicator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Signed-in shell: channel sidebar + live thread.
 *
 * `useQuery` returns `undefined` while the first result is in flight
 * (hence skeletons), then a live value that updates when the backend writes.
 */
export function ChatApp() {
  const { signOut } = useAuthActions();
  const viewer = useQuery(api.users.viewer);
  const channels = useQuery(api.channels.list);
  const ensureGeneral = useMutation(api.channels.ensureGeneral);
  const [channelId, setChannelId] = useState<Id<"channels"> | null>(null);

  useEffect(() => {
    void ensureGeneral();
  }, [ensureGeneral]);

  useEffect(() => {
    if (channelId === null && channels && channels.length > 0) {
      setChannelId(channels[0]._id);
    }
  }, [channelId, channels]);

  const selected = channels?.find((channel) => channel._id === channelId);

  return (
    <div className="flex h-svh overflow-hidden">
      <aside className="flex min-h-0 w-64 shrink-0 flex-col bg-zinc-950 text-zinc-100">
        <div className="border-b border-zinc-800 px-4 py-4">
          <p className="text-sm font-semibold tracking-tight">Convex Chat</p>
          <p className="text-xs text-zinc-400">Realtime rooms</p>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {channels === undefined ? (
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-8 w-full bg-zinc-800" />
              <Skeleton className="h-8 w-3/4 bg-zinc-800" />
            </div>
          ) : (
            <ChannelList
              channels={channels}
              selectedId={channelId}
              onSelect={setChannelId}
            />
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-zinc-800 p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {viewer?.name ?? "You"}
            </p>
            <p className="truncate text-xs text-zinc-400">{viewer?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-zinc-300 hover:bg-zinc-800 hover:text-white"
            onClick={() => void signOut()}
            aria-label="Sign out"
          >
            <LogOut />
          </Button>
        </div>
      </aside>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
        {selected && viewer ? (
          <>
            <header className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <h1 className="text-sm font-semibold">#{selected.name}</h1>
                <p className="text-xs text-muted-foreground">
                  Messages sync live through Convex queries.
                </p>
              </div>
              <PresencePile roomId={selected._id} userId={viewer._id} />
            </header>
            <MessageList
              channelId={selected._id}
              viewerId={viewer._id}
            />
            <TypingIndicator
              channelId={selected._id}
              viewerId={viewer._id}
            />
            <MessageInput key={selected._id} channelId={selected._id} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Loading channel…
          </div>
        )}
      </main>
    </div>
  );
}

import { useMutation } from "convex/react";
import { Send } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Props for the composer at the bottom of a channel.
 */
export interface MessageInputProps {
  /** Channel that new messages and typing events go to. */
  channelId: Id<"channels">;
}

/**
 * Message composer with debounced typing indicators.
 *
 * Typing is not sent on every keystroke: {@link scheduleTyping} waits 300ms,
 * then calls `api.typing.upsert`. Send / blur / unmount call `api.typing.clear`.
 *
 * @param props {@link MessageInputProps}
 */
export function MessageInput({ channelId }: MessageInputProps) {
  const send = useMutation(api.messages.send);
  const upsertTyping = useMutation(api.typing.upsert);
  const clearTyping = useMutation(api.typing.clear);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      window.clearTimeout(timeoutRef.current);
      void clearTyping({ channelId });
    };
  }, [channelId, clearTyping]);

  /**
   * Debounce typing upserts so we do not write to Convex on every key.
   */
  function scheduleTyping() {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      void upsertTyping({ channelId });
    }, 300);
  }

  /**
   * Send the current draft and clear the typing row.
   * The draft stays in the field until the mutation succeeds.
   *
   * @param event Form submit from the composer.
   */
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text || sending) {
      return;
    }
    setError(null);
    setSending(true);
    window.clearTimeout(timeoutRef.current);
    try {
      await Promise.all([
        send({ channelId, body: text }),
        clearTyping({ channelId }),
      ]);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
      className="flex shrink-0 flex-col gap-2 border-t p-3"
    >
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Input
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
            setError(null);
            scheduleTyping();
          }}
          onBlur={() => {
            window.clearTimeout(timeoutRef.current);
            void clearTyping({ channelId });
          }}
          placeholder="Message this channel"
          autoComplete="off"
          disabled={sending}
        />
        <Button type="submit" disabled={!body.trim() || sending}>
          <Send />
          Send
        </Button>
      </div>
    </form>
  );
}

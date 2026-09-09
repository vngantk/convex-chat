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
   *
   * @param event Form submit from the composer.
   */
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text) {
      return;
    }
    setBody("");
    window.clearTimeout(timeoutRef.current);
    await Promise.all([
      send({ channelId, body: text }),
      clearTyping({ channelId }),
    ]);
  }

  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
      className="flex gap-2 border-t p-3"
    >
      <Input
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
          scheduleTyping();
        }}
        onBlur={() => {
          window.clearTimeout(timeoutRef.current);
          void clearTyping({ channelId });
        }}
        placeholder="Message this channel"
        autoComplete="off"
      />
      <Button type="submit" disabled={!body.trim()}>
        <Send />
        Send
      </Button>
    </form>
  );
}

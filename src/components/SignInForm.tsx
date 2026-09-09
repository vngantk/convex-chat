import { useAuthActions } from "@convex-dev/auth/react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Email + password sign-in / sign-up.
 *
 * Convex Auth's Password provider expects a `FormData` with:
 * - `email`, `password`
 * - `flow` — `"signIn"` or `"signUp"`
 * - `name` — display name, required only on sign-up (see `convex/auth.ts`)
 */
export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Submit credentials to the Convex Auth `signIn` action.
   *
   * @param event Native form submit event.
   */
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    try {
      await signIn("password", formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not authenticate.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Convex Chat</CardTitle>
          <CardDescription>
            {flow === "signIn"
              ? "Sign in to join the realtime rooms."
              : "Create an account to start chatting."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            {flow === "signUp" ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Display name</Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="nickname"
                  required
                  placeholder="Ada"
                />
              </div>
            ) : null}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="ada@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  flow === "signIn" ? "current-password" : "new-password"
                }
                required
                minLength={8}
                placeholder="At least 8 characters"
              />
            </div>
            <input name="flow" type="hidden" value={flow} />
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Working…"
                : flow === "signIn"
                  ? "Sign in"
                  : "Create account"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setError(null);
                setFlow(flow === "signIn" ? "signUp" : "signIn");
              }}
            >
              {flow === "signIn"
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

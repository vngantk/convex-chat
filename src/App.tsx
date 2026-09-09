import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { ChatApp } from "@/components/ChatApp";
import { SignInForm } from "@/components/SignInForm";

/**
 * Auth gate for the SPA.
 *
 * `Authenticated` / `Unauthenticated` / `AuthLoading` are Convex React helpers.
 * They read the session from `ConvexAuthProvider` in `main.tsx`.
 * Only one of the three branches renders at a time.
 */
export default function App() {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
          Connecting to Convex…
        </div>
      </AuthLoading>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
      <Authenticated>
        <ChatApp />
      </Authenticated>
    </>
  );
}

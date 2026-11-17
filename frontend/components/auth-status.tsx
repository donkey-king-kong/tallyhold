"use client";

import Link from "next/link";

import {
  AuthClient,
  useAuthenticatedSession,
} from "../lib/authenticated-session";

export function AuthStatus({ authClient }: { authClient?: AuthClient }) {
  const { state, user, message, client, signIn, signOut } =
    useAuthenticatedSession(authClient);

  if (state === "checking")
    return <p aria-live="polite">Checking session...</p>;

  return (
    <div>
      {state === "signed-in" && user ? (
        <>
          <p>Base currency: {user.base_currency}</p>
          <Link href="/accounts">Manage accounts</Link>
          <button type="button" onClick={() => void signOut()}>
            Sign out
          </button>
        </>
      ) : (
        <button type="button" onClick={() => void signIn()} disabled={!client}>
          Continue with Google
        </button>
      )}
      {message && <p role="alert">{message}</p>}
    </div>
  );
}

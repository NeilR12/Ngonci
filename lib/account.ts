// Talks to the Auth.js (NextAuth) REST endpoints directly so we don't depend on
// the "next-auth/react" client module, whose path differs across v5 betas.

async function csrfToken(): Promise<string> {
  const response = await fetch("/api/auth/csrf", { cache: "no-store" });
  const data = await response.json();
  return data.csrfToken as string;
}

export async function login(email: string, password: string): Promise<boolean> {
  const token = await csrfToken();
  await fetch("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken: token, email, password, callbackUrl: "/" }),
    redirect: "manual",
  });
  return (await currentEmail()) !== null;
}

export async function logout(): Promise<void> {
  const token = await csrfToken();
  await fetch("/api/auth/signout", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken: token, callbackUrl: "/" }),
    redirect: "manual",
  });
}

export async function currentEmail(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    const session = await response.json();
    return session?.user?.email ?? null;
  } catch {
    return null;
  }
}

export async function signup(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch("/api/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (response.ok) return { ok: true };
  const data = await response.json().catch(() => ({}));
  return { ok: false, error: data.error };
}

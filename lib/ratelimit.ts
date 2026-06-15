import { prisma } from "./db";

export interface LimitResult {
  /** True if the request is allowed, false if the limit was exceeded. */
  ok: boolean;
  /** Seconds until the window resets (only meaningful when ok is false). */
  retryAfter: number;
}

/**
 * Best-effort fixed-window rate limiter backed by the database, so it survives
 * across serverless invocations on Vercel. `key` identifies what is being limited
 * (for example "login:<ip>:<email>"). Returns ok:false once `max` attempts happen
 * inside `windowMs`.
 */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<LimitResult> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);

  const existing = await prisma.rateLimit.findUnique({ where: { key } }).catch(() => null);

  // No window yet, or the previous one has expired: start a fresh window.
  if (!existing || existing.expiresAt <= now) {
    await prisma.rateLimit
      .upsert({
        where: { key },
        create: { key, count: 1, expiresAt },
        update: { count: 1, expiresAt },
      })
      .catch(() => {});
    return { ok: true, retryAfter: 0 };
  }

  if (existing.count >= max) {
    return { ok: false, retryAfter: Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000) };
  }

  await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } }).catch(() => {});
  return { ok: true, retryAfter: 0 };
}

/** Clear a key, e.g. after a successful login so honest users aren't penalised. */
export async function clearRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.delete({ where: { key } }).catch(() => {});
}

/** Pull the client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(request?: Request): string {
  if (!request) return "unknown";
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

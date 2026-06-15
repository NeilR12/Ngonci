import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function POST(request: Request) {
  // Cap new-account creation per IP: 5 per hour.
  const limit = await rateLimit(`signup:${clientIp(request)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  }

  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = String(body?.email ?? "").toLowerCase().trim();
  const password = String(body?.password ?? "");

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "invalid-email" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "weak-password" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email, passwordHash } });

  return NextResponse.json({ ok: true });
}

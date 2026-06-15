import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const vault = await prisma.vault.findUnique({ where: { userId } });
  if (!vault) return NextResponse.json({ record: null, rev: 0 });

  return NextResponse.json({ record: vault.record, rev: vault.rev });
}

export async function PUT(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { record?: unknown; rev?: number } | null;
  if (!body?.record) return NextResponse.json({ error: "no-record" }, { status: 400 });

  const existing = await prisma.vault.findUnique({ where: { userId } });
  const baseRev = existing?.rev ?? 0;

  // Optimistic concurrency: the client must send the rev it last saw.
  if (typeof body.rev === "number" && body.rev !== baseRev) {
    return NextResponse.json({ error: "conflict", record: existing?.record ?? null, rev: baseRev }, { status: 409 });
  }

  const nextRev = baseRev + 1;
  const record = body.record as object;
  await prisma.vault.upsert({
    where: { userId },
    create: { userId, record, rev: nextRev },
    update: { record, rev: nextRev },
  });

  return NextResponse.json({ ok: true, rev: nextRev });
}

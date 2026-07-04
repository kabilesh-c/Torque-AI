import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/sessions/[id]/share — create (or return) the public share link
// for this session's report. Only the session owner can generate it.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await prisma.session.findUnique({
    where: { id },
    select: { userId: true, shareToken: true, report: { select: { id: true } } },
  });

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.userId !== user.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!session.report) {
    return NextResponse.json({ error: "No report exists for this session yet" }, { status: 400 });
  }

  let token = session.shareToken;
  if (!token) {
    token = randomUUID().replace(/-/g, "");
    await prisma.session.update({ where: { id }, data: { shareToken: token } });
  }

  return NextResponse.json({ token });
}

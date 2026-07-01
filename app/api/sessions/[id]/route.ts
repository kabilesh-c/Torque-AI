import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/sessions/[id] — full transcript + report
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      transcript: { orderBy: { timestamp: "asc" } },
      report: true,
    },
  });

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.userId !== user.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ session });
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const userPayload = await getCurrentUser();
  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userPayload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      jobRole: true,
      experience: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const userPayload = await getCurrentUser();
  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, jobRole, experience } = body;

  const user = await prisma.user.update({
    where: { id: userPayload.userId },
    data: {
      ...(name && { name }),
      ...(jobRole && { jobRole }),
      ...(experience && { experience }),
    },
    select: { id: true, email: true, name: true, jobRole: true, experience: true },
  });

  return NextResponse.json({ user });
}

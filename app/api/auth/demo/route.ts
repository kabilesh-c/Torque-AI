import { NextResponse } from "next/server";
import { randomBytes, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";

// POST /api/auth/demo — one-click evaluator entry point.
//
// Creates a REAL account behind the scenes (random unguessable email + password,
// never surfaced to the client) and signs the visitor in exactly as signup would.
// Deliberately not a special-cased "guest mode": the account goes through the
// same onboarding step (name, job role, experience) and the same session/report
// flow as anyone who signed up normally, so a recruiter evaluating the product
// sees the real product, not a stubbed-out demo path.
//
// isDemo just flags the row for later identification/cleanup — it grants no
// special behavior anywhere else in the app.
export async function POST() {
  try {
    const email = `demo-${randomUUID()}@torque-ai.demo`;
    const passwordHash = await hashPassword(randomBytes(32).toString("hex"));

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: "Guest",
        isDemo: true,
      },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    await setAuthCookie(token);

    return NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 }
    );
  } catch (error) {
    console.error("[DEMO LOGIN ERROR]", error);
    return NextResponse.json(
      { error: "Could not start the demo. Please try again." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { cookies } from "next/headers";

const COOKIE_NAME = "pi_user";

type Session = {
  uid: string;
};

function getSession(): Session | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64").toString("utf8")
    ) as unknown;

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "uid" in parsed &&
      typeof (parsed as { uid: unknown }).uid === "string"
    ) {
      return { uid: (parsed as { uid: string }).uid };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  const session = getSession();

  // ✅ FIX: check session, không check raw
  if (!session) {
    return NextResponse.json({ avatar: null }, { status: 200 });
  }

  const profile = await kv.get<{ avatar?: string }>(
    `user_profile:${session.uid}`
  );

  return NextResponse.json({
    avatar: profile?.avatar ?? null,
  });
}

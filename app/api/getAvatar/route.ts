import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { cookies } from "next/headers";

const COOKIE_NAME = "pi_user";

type Session = {
  uid: string;
};

export async function GET() {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) {
    return NextResponse.json({ avatar: null }, { status: 401 });
  }

  let session: Session | null = null;
  try {
    session = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {}

  if (!session?.uid) {
    return NextResponse.json({ avatar: null }, { status: 401 });
  }

  const profile = await kv.get<{ avatar?: string }>(
    `user_profile:${session.uid}`
  );

  return NextResponse.json({
    avatar: profile?.avatar ?? null,
  });
}

export const dynamic = "force-dynamic";

import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "pi_user";

/* =========================
   TYPES
========================= */
type Session = {
  uid: string;
  username: string;
};

type UserProfile = {
  uid: string;
  username: string;
  displayName: string;
  avatar: string | null;
  email: string;
  phone: string;
  address: string;
  province?: string;
  country?: string;
  createdAt: number;
  updatedAt?: number;
};

/* =========================
   SESSION HELPER (SAFE)
========================= */
function getSession(): Session | null {
  try {
    const raw = cookies().get(COOKIE_NAME)?.value;
    if (!raw) return null;

    const parsed = JSON.parse(
      Buffer.from(raw, "base64").toString("utf8")
    );

    if (parsed?.uid && parsed?.username) {
      return {
        uid: parsed.uid,
        username: parsed.username,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/* =========================
   GET — PROFILE USER HIỆN TẠI
========================= */
export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const key = `user_profile:${session.uid}`;
  let profile = await kv.get<UserProfile>(key);

  // Nếu chưa có → tạo profile mặc định
  if (!profile) {
    profile = {
      uid: session.uid,
      username: session.username,
      displayName: "",
      avatar: null,
      email: "",
      phone: "",
      address: "",
      province: "",
      country: "",
      createdAt: Date.now(),
    };

    await kv.set(key, profile);
  }

  return NextResponse.json(profile);
}

/* =========================
   POST — UPDATE PROFILE
========================= */
export async function POST(req: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  let body: Partial<UserProfile> = {};
  try {
    body = await req.json();
  } catch {}

  const key = `user_profile:${session.uid}`;
  const existing =
    (await kv.get<UserProfile>(key)) ??
    ({
      uid: session.uid,
      username: session.username,
      displayName: "",
      avatar: null,
      email: "",
      phone: "",
      address: "",
      province: "",
      country: "",
      createdAt: Date.now(),
    } as UserProfile);

  const updated: UserProfile = {
    ...existing,
    ...body,
    uid: session.uid,             // 🔐 ÉP ĐÚNG USER
    username: session.username,   // 🔐 KHÔNG CHO GIẢ MẠO
    updatedAt: Date.now(),
  };

  await kv.set(key, updated);

  return NextResponse.json({
    success: true,
    profile: updated,
  });
}

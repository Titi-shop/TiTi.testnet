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
};

type UserProfile = {
  uid: string;
  username: string;
  displayName: string;
  avatar: string | null;
  email: string;
  phone: string;
  address: string;
  createdAt: number;
  updatedAt?: number;
};

/* =========================
   SESSION HELPER
========================= */
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

/* =========================
   GET — PROFILE CỦA USER HIỆN TẠI
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
      username: "",
      displayName: "",
      avatar: null,
      email: "",
      phone: "",
      address: "",
      createdAt: Date.now(),
    };
    await kv.set(key, profile);
  }

  return NextResponse.json(profile);
}

/* =========================
   POST — UPDATE PROFILE USER HIỆN TẠI
========================= */
export async function POST(req: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as unknown;

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { success: false, error: "invalid_payload" },
        { status: 400 }
      );
    }

    const key = `user_profile:${session.uid}`;
    const existing =
      (await kv.get<UserProfile>(key)) ??
      ({
        uid: session.uid,
        username: "",
        displayName: "",
        avatar: null,
        email: "",
        phone: "",
        address: "",
        createdAt: Date.now(),
      } as UserProfile);

    const updated: UserProfile = {
      ...existing,
      ...body,
      uid: session.uid, // 🔐 ÉP ĐÚNG USER
      updatedAt: Date.now(),
    };

    await kv.set(key, updated);

    return NextResponse.json({ success: true, profile: updated });
  } catch (err: unknown) {
    console.error("❌ Lỗi POST profile:", err);
    return NextResponse.json(
      { success: false, error: "server_error" },
      { status: 500 }
    );
  }
}

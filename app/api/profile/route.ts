export const dynamic = "force-dynamic";
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

/**
 * 🟣 API: /api/profile
 * - Lưu & tải hồ sơ người dùng (username, avatar, email, v.v.)
 * - Dữ liệu được lưu trong Vercel KV
 * - GET: ?username=
 * - POST: body JSON
 */

type UserProfile = Record<string, unknown>;

function normalize(str: string) {
  return str.trim().toLowerCase();
}

// 🟢 Lấy hồ sơ
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Thiếu username" }, { status: 400 });
    }

    const key = `user_profile:${normalize(username)}`;
    const data = await kv.get<UserProfile>(key);

    if (!data) {
      // Nếu chưa có dữ liệu, tạo hồ sơ mặc định
      const newProfile: UserProfile = {
        username: normalize(username),
        displayName: username,
        avatar: null,
        email: "",
        phone: "",
        address: "",
        createdAt: Date.now(),
      };

      await kv.set(key, newProfile);
      return NextResponse.json(newProfile);
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("❌ Lỗi GET profile:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// 🟢 Cập nhật hồ sơ
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as UserProfile;
    const username = body.username as string | undefined;

    if (!username) {
      return NextResponse.json({ error: "Thiếu username" }, { status: 400 });
    }

    const key = `user_profile:${normalize(username)}`;
    const existing = (await kv.get<UserProfile>(key)) || {};

    const updatedProfile: UserProfile = {
      ...existing,
      ...body,
      username: normalize(username),
      updatedAt: Date.now(),
    };

    await kv.set(key, updatedProfile);

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err: unknown) {
    console.error("❌ Lỗi POST profile:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

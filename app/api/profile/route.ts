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

function normalize(str: string) {
  return str?.trim().toLowerCase();
}

// 🟢 Lấy hồ sơ
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username)
      return NextResponse.json({ error: "Thiếu username" }, { status: 400 });

    const key = `user_profile:${normalize(username)}`;
    const data = await kv.get<Record<string, any>>(key);

    if (!data) {
      // Nếu chưa có dữ liệu, tạo hồ sơ mặc định
      const newProfile = {
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
  } catch (err: any) {
    console.error("❌ Lỗi GET profile:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// 🟢 Cập nhật hồ sơ
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = body?.username;

    if (!username)
      return NextResponse.json({ error: "Thiếu username" }, { status: 400 });

    const key = `user_profile:${normalize(username)}`;
    const existing = (await kv.get<Record<string, any>>(key)) || {};

    const updatedProfile = {
      ...existing,
      ...body,
      username: normalize(username),
      updatedAt: Date.now(),
    };

    await kv.set(key, updatedProfile);

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    console.error("❌ Lỗi POST profile:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

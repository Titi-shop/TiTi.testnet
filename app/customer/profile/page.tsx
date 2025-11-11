import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * ✅ API /api/profile
 * - GET: Lấy hồ sơ người dùng theo username
 * - POST: Cập nhật / lưu hồ sơ người dùng
 * - Dữ liệu lưu trong Vercel KV (định dạng JSON string)
 */

// 🟢 Lấy hồ sơ người dùng
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Thiếu username" },
        { status: 400 }
      );
    }

    const key = `profile:${username}`;
    const stored = await kv.get(key);

    if (!stored) {
      return NextResponse.json({
        success: true,
        message: "Chưa có hồ sơ, có thể là lần đầu đăng nhập.",
        profile: { username },
      });
    }

    // Parse an toàn
    let profile: any;
    if (typeof stored === "string") {
      profile = JSON.parse(stored);
    } else if (typeof stored === "object") {
      profile = stored;
    } else {
      profile = {};
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error("❌ Lỗi khi lấy hồ sơ:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Không thể lấy hồ sơ" },
      { status: 500 }
    );
  }
}

// 🟢 Lưu hoặc cập nhật hồ sơ
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = body?.username;

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Thiếu username" },
        { status: 400 }
      );
    }

    const key = `profile:${username}`;
    const existing = await kv.get(key);

    let profile: any = {};
    if (existing) {
      if (typeof existing === "string") profile = JSON.parse(existing);
      else if (typeof existing === "object") profile = existing;
    }

    // Gộp dữ liệu mới
    const updatedProfile = {
      ...profile,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(key, JSON.stringify(updatedProfile));

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    console.error("❌ Lỗi khi lưu hồ sơ:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Không thể lưu hồ sơ" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

function normalize(str: string) {
  return str?.trim().toLowerCase();
}

// 🟢 GET: Lấy hồ sơ người dùng
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username)
      return NextResponse.json({ error: "Thiếu username" }, { status: 400 });

    const key = `user_profile:${normalize(username)}`;
    const data = await kv.get<Record<string, any>>(key);

    // Nếu chưa có dữ liệu thì tạo mới
    if (!data) {
      const newProfile = {
        username: normalize(username),  // Định danh Pi
        appName: "",                    // Biệt danh trong app (người dùng sửa được)
        avatar: null,
        email: "",
        phone: "",
        address: "",
        province: "",
        country: "VN",
        createdAt: Date.now(),
      };
      await kv.set(key, newProfile);
      return NextResponse.json(newProfile);
    }

    return NextResponse.json(data);

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

// 🟢 POST: Cập nhật hồ sơ người dùng (chỉ cho sửa appName và thông tin phụ)
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
      username: normalize(username), // KHÔNG CHO SỬA
      appName: body.appName || existing.appName || "", // CHỈ CHO SỬA appName
      email: body.email || existing.email || "",
      phone: body.phone || existing.phone || "",
      address: body.address || existing.address || "",
      province: body.province || existing.province || "",
      country: body.country || existing.country || "VN",
      avatar: body.avatar || existing.avatar || null,
      updatedAt: Date.now(),
    };

    await kv.set(key, updatedProfile);

    return NextResponse.json({ success: true, profile: updatedProfile });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

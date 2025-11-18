export const dynamic = "force-dynamic";
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

function normalize(str: string) {
  return str?.trim().toLowerCase();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username)
      return NextResponse.json({ error: "Thiếu username" }, { status: 400 });

    const key = `user_profile:${normalize(username)}`;
    const data = await kv.get<Record<string, any>>(key);

    if (!data) {
      const newProfile = {
        username: normalize(username),
        displayName: username.trim(),  // Giữ nguyên tên PI thật
        appName: "",                   // Biệt danh rỗng
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
      appName: body.appName,   // CHỈ CHO PHÉP SỬA appName
      email: body.email || "",
      phone: body.phone || "",
      address: body.address || "",
      province: body.province || "",
      country: body.country || "VN",
      avatar: body.avatar || existing.avatar,
      username: normalize(username),
      displayName: existing.displayName,   // KHÓA LẠI TÊN PI
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

import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

// 🔹 Lấy hồ sơ phụ
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pi_uid = searchParams.get("pi_uid");
  if (!pi_uid)
    return NextResponse.json({ error: "Thiếu pi_uid" }, { status: 400 });

  const profile = await kv.get(`profile:${pi_uid}`);
  return NextResponse.json(profile || {});
}

// 🔹 Lưu / cập nhật hồ sơ phụ
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pi_uid, displayName, email, phone, address } = body;
    if (!pi_uid)
      return NextResponse.json({ error: "Thiếu pi_uid" }, { status: 400 });

    const profile = {
      pi_uid,
      displayName,
      email,
      phone,
      address,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`profile:${pi_uid}`, profile);
    return NextResponse.json({ success: true, profile });
  } catch (err) {
    console.error("❌ Lỗi lưu hồ sơ:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

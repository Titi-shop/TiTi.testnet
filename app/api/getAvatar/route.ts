import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username")?.trim().toLowerCase();

  if (!username) {
    return NextResponse.json({ error: "Thiếu username" }, { status: 400 });
  }

  const avatarUrl = await kv.get<string>(`avatar:${username}`);

  // Nếu chưa có ảnh -> trả về ảnh mặc định
  if (!avatarUrl) {
    return NextResponse.redirect("https://your-default-avatar-url.png");
  }

  // Trả về redirect đến ảnh thực tế
  return NextResponse.redirect(avatarUrl);
}

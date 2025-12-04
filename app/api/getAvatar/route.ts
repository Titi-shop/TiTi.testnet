import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username")?.trim().toLowerCase();

  if (!username) {
    return NextResponse.json({ error: "Thiếu username" }, { status: 400 });
  }

  // Lấy profile từ KV
  const profile = await kv.get<Record<string, any>>(`user_profile:${username}`);

  const avatar = profile?.avatar || null;

  return NextResponse.json({
    avatar: avatar ?? null,
  });
}

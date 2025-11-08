import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username)
    return NextResponse.json({ error: "missing username" }, { status: 400 });

  const url = await kv.get(`avatar:${username.toLowerCase()}`);

  return NextResponse.json({ success: true, url: url || null });
}

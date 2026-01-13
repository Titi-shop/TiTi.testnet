import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { uid } = await req.json();

  if (!uid || typeof uid !== "string") {
    return NextResponse.json({ error: "missing_uid" }, { status: 400 });
  }

  await kv.set(`user_role:${uid}`, "seller");

  return NextResponse.json({
    success: true,
    uid,
    role: "seller",
  });
}

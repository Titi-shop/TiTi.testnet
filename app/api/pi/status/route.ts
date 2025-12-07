import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id)
    return NextResponse.json({ error: "missing id" }, { status: 400 });

  const payment = await kv.get(`pi:payment:${id}`);

  return NextResponse.json({ success: true, payment });
}

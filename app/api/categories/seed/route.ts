import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function GET() {
  const sample = [
    {
      id: 1,
      name: "Sport",
      icon: "https://placekitten.com/200/200"
    },
    {
      id: 2,
      name: "Automotive",
      icon: "https://placekitten.com/250/250"
    }
  ];

  await kv.set("categories", sample);

  return NextResponse.json({ ok: true, sample });
}

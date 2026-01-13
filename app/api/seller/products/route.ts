import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { cookies } from "next/headers";

const COOKIE_NAME = "pi_user";

function getSession() {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
}

export async function GET() {
  const session = getSession();
  if (!session?.uid) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ids = await kv.lrange<string>(
    `products:seller:${session.uid}`,
    0,
    -1
  );

  if (!ids.length) return NextResponse.json([]);

  const products = await Promise.all(
    ids.map(id => kv.get(`product:${id}`))
  );

  return NextResponse.json(products.filter(Boolean));
}

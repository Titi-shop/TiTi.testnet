import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const COOKIE_NAME = "pi_user";

function getCurrentUser(req: Request) {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const raw = cookieHeader
    .split(";")
    .map(c => c.trim())
    .find(c => c.startsWith(`${COOKIE_NAME}=`))
    ?.replace(`${COOKIE_NAME}=`, "");

  if (!raw) return null;

  try {
    return JSON.parse(
      Buffer.from(raw, "base64").toString("utf8")
    );
  } catch {
    return null;
  }
}

/* ===================== GET ===================== */
export async function GET(req: Request) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ids = await kv.lrange<string>(`orders:user:${user.uid}`, 0, -1);
  if (!ids || ids.length === 0) return NextResponse.json([]);

  const orders = await Promise.all(ids.map(id => kv.get(`order:${id}`)));
  return NextResponse.json(orders.filter(Boolean));
}

/* ===================== POST ===================== */
export async function POST(req: Request) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "invalid_items" }, { status: 400 });
  }

  const id = `ORD-${Date.now()}`;

  const order = {
    id,
    buyerId: user.uid,
    buyerUsername: user.username,
    items: body.items,
    total: Number(body.total || 0),
    status: "Chờ xác nhận",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await kv.set(`order:${id}`, order);
  await kv.lpush(`orders:user:${user.uid}`, id);

  return NextResponse.json({ success: true, order });
}

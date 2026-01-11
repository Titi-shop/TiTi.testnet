import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const COOKIE_NAME = "pi_user";

/* =========================
   TYPES
========================= */
type Session = {
  uid: string;
};

type OrderItem = {
  productId: string;
  quantity: number;
  price?: number;
};

type Order = {
  id: string;
  buyerId: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

/* =========================
   SESSION HELPER
========================= */
function getSession(req: Request): Session | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const raw = cookieHeader
    .split(";")
    .map(c => c.trim())
    .find(c => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64").toString("utf8")
    ) as unknown;

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "uid" in parsed &&
      typeof (parsed as { uid: unknown }).uid === "string"
    ) {
      return { uid: (parsed as { uid: string }).uid };
    }
    return null;
  } catch {
    return null;
  }
}

/* ===================== GET ===================== */
export async function GET(req: Request) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ids = await kv.lrange<string>(`orders:user:${session.uid}`, 0, -1);
  if (!ids || ids.length === 0) {
    return NextResponse.json([]);
  }

  const orders = await Promise.all(
    ids.map(id => kv.get<Order>(`order:${id}`))
  );

  // 🔐 Ép ownership lần cuối
  const safeOrders = orders.filter(
    (o): o is Order => !!o && o.buyerId === session.uid
  );

  return NextResponse.json(safeOrders);
}

/* ===================== POST ===================== */
export async function POST(req: Request) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as unknown;

    if (
      typeof body !== "object" ||
      body === null ||
      !("items" in body) ||
      !Array.isArray((body as { items: unknown }).items)
    ) {
      return NextResponse.json({ error: "invalid_items" }, { status: 400 });
    }

    const items = (body as { items: OrderItem[] }).items;

    if (
      items.length === 0 ||
      items.some(
        i =>
          typeof i.productId !== "string" ||
          typeof i.quantity !== "number" ||
          i.quantity <= 0
      )
    ) {
      return NextResponse.json({ error: "invalid_items" }, { status: 400 });
    }

    const total =
      typeof (body as { total?: unknown }).total === "number"
        ? (body as { total: number }).total
        : 0;

    const id = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const now = new Date().toISOString();

    const order: Order = {
      id,
      buyerId: session.uid,
      items,
      total,
      status: "Chờ xác nhận",
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`order:${id}`, order);
    await kv.lpush(`orders:user:${session.uid}`, id);

    return NextResponse.json({ success: true, order });
  } catch (err: unknown) {
    console.error("❌ Lỗi tạo order:", err);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }
}

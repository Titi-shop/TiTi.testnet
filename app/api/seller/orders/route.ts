import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { cookies } from "next/headers";

const COOKIE_NAME = "pi_user";

type Session = { uid: string };

type OrderItem = {
  productId: string;
  quantity: number;
  sellerId: string;
};

type Order = {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

function getSession(): Session | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64").toString("utf8")
    );
    return parsed?.uid ? { uid: parsed.uid } : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  // ⚠️ Đơn giản: duyệt toàn bộ order (có thể tối ưu sau)
  const allIds = await kv.lrange<string>("orders:all", 0, -1);
  if (!allIds.length) return NextResponse.json([]);

  const orders = await Promise.all(
    allIds.map(id => kv.get<Order>(`order:${id}`))
  );

  const sellerOrders = orders.filter(
    (o): o is Order =>
      !!o &&
      o.items.some(i => i.sellerId === session.uid) &&
      (!status || o.status === status)
  );

  return NextResponse.json(sellerOrders);
}

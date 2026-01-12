export const dynamic = "force-dynamic"; // ⭐ RẤT QUAN TRỌNG

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { cookies } from "next/headers";

const COOKIE_NAME = "pi_user";

/* =========================
   TYPES
========================= */
type Session = {
  uid: string;
  username: string;
};

type OrderItem = {
  productId: string;
  quantity: number;
  seller: string;
  price?: number;
};

type Order = {
  id: string;
  items: OrderItem[];
  status: string;
  createdAt: string;
};

type SellerOrder = {
  orderId: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
};

/* =========================
   SESSION HELPER
========================= */
function getSession(): Session | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64").toString("utf8")
    ) as unknown;

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "uid" in parsed &&
      "username" in parsed &&
      typeof (parsed as any).uid === "string" &&
      typeof (parsed as any).username === "string"
    ) {
      return {
        uid: (parsed as any).uid,
        username: (parsed as any).username.toLowerCase().trim(), // ⭐ normalize
      };
    }

    return null;
  } catch {
    return null;
  }
}

/* =========================
   GET — SELLER ORDERS
========================= */
export async function GET(req: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");

  // ⚠️ tạm thời duyệt toàn bộ buyer orders
  const buyerOrderKeys = await kv.keys("orders:user:*");

  const sellerOrders: SellerOrder[] = [];

  for (const key of buyerOrderKeys) {
    const ids = await kv.lrange<string>(key, 0, -1);

    for (const id of ids) {
      const order = await kv.get<Order>(`order:${id}`);
      if (!order) continue;
      if (statusFilter && order.status !== statusFilter) continue;

      const sellerItems = order.items.filter(
        (item) => item.seller?.toLowerCase().trim() === session.username
      );

      if (sellerItems.length === 0) continue;

      const total = sellerItems.reduce(
        (sum, item) => sum + (item.price ?? 0) * item.quantity,
        0
      );

      sellerOrders.push({
        orderId: order.id,
        items: sellerItems,
        total,
        status: order.status,
        createdAt: order.createdAt,
      });
    }
  }

  return NextResponse.json(sellerOrders);
}

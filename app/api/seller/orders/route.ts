import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { cookies } from "next/headers";

const COOKIE_NAME = "pi_user";

type Session = {
  uid: string;
  username: string;
};

type OrderItem = {
  productId: string;
  quantity: number;
  seller: string; // seller username
};

type SellerOrder = {
  orderId: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
};

function getSession(): Session | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64").toString("utf8")
    );
    if (parsed?.uid && parsed?.username) {
      return { uid: parsed.uid, username: parsed.username };
    }
    return null;
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

  // ⚠️ TẠM: duyệt toàn bộ order của buyer (chưa tối ưu)
  const allUserKeys = await kv.keys("orders:user:*");

  const orders = await Promise.all(
    allUserKeys.flatMap(async (key) => {
      const ids = await kv.lrange<string>(key, 0, -1);
      return Promise.all(ids.map(id => kv.get<any>(`order:${id}`)));
    })
  );

  const sellerOrders: SellerOrder[] = [];

  for (const order of orders.flat()) {
    if (!order) continue;
    if (status && order.status !== status) continue;

    const items = order.items.filter(
      (i: any) => i.seller === session.username
    );

    if (items.length === 0) continue;

    sellerOrders.push({
      orderId: order.id,
      items,
      total: items.reduce(
        (sum: number, i: any) => sum + (i.price ?? 0) * i.quantity,
        0
      ),
      status: order.status,
      createdAt: order.createdAt,
    });
  }

  return NextResponse.json(sellerOrders);
}

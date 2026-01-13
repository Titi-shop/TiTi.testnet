export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { cookies, headers } from "next/headers";

const COOKIE_NAME = "pi_user";

/* =========================
   TYPES
========================= */
type Session = {
  uid: string;
  username: string;
};

type PiUser = {
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
   SESSION HELPERS
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
      typeof (parsed as { uid: unknown }).uid === "string" &&
      typeof (parsed as { username: unknown }).username === "string"
    ) {
      return {
        uid: (parsed as { uid: string }).uid,
        username: (parsed as { username: string }).username
          .toLowerCase()
          .trim(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function getPiUserFromToken(): Promise<PiUser | null> {
  const auth = headers().get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;

  const token = auth.slice("Bearer ".length).trim();
  if (!token) return null;

  const piRes = await fetch("https://api.minepi.com/v2/me", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!piRes.ok) return null;

  const data = await piRes.json();
  if (
    !data?.uid ||
    typeof data.uid !== "string" ||
    typeof data.username !== "string"
  ) {
    return null;
  }

  return {
    uid: data.uid,
    username: data.username.toLowerCase().trim(),
  };
}

async function isSeller(uid: string): Promise<boolean> {
  const role = await kv.get<string>(`user_role:${uid}`);
  return role === "seller";
}

/* =========================
   GET — SELLER ORDERS
========================= */
export async function GET(req: Request) {
  // 1️⃣ ưu tiên token
  const piUser = await getPiUserFromToken();
  const uidFromToken = piUser?.uid;
  const usernameFromToken = piUser?.username;

  // 2️⃣ fallback cookie
  const session = uidFromToken ? null : getSession();
  const uid = uidFromToken ?? session?.uid;
  const username = usernameFromToken ?? session?.username;

  if (!uid || !username) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!(await isSeller(uid))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");

  const buyerOrderKeys = await kv.keys("orders:user:*");
  const sellerOrders: SellerOrder[] = [];

  for (const key of buyerOrderKeys) {
    const ids = await kv.lrange<string>(key, 0, -1);

    for (const id of ids) {
      const order = await kv.get<Order>(`order:${id}`);
      if (!order) continue;
      if (statusFilter && order.status !== statusFilter) continue;

      const sellerItems = order.items.filter(
        (item) => item.seller?.toLowerCase().trim() === username
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

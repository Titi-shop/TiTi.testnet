import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const COOKIE_NAME = "pi_user";

/* ============================================================
   Types
============================================================ */

interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

type EnvType = "testnet" | "mainnet";

interface Order {
  id: string;
  buyer: string;         // username để hiển thị
  buyerUid: string;      // UID dùng để phân quyền
  items: OrderItem[];
  total: number;
  status: string;
  note: string;
  shipping: Record<string, unknown>;
  paymentId: string;
  txid: string;
  env: EnvType;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

/* ============================================================
   User from cookie
============================================================ */

interface CookieUser {
  username: string;
  uid: string;
  wallet_address?: string | null;
  created_at?: string;
  roles?: string[];
}

function decodeUser(raw: string): CookieUser | null {
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as CookieUser;
  } catch {
    return null;
  }
}

/* ============================================================
   Helpers for KV
============================================================ */

function isOrderArray(value: unknown): value is Order[] {
  return Array.isArray(value);
}

async function readOrders(): Promise<Order[]> {
  const data = await kv.get("orders");

  if (!data) return [];

  if (isOrderArray(data)) return data;

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data) as unknown;
      return isOrderArray(parsed) ? parsed : [];
    } catch {
      console.warn("⚠️ KV orders corrupted, reset to empty list.");
      return [];
    }
  }

  return [];
}

async function writeOrders(orders: Order[]): Promise<void> {
  await kv.set("orders", JSON.stringify(orders));
}

/* ============================================================
   GET /api/orders
   → Trả danh sách đơn HỢP LỆ của user hiện tại
   → Có thể lọc thêm theo ?status=pending, v.v.
============================================================ */

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME)?.value;
    if (!cookie) {
      return NextResponse.json([], { status: 401 });
    }

    const user = decodeUser(cookie);
    if (!user?.uid) {
      return NextResponse.json([], { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status"); // optional

    const orders = await readOrders();

    const filtered = orders.filter((o) => {
      if (o.buyerUid !== user.uid) return false;
      if (statusFilter && o.status !== statusFilter) return false;
      return true;
    });

    return NextResponse.json(filtered);
  } catch (err) {
    console.error("❌ GET /api/orders error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

/* ============================================================
   POST /api/orders
   → Tạo đơn mới GẮN CHẶT với user hiện tại
   → Không cho client tự set buyer / buyerUid
============================================================ */

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME)?.value;
    if (!cookie) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const user = decodeUser(cookie);
    if (!user?.uid) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as {
      items?: OrderItem[];
      total?: number;
      status?: string;
      note?: string;
      shipping?: Record<string, unknown>;
      paymentId?: string;
      txid?: string;
      createdAt?: string;
      id?: string;
    };

    const env: EnvType =
      process.env.NEXT_PUBLIC_PI_ENV === "testnet" ? "testnet" : "mainnet";

    const now = new Date().toISOString();

    const newOrder: Order = {
      id: body.id ?? `ORD-${Date.now()}`,
      buyer: user.username,
      buyerUid: user.uid,
      items: Array.isArray(body.items) ? body.items : [],
      total: Number(body.total ?? 0),
      status: body.status ?? "Chờ xác nhận",
      note: body.note ?? "",
      shipping: body.shipping ?? {},
      paymentId: body.paymentId ?? "",
      txid: body.txid ?? "",
      env,
      createdAt: body.createdAt ?? now,
      updatedAt: now,
    };

    const orders = await readOrders();
    orders.unshift(newOrder);
    await writeOrders(orders);

    console.log("🧾 [ORDER CREATED]:", {
      id: newOrder.id,
      buyerUid: newOrder.buyerUid,
      total: newOrder.total,
      env: newOrder.env,
    });

    return NextResponse.json({ success: true, order: newOrder });
  } catch (err) {
    console.error("❌ POST /api/orders error:", err);
    return NextResponse.json(
      { success: false, error: "server_error" },
      { status: 500 }
    );
  }
}

/* ============================================================
   PUT /api/orders
   → Chỉ cho phép update đơn thuộc về user hiện tại
   → Chỉ cho sửa status + txid (+ paidAt)
============================================================ */

export async function PUT(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME)?.value;
    if (!cookie) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const user = decodeUser(cookie);
    if (!user?.uid) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as {
      id: string;
      status?: string;
      txid?: string;
    };

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "missing_order_id" },
        { status: 400 }
      );
    }

    const orders = await readOrders();
    const index = orders.findIndex(
      (o) => o.id === body.id && o.buyerUid === user.uid
    );

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "not_found_or_forbidden" },
        { status: 403 }
      );
    }

    const existing = orders[index];

    const updated: Order = {
      ...existing,
      status: body.status ?? existing.status,
      txid: body.txid ?? existing.txid,
      updatedAt: new Date().toISOString(),
    };

    // Nếu chuyển sang trạng thái "Đã thanh toán" thì set paidAt
    if (body.status === "Đã thanh toán" && !existing.paidAt) {
      updated.paidAt = new Date().toISOString();
    }

    orders[index] = updated;
    await writeOrders(orders);

    console.log("🔄 [ORDER UPDATED]:", {
      id: updated.id,
      buyerUid: updated.buyerUid,
      status: updated.status,
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    console.error("❌ PUT /api/orders error:", err);
    return NextResponse.json(
      { success: false, error: "server_error" },
      { status: 500 }
    );
  }
}

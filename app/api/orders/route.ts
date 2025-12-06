import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/* ============================================================
   🟦 Kiểu dữ liệu Order và OrderItem
============================================================ */
interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface Order {
  id: string;
  buyer: string;
  buyerUid: string;
  items: OrderItem[];
  total: number;
  status: string;
  note: string;
  shipping: Record<string, unknown>;
  paymentId: string;
  txid: string;
  env: "testnet" | "mainnet";
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

/* ============================================================
   🟦 Cookie name
============================================================ */
const COOKIE_NAME = "pi_user";

/* ============================================================
   🟦 Giải mã user từ cookie
============================================================ */
function decodeUser(raw: string) {
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch (e) {
    return null;
  }
}

/* ============================================================
   🟦 Đọc danh sách đơn hàng
============================================================ */
async function readOrders(): Promise<Order[]> {
  const data = await kv.get("orders");

  if (!data) return [];
  if (Array.isArray(data)) return data as Order[];

  try {
    return JSON.parse(data as string) as Order[];
  } catch {
    console.warn("⚠ KV orders corrupted → reset to empty.");
    return [];
  }
}

/* ============================================================
   🟦 Ghi danh sách đơn hàng
============================================================ */
async function writeOrders(orders: Order[]): Promise<void> {
  await kv.set("orders", JSON.stringify(orders));
}

/* ============================================================
   🔹 GET — Lấy đơn hàng theo đúng user đang đăng nhập
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

    const orders = await readOrders();
    const filtered = orders.filter((o) => o.buyerUid === user.uid);

    return NextResponse.json(filtered);
  } catch (e) {
    console.error("❌ GET /api/orders error:", e);
    return NextResponse.json([], { status: 500 });
  }
}

/* ============================================================
   🔹 POST — Tạo đơn mới cho user đang đăng nhập
============================================================ */
export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME)?.value;

    if (!cookie) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const user = decodeUser(cookie);

    if (!user?.uid) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const body = await req.json();

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
      env: process.env.NEXT_PUBLIC_PI_ENV === "testnet" ? "testnet" : "mainnet",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const orders = await readOrders();
    orders.unshift(newOrder);

    await writeOrders(orders);

    return NextResponse.json({ success: true, order: newOrder });
  } catch (e) {
    console.error("❌ POST /api/orders error:", e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

/* ============================================================
   🔹 PUT — Chỉ cập nhật đơn nếu user sở hữu đơn đó
============================================================ */
export async function PUT(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME)?.value;

    if (!cookie) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const user = decodeUser(cookie);

    if (!user?.uid) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const { id, status, txid } = await req.json();

    const orders = await readOrders();
    const index = orders.findIndex(
      (o) => o.id === id && o.buyerUid === user.uid
    );

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy đơn hoặc không có quyền." },
        { status: 403 }
      );
    }

    // Cập nhật đơn hàng
    orders[index] = {
      ...orders[index],
      status: status ?? orders[index].status,
      txid: txid ?? orders[index].txid,
      updatedAt: new Date().toISOString(),
    };

    await writeOrders(orders);

    return NextResponse.json({ success: true, order: orders[index] });
  } catch (e) {
    console.error("❌ PUT /api/orders error:", e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

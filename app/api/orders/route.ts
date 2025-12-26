import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * =======================================
 * 🧾 TiTi Shop - API Đơn hàng (Orders)
 * =======================================
 */

// 🔹 Nhận biết môi trường Pi
const isTestnet =
  process.env.NEXT_PUBLIC_PI_ENV === "testnet" ||
  process.env.PI_API_URL?.includes("/sandbox");

// ----------------------------
// 🔸 Helper: Đọc danh sách đơn hàng
// ----------------------------
async function readOrders(): Promise<unknown[]> {
  try {
    const stored = await kv.get("orders");
    if (!stored) return [];
    if (Array.isArray(stored)) return stored as unknown[];

    try {
      return JSON.parse(stored as string) as unknown[];
    } catch {
      console.warn("⚠️ Dữ liệu orders trong KV không hợp lệ, reset lại.");
      return [];
    }
  } catch (err: unknown) {
    console.error("❌ Lỗi đọc orders:", err);
    return [];
  }
}

// ----------------------------
// 🔸 Helper: Ghi danh sách đơn hàng
// ----------------------------
async function writeOrders(orders: unknown[]): Promise<boolean> {
  try {
    await kv.set("orders", JSON.stringify(orders));
    return true;
  } catch (err: unknown) {
    console.error("❌ Lỗi ghi orders:", err);
    return false;
  }
}

// ----------------------------
// 🔹 GET: Lấy danh sách đơn hàng
// ----------------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const buyer = searchParams.get("buyer");
    const orders = await readOrders();

    const filtered = buyer
      ? orders.filter(
          (o) =>
            typeof o === "object" &&
            o !== null &&
            "buyer" in o &&
            (o as { buyer?: unknown }).buyer === buyer
        )
      : orders;

    return NextResponse.json(filtered);
  } catch (err: unknown) {
    console.error("❌ GET /orders:", err);
    return NextResponse.json([], { status: 500 });
  }
}

// ----------------------------
// 🔹 POST: Tạo đơn hàng mới
// ----------------------------
export async function POST(req: Request) {
  try {
    const order: unknown = await req.json();
    const orders = await readOrders();

    const o = (typeof order === "object" && order !== null
      ? order
      : {}) as Record<string, unknown>;

    const newOrder = {
      id: o.id ?? `ORD-${Date.now()}`,
      buyer: o.buyer || "unknown",
      items: o.items ?? [],
      total: Number(o.total ?? 0),
      status: o.status ?? "Chờ xác nhận",
      note: o.note ?? "",
      shipping: o.shipping ?? {},
      paymentId: o.paymentId ?? "",
      txid: o.txid ?? "",
      env: isTestnet ? "testnet" : "mainnet",
      createdAt: o.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.unshift(newOrder);
    await writeOrders(orders);

    console.log("🧾 [ORDER CREATED]:", newOrder);

    return NextResponse.json({ success: true, order: newOrder });
  } catch (err: unknown) {
    console.error("❌ POST /orders:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// ----------------------------
// 🔹 PUT: Cập nhật trạng thái đơn hàng
// ----------------------------
export async function PUT(req: Request) {
  try {
    const body: unknown = await req.json();
    const data =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>)
        : {};

    const { id, status, txid } = data;

    const orders = await readOrders();

    const index = orders.findIndex(
      (o) =>
        typeof o === "object" &&
        o !== null &&
        "id" in o &&
        String((o as { id: unknown }).id) === String(id)
    );

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    const current = orders[index] as Record<string, unknown>;

    const updated = {
      ...current,
      status: status ?? current.status,
      txid: txid ?? current.txid,
      updatedAt: new Date().toISOString(),
    };

    if (status === "Đã thanh toán") {
      updated.paidAt = new Date().toISOString();
    }

    orders[index] = updated;
    await writeOrders(orders);

    console.log("🔄 [ORDER UPDATED]:", updated);

    return NextResponse.json({ success: true, order: updated });
  } catch (err: unknown) {
    console.error("❌ PUT /orders:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

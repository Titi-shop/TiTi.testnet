import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

// ----------------------------
// 🔸 Helper: Đọc danh sách đơn hàng
// ----------------------------
async function readOrders() {
  try {
    const stored = await kv.get("orders");
    if (!stored) return [];
    if (Array.isArray(stored)) return stored;

    try {
      return JSON.parse(stored);
    } catch {
      console.warn("⚠️ Dữ liệu orders trong KV không hợp lệ, reset lại.");
      return [];
    }
  } catch (err) {
    console.error("❌ Lỗi đọc orders:", err);
    return [];
  }
}

// ----------------------------
// 🔸 Helper: Ghi danh sách đơn hàng
// ----------------------------
async function writeOrders(orders: any[]) {
  try {
    await kv.set("orders", JSON.stringify(orders));
    return true;
  } catch (err) {
    console.error("❌ Lỗi ghi orders:", err);
    return false;
  }
}

// ----------------------------
// 🔹 GET: Lấy danh sách đơn hàng
// ----------------------------
export async function GET() {
  try {
    const orders = await readOrders();
    return NextResponse.json(orders);
  } catch (err) {
    console.error("❌ GET /orders:", err);
    return NextResponse.json([], { status: 500 });
  }
}

// ----------------------------
// 🔹 POST: Tạo đơn hàng mới
// ----------------------------
export async function POST(req: Request) {
  try {
    const order = await req.json();
    const orders = await readOrders();

    const newOrder = {
  id: order.id ?? `ORD-${Date.now()}`,
  buyer: order.buyer || "unknown",
  items: order.items ?? [],
  total: Number(order.total ?? 0),
  status: order.status ?? "Chờ xác nhận",
  note: order.note ?? "",
  shipping: order.shipping ?? {},
  paymentId: order.paymentId ?? "",
  txid: order.txid ?? "",
  env: isTestnet ? "testnet" : "mainnet", // ✅ thêm dòng này
  createdAt: order.createdAt ?? new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

    orders.unshift(newOrder);
    await writeOrders(orders);

    console.log("🧾 [ORDER CREATED]:", newOrder);

    return NextResponse.json({ success: true, order: newOrder });
  } catch (err) {
    console.error("❌ POST /orders:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// ----------------------------
// 🔹 PUT: Cập nhật trạng thái đơn hàng
// ----------------------------
export async function PUT(req: Request) {
  try {
    const { id, status, txid } = await req.json();
    const orders = await readOrders();

    const index = orders.findIndex((o) => String(o.id) === String(id));
    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    orders[index] = {
      ...orders[index],
      status: status || orders[index].status,
      txid: txid || orders[index].txid, // ✅ cập nhật txid nếu có
      updatedAt: new Date().toISOString(),
    };

    await writeOrders(orders);

    console.log("🔄 [ORDER UPDATED]:", orders[index]);

    return NextResponse.json({ success: true, order: orders[index] });
  } catch (err) {
    console.error("❌ PUT /orders:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

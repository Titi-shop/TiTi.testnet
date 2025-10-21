import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

// ----------------------------
// 🔹 GET: Lấy danh sách đơn
// ----------------------------
export async function GET() {
  try {
    const data = await kv.get("orders");
    const orders = Array.isArray(data) ? data : JSON.parse(data || "[]");
    return NextResponse.json(orders);
  } catch (err) {
    console.error("❌ GET /orders:", err);
    return NextResponse.json([], { status: 500 });
  }
}

// ----------------------------
// 🔹 POST: Tạo đơn mới
// ----------------------------
export async function POST(req: Request) {
  try {
    const order = await req.json();
    const stored = await kv.get("orders");
    const orders = Array.isArray(stored)
      ? stored
      : JSON.parse(stored || "[]");

    const newOrder = {
      id: order.id ?? Date.now(),
      buyer: order.buyer || "unknown",
      items: order.items ?? [],
      total: order.total ?? 0,
      status: order.status ?? "Chờ xác nhận",
      note: order.note ?? "",
      createdAt: new Date().toISOString(),
    };

    orders.unshift(newOrder);
    await kv.set("orders", JSON.stringify(orders));

    return NextResponse.json({ success: true, order: newOrder });
  } catch (err) {
    console.error("❌ POST /orders:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// ----------------------------
// 🔹 PUT: Cập nhật trạng thái đơn
// ----------------------------
export async function PUT(req: Request) {
  try {
    const { id, status } = await req.json();
    const stored = await kv.get("orders");
    const orders = Array.isArray(stored)
      ? stored
      : JSON.parse(stored || "[]");

    const index = orders.findIndex((o) => String(o.id) === String(id));
    if (index === -1)
      return NextResponse.json(
        { success: false, message: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );

    orders[index] = {
      ...orders[index],
      status,
      updatedAt: new Date().toISOString(),
    };

    await kv.set("orders", JSON.stringify(orders));
    return NextResponse.json({ success: true, order: orders[index] });
  } catch (err) {
    console.error("❌ PUT /orders:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

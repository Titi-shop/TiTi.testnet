import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/* ===========================
   🟢 GET — Lấy chi tiết đơn
   /api/orders/[id]
=========================== */
export async function GET(req: Request, { params }: any) {
  const { id } = params;

  try {
    const stored = await kv.get("orders");
    let orders: any[] = [];

    if (stored) {
      try {
        orders = Array.isArray(stored) ? stored : JSON.parse(stored as string);
      } catch (e) {
        console.warn("⚠️ Lỗi parse dữ liệu KV:", e);
      }
    }

    const order = orders.find((o) => String(o.id) === String(id));

    if (!order) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (err: any) {
    console.log("❌ Lỗi GET:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ===========================
   🟡 PATCH — Cập nhật trạng thái
=========================== */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Thiếu thông tin cập nhật." }, { status: 400 });
    }

    let orders: any[] = [];
    const stored = await kv.get("orders");

    if (stored) {
      try {
        orders = Array.isArray(stored) ? stored : JSON.parse(stored as string);
      } catch (e) {
        console.warn("⚠️ Không thể parse dữ liệu KV:", e);
      }
    }

    const updatedOrders = orders.map((o) =>
      String(o.id) === String(id) ? { ...o, status } : o
    );

    await kv.set("orders", JSON.stringify(updatedOrders));

    console.log(`✅ Đơn ${id} cập nhật trạng thái: ${status}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi API PATCH:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

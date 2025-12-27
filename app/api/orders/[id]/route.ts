import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/* ===========================
   🟢 GET — Lấy chi tiết đơn
   /api/orders/[id]
=========================== */
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    const stored = await kv.get("orders");
    let orders: unknown[] = [];

    if (stored) {
      try {
        orders = Array.isArray(stored)
          ? (stored as unknown[])
          : JSON.parse(stored as string);
      } catch (e) {
        console.warn("⚠️ Lỗi parse dữ liệu KV:", e);
      }
    }

    const order = orders.find(
      (o) =>
        typeof o === "object" &&
        o !== null &&
        "id" in o &&
        String((o as { id: unknown }).id) === String(id)
    );

    if (!order) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (err: unknown) {
    console.log("❌ Lỗi GET:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ===========================
   🟡 PATCH — Cập nhật trạng thái
=========================== */
export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    const body = (await req.json()) as { status?: string };
    const status = body.status;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Thiếu thông tin cập nhật." },
        { status: 400 }
      );
    }

    let orders: unknown[] = [];
    const stored = await kv.get("orders");

    if (stored) {
      try {
        orders = Array.isArray(stored)
          ? (stored as unknown[])
          : JSON.parse(stored as string);
      } catch (e) {
        console.warn("⚠️ Không thể parse dữ liệu KV:", e);
      }
    }

    const updatedOrders = orders.map((o) =>
      typeof o === "object" &&
      o !== null &&
      "id" in o &&
      String((o as { id: unknown }).id) === String(id)
        ? { ...(o as Record<string, unknown>), status }
        : o
    );

    await kv.set("orders", JSON.stringify(updatedOrders));

    console.log(`✅ Đơn ${id} cập nhật trạng thái: ${status}`);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("❌ Lỗi API PATCH:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

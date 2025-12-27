import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

type OrderRecord = Record<string, unknown>;

/** 🔹 Khai báo type riêng cho context (không đổi logic) */
type RouteContext = {
  params: {
    id: string;
  };
};

/* ===========================
   🟢 GET — Lấy chi tiết đơn
=========================== */
export async function GET(_req: Request, context: RouteContext) {
  const id = context?.params?.id;

  try {
    const stored = await kv.get("orders");
    let orders: OrderRecord[] = [];

    if (stored) {
      try {
        orders = Array.isArray(stored)
          ? (stored as OrderRecord[])
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
  } catch (err) {
    console.log("❌ Lỗi GET:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ===========================
   🟡 PATCH — Cập nhật trạng thái
=========================== */
export async function PATCH(req: Request, context: RouteContext) {
  try {
    const id = context?.params?.id;

    const body = (await req.json()) as { status?: string };
    const status = body.status;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Thiếu thông tin cập nhật." },
        { status: 400 }
      );
    }

    let orders: OrderRecord[] = [];
    const stored = await kv.get("orders");

    if (stored) {
      try {
        orders = Array.isArray(stored)
          ? (stored as OrderRecord[])
          : JSON.parse(stored as string);
      } catch {
        console.warn("⚠️ Không thể parse dữ liệu KV");
      }
    }

    const updatedOrders = orders.map((o) =>
      typeof o === "object" &&
      o !== null &&
      "id" in o &&
      String((o as { id: unknown }).id) === String(id)
        ? { ...(o as OrderRecord), status }
        : o
    );

    await kv.set("orders", JSON.stringify(updatedOrders));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi API PATCH:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

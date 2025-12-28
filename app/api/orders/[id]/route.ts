import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

type Order = {
  id?: string | number;
  status?: string;
} & Record<string, unknown>;

function matchOrder(o: unknown, id: string): o is Order {
  return (
    typeof o === "object" &&
    o !== null &&
    "id" in o &&
    String((o as { id?: string | number }).id) === id
  );
}

/* ===========================
   🟢 GET — lấy đơn theo ID
=========================== */
export async function GET(
  _req: NextRequest,
  context: any // ⬅ bắt buộc để Next.js build pass
) {
  const id = String(context?.params?.id ?? "");

  if (!id) {
    return NextResponse.json(
      { error: "Thiếu ID đơn hàng" },
      { status: 400 }
    );
  }

  try {
    const stored = await kv.get("orders");

    const orders: Order[] =
      Array.isArray(stored)
        ? stored as Order[]
        : stored
        ? JSON.parse(stored as string)
        : [];

    const order = orders.find(o => matchOrder(o, id));

    if (!order) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error("❌ Lỗi GET:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ===========================
   🟡 PATCH — cập nhật trạng thái
=========================== */
export async function PATCH(
  req: NextRequest,
  context: any // ⬅ bắt buộc để Next.js build pass
) {
  const id = String(context?.params?.id ?? "");
  const body = await req.json();

  if (!id || !body?.status) {
    return NextResponse.json(
      { error: "Thiếu thông tin cập nhật" },
      { status: 400 }
    );
  }

  try {
    const stored = await kv.get("orders");

    const orders: Order[] =
      Array.isArray(stored)
        ? stored as Order[]
        : stored
        ? JSON.parse(stored as string)
        : [];

    const updated = orders.map(order =>
      matchOrder(order, id)
        ? { ...order, status: body.status }
        : order
    );

    await kv.set("orders", JSON.stringify(updated));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi PATCH:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

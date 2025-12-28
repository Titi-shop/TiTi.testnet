import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

type Order = {
  id?: string | number;
  status?: string;
} & Record<string, unknown>;

function isOrderWithId(o: unknown, id: string): o is Order {
  return (
    typeof o === "object" &&
    o !== null &&
    "id" in o &&
    String((o as { id?: string | number }).id) === id
  );
}

/* ===========================
   🟢 GET — Lấy chi tiết đơn
=========================== */
export async function GET(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  const id = context.params.id;

  try {
    const stored = await kv.get("orders");

    const orders: Order[] =
      Array.isArray(stored)
        ? stored as Order[]
        : stored
        ? JSON.parse(stored as string)
        : [];

    const order = orders.find(o => isOrderWithId(o, id));

    if (!order) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);

  } catch (err) {
    console.error("❌ Lỗi GET order:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

/* ===========================
   🟡 PATCH — Cập nhật trạng thái
=========================== */
export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const id = context.params.id;

  try {
    const body: { status?: string } = await req.json();

    if (!body.status) {
      return NextResponse.json(
        { error: "Thiếu trạng thái cập nhật" },
        { status: 400 }
      );
    }

    const stored = await kv.get("orders");

    const orders: Order[] =
      Array.isArray(stored)
        ? stored as Order[]
        : stored
        ? JSON.parse(stored as string)
        : [];

    const updated = orders.map(order =>
      isOrderWithId(order, id)
        ? { ...order, status: body.status }
        : order
    );

    await kv.set("orders", JSON.stringify(updated));

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("❌ Lỗi PATCH order:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

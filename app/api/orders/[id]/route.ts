import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

type OrderRecord = Record<string, unknown>;

type RouteParams = {
  params: { id: string };
};

/* ===========================
   GET — Lấy chi tiết đơn
=========================== */
export async function GET(
  _req: Request,
  { params }: RouteParams
) {
  const id = params.id;

  const stored = await kv.get("orders");
  let orders: OrderRecord[] = [];

  if (stored) {
    try {
      orders = Array.isArray(stored)
        ? (stored as OrderRecord[])
        : JSON.parse(stored as string);
    } catch {
      console.warn("KV parse error");
    }
  }

  const order = orders.find(
    (o) =>
      typeof o === "object" &&
      o !== null &&
      "id" in o &&
      String((o as { id: unknown }).id) === id
  );

  if (!order) {
    return NextResponse.json(
      { error: "Không tìm thấy đơn hàng" },
      { status: 404 }
    );
  }

  return NextResponse.json(order);
}

/* ===========================
   PATCH — Cập nhật trạng thái
=========================== */
export async function PATCH(
  req: Request,
  { params }: RouteParams
) {
  const id = params.id;

  const body = (await req.json()) as { status?: string };
  const status = body.status;

  if (!status) {
    return NextResponse.json(
      { error: "Thiếu thông tin cập nhật" },
      { status: 400 }
    );
  }

  const stored = await kv.get("orders");
  let orders: OrderRecord[] = [];

  if (stored) {
    try {
      orders = Array.isArray(stored)
        ? (stored as OrderRecord[])
        : JSON.parse(stored as string);
    } catch {
      console.warn("KV parse error");
    }
  }

  const updated = orders.map((o) =>
    typeof o === "object" &&
    o !== null &&
    "id" in o &&
    String((o as { id: unknown }).id) === id
      ? { ...(o as OrderRecord), status }
      : o
  );

  await kv.set("orders", JSON.stringify(updated));

  return NextResponse.json({ success: true });
}

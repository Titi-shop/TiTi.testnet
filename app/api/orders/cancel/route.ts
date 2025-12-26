import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

// 🧩 Helper: đọc danh sách đơn hàng
async function readOrders(): Promise<unknown[]> {
  try {
    const stored = await kv.get("orders");
    if (!stored) return [];
    if (Array.isArray(stored)) return stored as unknown[];
    return JSON.parse(stored as string) as unknown[];
  } catch (err: unknown) {
    console.error("❌ Lỗi đọc orders:", err);
    return [];
  }
}

// 🧩 Helper: ghi danh sách đơn hàng
async function writeOrders(orders: unknown[]): Promise<boolean> {
  try {
    await kv.set("orders", JSON.stringify(orders));
    return true;
  } catch (err: unknown) {
    console.error("❌ Lỗi ghi orders:", err);
    return false;
  }
}

// -----------------------------
// 🔹 POST /api/orders/cancel?id=...
// -----------------------------
export async function POST(req: Request) {
  try {
    // ✅ Lấy id từ query hoặc body đều được
    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get("id");

    const body: unknown =
      req.headers.get("content-type")?.includes("application/json")
        ? await req.json().catch(() => ({}))
        : {};

    const id =
      queryId ||
      (typeof body === "object" &&
      body !== null &&
      "id" in body
        ? String((body as { id: unknown }).id)
        : null);

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Thiếu mã đơn hàng cần hủy" },
        { status: 400 }
      );
    }

    // ✅ Đọc danh sách đơn hàng
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
        { ok: false, error: `Không tìm thấy đơn hàng #${id}` },
        { status: 404 }
      );
    }

    const order = orders[index] as Record<string, unknown>;

    // ✅ Nếu đơn đã bị hủy, trả lại thông báo nhẹ
    if (order.status === "Đã hủy") {
      return NextResponse.json({
        ok: true,
        message: `Đơn hàng #${id} đã được hủy trước đó.`,
        order,
      });
    }

    // ✅ Cập nhật trạng thái đơn
    order.status = "Đã hủy";
    order.updatedAt = new Date().toISOString();

    orders[index] = order;

    // ✅ Lưu lại KV
    await writeOrders(orders);

    console.log("🗑️ [ORDER CANCELLED]:", order);

    return NextResponse.json({
      ok: true,
      message: `Đơn hàng #${id} đã được hủy thành công.`,
      order,
    });
  } catch (err: unknown) {
    console.error("💥 Lỗi khi hủy đơn:", err);
    return NextResponse.json(
      { ok: false, error: "Lỗi không xác định" },
      { status: 500 }
    );
  }
}

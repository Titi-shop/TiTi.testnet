import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

// 🧩 Helper: đọc danh sách đơn hàng
async function readOrders() {
  try {
    const stored = await kv.get("orders");
    if (!stored) return [];
    if (Array.isArray(stored)) return stored;
    return JSON.parse(stored);
  } catch (err) {
    console.error("❌ Lỗi đọc orders:", err);
    return [];
  }
}

// 🧩 Helper: ghi danh sách đơn hàng
async function writeOrders(orders: any[]) {
  try {
    await kv.set("orders", JSON.stringify(orders));
    return true;
  } catch (err) {
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
    const body = req.headers.get("content-type")?.includes("application/json")
      ? await req.json().catch(() => ({}))
      : {};
    const id = queryId || body.id;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Thiếu mã đơn hàng cần hủy" },
        { status: 400 }
      );
    }

    // ✅ Đọc danh sách đơn hàng
    const orders = await readOrders();
    const index = orders.findIndex((o) => String(o.id) === String(id));

    if (index === -1) {
      return NextResponse.json(
        { ok: false, error: `Không tìm thấy đơn hàng #${id}` },
        { status: 404 }
      );
    }

    // ✅ Nếu đơn đã bị hủy, trả lại thông báo nhẹ
    if (orders[index].status === "Đã hủy") {
      return NextResponse.json({
        ok: true,
        message: `Đơn hàng #${id} đã được hủy trước đó.`,
        order: orders[index],
      });
    }

    // ✅ Cập nhật trạng thái đơn
    orders[index].status = "Đã hủy";
    orders[index].updatedAt = new Date().toISOString();

    // ✅ Lưu lại KV
    await writeOrders(orders);

    console.log("🗑️ [ORDER CANCELLED]:", orders[index]);

    return NextResponse.json({
      ok: true,
      message: `Đơn hàng #${id} đã được hủy thành công.`,
      order: orders[index],
    });
  } catch (err: any) {
    console.error("💥 Lỗi khi hủy đơn:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Lỗi không xác định" },
      { status: 500 }
    );
  }
}

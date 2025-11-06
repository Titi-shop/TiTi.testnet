import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

// 🧩 Helper đọc đơn
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

// 🧩 Helper ghi đơn
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Thiếu mã đơn hàng cần hủy" },
        { status: 400 }
      );
    }

    const orders = await readOrders();
    const index = orders.findIndex((o) => String(o.id) === String(id));

    if (index === -1) {
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    // ✅ Cập nhật trạng thái thay vì xóa hẳn
    orders[index].status = "Đã hủy";
    orders[index].updatedAt = new Date().toISOString();

    await writeOrders(orders);

    console.log("🗑️ [ORDER CANCELLED]:", orders[index]);

    return NextResponse.json({
      ok: true,
      message: `Đơn hàng #${id} đã được hủy thành công.`,
      order: orders[index],
    });
  } catch (err: any) {
    console.error("💥 Lỗi khi hủy đơn:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

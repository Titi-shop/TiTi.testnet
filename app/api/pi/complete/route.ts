import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

// 🔹 Helper: Đọc và ghi đơn hàng (giống logic bên /api/orders)
async function readOrders() {
  try {
    const stored = await kv.get("orders");
    if (!stored) return [];
    if (Array.isArray(stored)) return stored;
    try {
      return JSON.parse(stored);
    } catch {
      console.warn("⚠️ orders trong KV không phải JSON hợp lệ, reset lại.");
      return [];
    }
  } catch (err) {
    console.error("❌ Lỗi đọc orders:", err);
    return [];
  }
}

async function writeOrders(orders: any[]) {
  try {
    await kv.set("orders", JSON.stringify(orders));
    return true;
  } catch (err) {
    console.error("❌ Lỗi ghi orders:", err);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const { paymentId, txid } = await req.json();
    if (!paymentId) {
      return NextResponse.json({ error: "missing paymentId" }, { status: 400 });
    }

    const API_KEY = process.env.PI_API_KEY;
    const API_URL = process.env.PI_API_URL || "https://api.minepi.com/v2/payments";

    console.log("⏳ [Pi COMPLETE] ID:", paymentId, txid);

    // 1️⃣ Gọi API Pi Network để hoàn tất
    const res = await fetch(`${API_URL}/${paymentId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
      body: JSON.stringify({ txid }),
    });

    const data = await res.json();
    console.log("✅ [Pi COMPLETE RESULT]:", data);

    // 2️⃣ Kiểm tra trạng thái transaction từ Pi Network
    const status = data?.transaction?._status || data?._status || "";
    const amount = data?.amount || 0;
    const buyer = data?.user_uid || "unknown";

    // 🧠 Nếu giao dịch hoàn tất trên Pi
    if (status === "completed") {
      console.log("🎉 Giao dịch Pi đã hoàn tất, lưu đơn hàng...");

      // 3️⃣ Lưu đơn hàng mới vào KV
      const orders = await readOrders();
      const newOrder = {
        id: Date.now(),
        buyer,
        total: amount,
        status: "Đã thanh toán",
        note: `Pi TXID: ${txid}`,
        createdAt: new Date().toISOString(),
      };

      orders.unshift(newOrder);
      await writeOrders(orders);

      return NextResponse.json({
        success: true,
        message: "Thanh toán thành công",
        order: newOrder,
        pi: data,
      });
    }

    // 4️⃣ Nếu Pi vẫn đang pending
    console.log("⚠️ Giao dịch đang chờ xác minh trên Pi Network...");
    return NextResponse.json({
      success: false,
      message: "Giao dịch đang chờ xác minh trên Pi Network",
      pi: data,
    });
  } catch (err: any) {
    console.error("💥 [Pi COMPLETE ERROR]:", err);
    return NextResponse.json({ error: err.message || "unknown" }, { status: 500 });
  }
}

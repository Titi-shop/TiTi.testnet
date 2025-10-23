import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

// --- helpers ---
async function readOrders() {
  try {
    const stored = await kv.get("orders");
    if (!stored) return [];
    if (Array.isArray(stored)) return stored;
    return JSON.parse(stored);
  } catch {
    return [];
  }
}
async function writeOrders(orders: any[]) {
  await kv.set("orders", JSON.stringify(orders));
}

// --- main ---
export async function POST(req: Request) {
  try {
    const { paymentId, txid } = await req.json();
    if (!paymentId)
      return NextResponse.json({ error: "missing paymentId" }, { status: 400 });

    const API_KEY = process.env.PI_API_KEY;
    const API_URL = process.env.PI_API_URL || "https://api.minepi.com/v2/payments";

    // 🔹 Gọi Pi API
    const res = await fetch(`${API_URL}/${paymentId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
      body: JSON.stringify({ txid }),
    });

    const data = await res.json();
    const status = data?.transaction?._status || data?._status || "pending";
    const amount = data?.amount || 0;
    const buyer = data?.user_uid || "unknown";

    // 🔹 Đọc danh sách đơn hiện tại
    const orders = await readOrders();

    // 🔹 Tìm đơn đã tồn tại với paymentId (nếu có)
    const existing = orders.find((o) => o.paymentId === paymentId);

    if (existing) {
      existing.status = status === "completed" ? "Đã thanh toán" : "Chờ xác minh";
      existing.note = `Pi TXID: ${txid}`;
      existing.updatedAt = new Date().toISOString();
    } else {
      orders.unshift({
        id: Date.now(),
        paymentId,
        buyer,
        total: amount,
        status: status === "completed" ? "Đã thanh toán" : "Chờ xác minh",
        note: `Pi TXID: ${txid}`,
        createdAt: new Date().toISOString(),
      });
    }

    await writeOrders(orders);

    console.log("💾 Order saved/updated:", paymentId, status);

    return NextResponse.json({
      success: true,
      status,
      message:
        status === "completed"
          ? "✅ Thanh toán thành công!"
          : "⚠️ Giao dịch đang chờ xác minh trên Pi Network.",
    });
  } catch (err: any) {
    console.error("💥 [Pi COMPLETE ERROR]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

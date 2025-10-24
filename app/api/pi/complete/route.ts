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

    if (!API_KEY) {
      console.error("❌ Missing PI_API_KEY");
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    // 🔹 Gọi Pi API kiểm tra giao dịch
    const res = await fetch(`${API_URL}/${paymentId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
      body: JSON.stringify({ txid }),
    });

    const data = await res.json();
    console.log("📦 [PI COMPLETE RESPONSE]", data);

    const status =
      data?.transaction?._status || data?._status || "unknown";
    const amount = data?.amount || 0;
    const buyer = data?.user_uid || "unknown";
    const verifiedTxid = data?.transaction?.txid;

    // 🧠 Chỉ lưu khi Pi xác nhận thanh toán hoàn tất
    if (status === "completed" && verifiedTxid) {
      const orders = await readOrders();

      // Xem đơn đã tồn tại chưa
      const existing = orders.find((o) => o.paymentId === paymentId);
      if (existing) {
        existing.status = "Đã thanh toán";
        existing.note = `Pi TXID: ${verifiedTxid}`;
        existing.updatedAt = new Date().toISOString();
      } else {
        orders.unshift({
          id: Date.now(),
          paymentId,
          buyer,
          total: amount,
          status: "Đã thanh toán",
          note: `Pi TXID: ${verifiedTxid}`,
          createdAt: new Date().toISOString(),
        });
      }

      await writeOrders(orders);

      console.log("💾 ✅ Lưu đơn hoàn tất:", paymentId);
      return NextResponse.json({
        success: true,
        status: "completed",
        message: "✅ Thanh toán thành công và đã lưu đơn!",
      });
    }

    // ❌ Nếu chưa hoàn tất — KHÔNG LƯU GÌ CẢ
    console.warn("⚠️ Giao dịch chưa xác minh hoặc chưa hoàn tất:", paymentId);
    return NextResponse.json({
      success: false,
      status,
      message:
        "⚠️ Pi chưa xác minh giao dịch, không lưu đơn hàng. Vui lòng thanh toán lại.",
    });
  } catch (err: any) {
    console.error("💥 [Pi COMPLETE ERROR]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

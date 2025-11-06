import { NextResponse } from "next/server";

export async function GET() {
  try {
    const API_KEY = process.env.PI_API_KEY;
    const IS_TESTNET = process.env.NEXT_PUBLIC_PI_ENV === "testnet";

    const BASE_URL = IS_TESTNET
      ? "https://api.minepi.com/v2/sandbox"
      : "https://api.minepi.com/v2";

    if (!API_KEY) {
      return NextResponse.json({ ok: false, error: "❌ Thiếu PI_API_KEY" }, { status: 400 });
    }

    // 🧩 Lấy danh sách các payment chưa complete
    const res = await fetch(`${BASE_URL}/payments/incomplete`, {
      headers: { Authorization: `Key ${API_KEY}` },
    });
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ ok: true, message: "✅ Không có payment pending nào." });
    }

    const results = [];

    for (const payment of data) {
      const id = payment.identifier;
      console.log("🧹 Reset payment:", id);

      // ✅ Hủy payment
      await fetch(`${BASE_URL}/payments/${id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Key ${API_KEY}` },
      });

      results.push(id);
    }

    return NextResponse.json({
      ok: true,
      message: "🎉 Đã hủy toàn bộ payment pending!",
      results,
    });
  } catch (err: any) {
    console.error("💥 FIX ERROR:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

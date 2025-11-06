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

    console.log("🔍 Kiểm tra payment pending tại:", BASE_URL);

    const res = await fetch(`${BASE_URL}/payments/incomplete`, {
      headers: { Authorization: `Key ${API_KEY}` },
    });

    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();

    // Nếu trả về HTML → báo lỗi domain hoặc môi trường
    if (!contentType.includes("application/json")) {
      return NextResponse.json({
        ok: false,
        error: "Pi API trả về HTML → Sai môi trường (sandbox/mainnet) hoặc domain chưa đăng ký trong Pi Developer Portal.",
        message: text.slice(0, 300),
      });
    }

    const data = JSON.parse(text);

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ ok: true, message: "✅ Không có payment pending nào." });
    }

    const results = [];

    for (const payment of data) {
      const id = payment.identifier;
      console.log("🧹 Reset payment:", id);

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

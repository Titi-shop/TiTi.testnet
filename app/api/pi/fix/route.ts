// app/api/pi/fix/route.ts
import { NextResponse } from "next/server";

/**
 * ✅ Phiên bản fix tương thích PHP legacy (không cần domain duyệt)
 * - Gọi trực tiếp endpoint /v2/payments thay vì /sandbox
 * - Thêm header version: "2.0" để dùng chế độ testnet
 */

export async function GET() {
  try {
    const API_KEY = process.env.PI_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ ok: false, error: "❌ Thiếu PI_API_KEY" }, { status: 400 });
    }

    const API_URL = "https://api.minepi.com/v2/payments";

    console.log("🔍 Kiểm tra các payment pending tại:", API_URL);

    const res = await fetch(`${API_URL}/incomplete`, {
      headers: {
        Authorization: `Key ${API_KEY}`,
        "X-Pi-Api-Version": "2.0",
      },
    });

    const text = await res.text();

    // Nếu trả về HTML thì báo lỗi domain, key, hoặc Pi server
    if (text.startsWith("<!DOCTYPE")) {
      return NextResponse.json({
        ok: false,
        error: "⚠️ Pi API trả về HTML — có thể domain chưa whitelist hoặc server lỗi.",
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
      console.log("🧹 Hủy payment:", id);

      const cancelRes = await fetch(`${API_URL}/${id}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Key ${API_KEY}`,
          "X-Pi-Api-Version": "2.0",
        },
      });

      const cancelText = await cancelRes.text();
      results.push({ id, result: cancelText.slice(0, 100) });
    }

    return NextResponse.json({
      ok: true,
      message: "🎉 Đã hủy toàn bộ payment pending!",
      count: results.length,
      results,
    });
  } catch (err: any) {
    console.error("💥 FIX ERROR:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

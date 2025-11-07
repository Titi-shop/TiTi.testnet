import { NextResponse } from "next/server";

export async function GET() {
  const API_KEY = process.env.PI_API_KEY;
  const IS_TESTNET = process.env.NEXT_PUBLIC_PI_ENV === "testnet";

  const BASE_URL = IS_TESTNET
    ? "https://api.minepi.com/v2/sandbox"
    : "https://api.minepi.com/v2";

  if (!API_KEY) {
    return NextResponse.json({ ok: false, error: "Thiếu PI_API_KEY" }, { status: 500 });
  }

  try {
    console.log("🧹 Kiểm tra pending payments từ:", BASE_URL);

    const pendingRes = await fetch(`${BASE_URL}/payments/incomplete`, {
      headers: { Authorization: `Key ${API_KEY}` },
    });

    const contentType = pendingRes.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await pendingRes.text();
      console.error("❌ Pi API trả về HTML:", text.slice(0, 200));
      return NextResponse.json({
        ok: false,
        error: "Pi API trả về HTML (sai domain hoặc sai môi trường)",
        message: text.slice(0, 200),
      });
    }

    const pendingData = await pendingRes.json();
    if (!Array.isArray(pendingData) || pendingData.length === 0) {
      return NextResponse.json({ ok: true, message: "✅ Không có pending nào." });
    }

    // 🧹 Huỷ tất cả pending
    const results = [];
    for (const payment of pendingData) {
      console.log("🗑️ Huỷ pending:", payment.identifier);
      const res = await fetch(`${BASE_URL}/payments/${payment.identifier}/cancel`, {
        method: "POST",
        headers: { Authorization: `Key ${API_KEY}` },
      });
      const result = await res.text();
      results.push({ id: payment.identifier, result });
    }

    return NextResponse.json({
      ok: true,
      message: "🎉 Đã hủy toàn bộ pending payment.",
      results,
    });
  } catch (err: any) {
    console.error("💥 Lỗi khi huỷ pending:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Không xác định" },
      { status: 500 }
    );
  }
}

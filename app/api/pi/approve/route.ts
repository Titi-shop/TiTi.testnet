import { NextResponse } from "next/server";

/**
 * ✅ API duyệt (approve) thanh toán Pi Network
 * - Dùng API_KEY thật (Pi Developer Dashboard)
 * - Hoạt động cả trên SANDBOX (testnet) và MAINNET thật
 */
export async function POST(req: Request) {
  try {
    const { paymentId } = await req.json();

    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: "Thiếu paymentId" },
        { status: 400 }
      );
    }

    const API_KEY = process.env.PI_API_KEY;
    const isSandbox =
      process.env.PI_ENV === "sandbox" ||
      process.env.PI_API_URL?.includes("/sandbox");

    const API_BASE = isSandbox
      ? "https://api.minepi.com/v2/sandbox/payments"
      : "https://api.minepi.com/v2/payments";

    const endpoint = `${API_BASE}/${paymentId}/approve`;

    if (!API_KEY) {
      console.error("❌ Thiếu PI_API_KEY trong .env");
      return NextResponse.json(
        { success: false, message: "Thiếu Pi API Key" },
        { status: 500 }
      );
    }

    console.log(`⏳ [Pi APPROVE] Giao dịch: ${paymentId} (${isSandbox ? "SANDBOX" : "MAINNET"})`);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
    });

    const text = await res.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = { raw: text };
    }

    console.log("✅ [Pi APPROVE RESULT]:", res.status, result);

    // Nếu sai key hoặc domain chưa đăng ký
    if (res.status === 401) {
      console.error("❌ API Key sai hoặc domain chưa đăng ký trên Pi Developer Portal!");
    }

    return NextResponse.json(result, {
      status: res.status,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: any) {
    console.error("💥 [Pi APPROVE ERROR]:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Lỗi xác nhận giao dịch" },
      { status: 500 }
    );
  }
}

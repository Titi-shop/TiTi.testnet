import { NextResponse } from "next/server";

/**
 * ✅ API xác nhận hoàn tất thanh toán Pi Network
 * - Gửi POST đến /{paymentId}/complete
 * - Dùng API_KEY thật (không sandbox)
 */
export async function POST(req: Request) {
  try {
    const { paymentId, txid } = await req.json();

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

    const endpoint = `${API_BASE}/${paymentId}/complete`;

    console.log(`⏳ [Pi COMPLETE] Xác nhận ${paymentId} (${isSandbox ? "SANDBOX" : "MAINNET"})`);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
      body: JSON.stringify({ txid }),
    });

    const resultText = await res.text();
    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      result = { raw: resultText };
    }

    console.log("✅ [Pi COMPLETE RESULT]:", res.status, result);

    return NextResponse.json(result, {
      status: res.status,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: any) {
    console.error("💥 [Pi COMPLETE ERROR]:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Lỗi xác nhận thanh toán" },
      { status: 500 }
    );
  }
}

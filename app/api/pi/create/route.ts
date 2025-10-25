import { NextResponse } from "next/server";

/**
 * ✅ API tạo giao dịch thanh toán mới trên Pi Network
 *  - Nhận dữ liệu từ frontend (amount, memo, metadata)
 *  - Gửi đến đúng endpoint Pi API (mainnet hoặc sandbox)
 */

export const dynamic = "force-dynamic"; // tránh cache Vercel

export async function POST(req: Request) {
  try {
    const { amount, memo, metadata } = await req.json();

    if (!amount || !memo) {
      return NextResponse.json(
        { success: false, message: "Thiếu amount hoặc memo" },
        { status: 400 }
      );
    }

    const API_KEY = process.env.PI_API_KEY;
    const isSandbox =
      process.env.PI_ENV === "sandbox" ||
      process.env.PI_API_URL?.includes("/sandbox");

    // ✅ Chọn đúng endpoint
    const API_URL = isSandbox
      ? "https://api.minepi.com/v2/sandbox/payments"
      : "https://api.minepi.com/v2/payments";

    if (!API_KEY) {
      console.error("❌ Thiếu PI_API_KEY trong môi trường!");
      return NextResponse.json(
        { success: false, message: "Thiếu Pi API Key" },
        { status: 500 }
      );
    }

    console.log(`🟢 [Pi CREATE] Gửi giao dịch mới tới ${isSandbox ? "SANDBOX" : "MAINNET"}...`);
    console.log("📦 Payload:", { amount, memo, metadata });

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
      body: JSON.stringify({ amount, memo, metadata }),
    });

    const resultText = await res.text();
    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      result = { raw: resultText };
    }

    console.log("✅ [Pi CREATE RESULT]:", res.status, result);

    return NextResponse.json(result, {
      status: res.status,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (error: any) {
    console.error("💥 [Pi CREATE ERROR]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi tạo giao dịch" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

/**
 * ✅ API tạo giao dịch thanh toán mới trên Pi Network
 *  - Nhận dữ liệu từ frontend (amount, memo, metadata)
 *  - Gửi đến Pi API: https://api.minepi.com/v2/sandbox
 *  - Trả về paymentId và trạng thái
 */

export const dynamic = "force-dynamic"; // tránh cache Vercel

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, memo, metadata } = body;

    if (!amount || !memo) {
      return NextResponse.json(
        { error: "Thiếu amount hoặc memo" },
        { status: 400 }
      );
    }

    const API_KEY = process.env.PI_API_KEY;
const API_URL = process.env.PI_API_URL || "https://api.minepi.com/v2/sandbox";
    if (!API_KEY) {
      console.error("❌ Thiếu PI_API_KEY trong biến môi trường");
      return NextResponse.json({ error: "Thiếu API key" }, { status: 500 });
    }

    console.log("🟢 [Pi CREATE] Gửi giao dịch mới tới Pi Network...");
    console.log("📦 Dữ liệu gửi:", { amount, memo, metadata });

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
      body: JSON.stringify({
        amount,
        memo,
        metadata,
      }),
    });

    const text = await res.text();
    console.log("✅ [Pi CREATE RESULT]:", res.status, text);

    // Nếu API trả lỗi xác thực (401)
    if (res.status === 401) {
      console.error("❌ Sai API Key hoặc app chưa đăng ký domain Pi Network!");
    }

    // Trả kết quả về cho frontend
    return new NextResponse(text, {
      status: res.status,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (error: any) {
    console.error("💥 [Pi CREATE ERROR]:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi không xác định" },
      { status: 500 }
    );
  }
}

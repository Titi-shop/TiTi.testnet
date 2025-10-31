import { NextResponse } from "next/server";

/**
 * 🧾 API kiểm tra danh sách giao dịch Pi của app
 * - Dùng để xem những giao dịch bị pending (kẹt)
 * - Truy cập tại: https://muasam.titi.onl/api/pi/list
 */

export async function GET() {
  try {
    const API_KEY = process.env.PI_API_KEY;
    const API_URL =
      process.env.PI_API_URL || "https://api.minepi.com/v2/sandbox/payments";

    if (!API_KEY) {
      console.error("❌ Thiếu biến môi trường PI_API_KEY");
      return NextResponse.json({ error: "Missing PI_API_KEY" }, { status: 500 });
    }

    console.log("🔍 [PI LIST] Đang lấy danh sách giao dịch...");

    const res = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("💥 [PI LIST ERROR]:", res.status, text);
      return NextResponse.json(
        { error: `API Error ${res.status}`, details: text },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Lọc giao dịch bị kẹt (pending)
    const pending = (data?.data || []).filter((p: any) => p.status === "pending");

    return NextResponse.json({
      total: data?.data?.length || 0,
      pendingCount: pending.length,
      pending,
      all: data?.data || [],
    });
  } catch (err: any) {
    console.error("💥 [PI LIST ERROR]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

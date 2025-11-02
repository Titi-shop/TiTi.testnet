import { NextResponse } from "next/server";

/**
 * 🧾 API quản lý giao dịch Pi
 * - GET  → Xem danh sách giao dịch từ Pi API
 * - POST → Ghi log giao dịch kẹt gửi từ client
 */
const LOG_STORE: any[] = []; // Bộ nhớ tạm trong server runtime

// 🧩 Lấy danh sách giao dịch từ Pi Sandbox
export async function GET() {
  try {
    const API_KEY = process.env.PI_API_KEY;
    const API_URL = "https://api.minepi.com/v2/sandbox/payments";

    if (!API_KEY) {
      console.error("❌ Thiếu biến môi trường PI_API_KEY");
      return NextResponse.json({ error: "Missing PI_API_KEY" }, { status: 500 });
    }

    console.log("🔍 [PI LIST] Đang lấy danh sách giao dịch từ Pi...");

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
    const pending = (data?.data || []).filter((p: any) => p.status === "pending");

    return NextResponse.json({
      total: data?.data?.length || 0,
      pendingCount: pending.length,
      pending,
      localLog: LOG_STORE,
    });
  } catch (err: any) {
    console.error("💥 [PI LIST ERROR]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🧩 Ghi log giao dịch pending từ client
export async function POST(req: Request) {
  try {
    const body = await req.json();
    LOG_STORE.push({ ...body, time: new Date().toISOString() });

    console.log("🟡 [PI LOG] Đã ghi log pending:", body);

    return NextResponse.json({ success: true, received: body });
  } catch (err: any) {
    console.error("💥 [PI LOG ERROR]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

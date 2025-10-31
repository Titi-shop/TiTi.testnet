import { NextResponse } from "next/server";

export async function GET() {
  try {
    const API_KEY = process.env.PI_API_KEY;
    const API_URL = process.env.PI_API_URL || "https://api.minepi.com/v2/sandbox/payments";

    if (!API_KEY) {
      return NextResponse.json({ error: "❌ Missing PI_API_KEY" }, { status: 400 });
    }

    // 1️⃣ Lấy danh sách tất cả payment
    const res = await fetch(API_URL, {
      headers: { Authorization: `Key ${API_KEY}` },
    });
    const data = await res.json();

    const pending = data?.data?.filter((p: any) => p.status === "pending") || [];

    if (pending.length === 0) {
      return NextResponse.json({ message: "✅ Không có giao dịch pending nào." });
    }

    // 2️⃣ In ra danh sách pending
    const results: any[] = [];
    for (const p of pending) {
      const pid = p.identifier;
      console.log("🧾 Đang reset:", pid);

      const approve = await fetch(`${API_URL}/${pid}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Key ${API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      const complete = await fetch(`${API_URL}/${pid}/complete`, {
        method: "POST",
        headers: {
          Authorization: `Key ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ txid: "fix_" + Date.now() }),
      });

      results.push({
        paymentId: pid,
        approveStatus: approve.status,
        completeStatus: complete.status,
      });
    }

    return NextResponse.json({
      message: "🎉 Đã xử lý tất cả giao dịch pending!",
      results,
    });
  } catch (err: any) {
    console.error("💥 FIX ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

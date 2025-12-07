// app/api/pi/approve/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { paymentId } = await req.json(); // <-- PI PAYMENT ID (Quan trọng)

    if (!paymentId) {
      return NextResponse.json({ error: "missing paymentId" }, { status: 400 });
    }

    const API_KEY = process.env.PI_API_KEY!;
    const API_URL = process.env.PI_API_URL!; // testnet endpoint

    console.log("⏳ [TESTNET APPROVE] paymentId:", paymentId);

    const res = await fetch(`${API_URL}/${paymentId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
    });

    const text = await res.text();

    console.log("✅ APPROVE RESULT:", res.status, text);

    return new NextResponse(text, { status: res.status });
  } catch (err: any) {
    console.error("❌ APPROVE ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

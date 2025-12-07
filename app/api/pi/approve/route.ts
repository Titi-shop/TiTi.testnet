import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function POST(req: Request) {
  try {
    const { paymentId } = await req.json();

    if (!paymentId)
      return NextResponse.json({ error: "missing paymentId" }, { status: 400 });

    const payment = await kv.get(`pi:payment:${paymentId}`);

    if (!payment)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    const API_KEY = process.env.PI_API_KEY!;
    const API_URL = process.env.PI_API_URL!;

    console.log("⏳ [TESTNET APPROVE]:", paymentId);

    const res = await fetch(`${API_URL}/${paymentId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
    });

    const text = await res.text();
    const json = JSON.parse(text);

    await kv.set(`pi:payment:${paymentId}`, {
      ...payment,
      status: "approved",
      approved_at: Date.now(),
      server_approve: json
    });

    console.log("✅ APPROVE RESULT:", json);

    return NextResponse.json(json, { status: res.status });
  } catch (err: any) {
    console.error("❌ APPROVE ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

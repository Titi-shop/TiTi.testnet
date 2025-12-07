import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentId, amount, metadata } = body;

    if (!paymentId)
      return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });

    console.log("📌 [PI CREATE - TESTNET] Payment:", body);

    await kv.set(`pi:payment:${paymentId}`, {
      status: "pending",
      amount,
      metadata,
      created_at: Date.now(),
      env: "testnet"
    });

    return NextResponse.json({
      status: "ok",
      message: "payment initialized (testnet)",
    });
  } catch (err: any) {
    console.error("❌ CREATE ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

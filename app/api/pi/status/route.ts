// app/api/pi/create/route.ts
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { amount, orderId, items, shipping, buyer } = await req.json();

    if (!amount || !orderId) {
      return NextResponse.json(
        { success: false, error: "Missing amount or orderId" },
        { status: 400 }
      );
    }

    // Tạo backendPaymentId (RẤT QUAN TRỌNG)
    const backendPaymentId = crypto.randomBytes(16).toString("hex");

    const payment = {
      backendPaymentId,
      amount,
      orderId,
      buyer,
      items,
      shipping,
      status: "created",
      created_at: Date.now(),
      env: "testnet",
    };

    await kv.set(`pi:payment:${backendPaymentId}`, payment);

    console.log("🟢 [CREATE] Payment stored:", payment);

    return NextResponse.json({
      success: true,
      paymentId: backendPaymentId,
    });
  } catch (err: any) {
    console.error("❌ CREATE ERROR:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

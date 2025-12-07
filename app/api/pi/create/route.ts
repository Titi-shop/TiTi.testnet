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

    // Tạo paymentId nội bộ server (rất quan trọng)
    const paymentId = crypto.randomBytes(16).toString("hex");

    const payment = {
      paymentId,
      amount,
      orderId,
      buyer,
      items,
      shipping,
      status: "created",
      created_at: Date.now(),
      env: "testnet",
    };

    // Lưu vào KV
    await kv.set(`pi:payment:${paymentId}`, payment);

    console.log("🟢 [CREATE] Payment stored:", payment);

    return NextResponse.json({
      success: true,
      paymentId,
    });

  } catch (err: any) {
    console.error("❌ CREATE ERROR:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

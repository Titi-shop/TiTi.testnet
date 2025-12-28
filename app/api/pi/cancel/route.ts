import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type CreatePaymentRequest = Readonly<{
  amount: number;
  memo: string;
  user_uid: string;
  txid: string;
}>;

export async function POST(req: Request) {
  try {
    const body: Partial<CreatePaymentRequest> = await req.json();

    const { amount, memo, user_uid, txid } = {
      amount: body.amount ?? 0,
      memo: body.memo ?? "",
      user_uid: body.user_uid ?? "",
      txid: body.txid ?? "",
    };

    if (!amount || !memo || !user_uid || !txid) {
      return NextResponse.json(
        { error: "missing required fields" },
        { status: 400 }
      );
    }

    const API_KEY = process.env.PI_API_KEY;
    const IS_TESTNET = process.env.NEXT_PUBLIC_PI_ENV === "testnet";

    if (!API_KEY) {
      return NextResponse.json(
        { error: "PI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const API_URL = IS_TESTNET
      ? "https://api.minepi.com/v2/sandbox/payments"
      : "https://api.minepi.com/v2/payments";

    console.log("💰 [PI CREATE] tạo giao dịch", {
      amount,
      memo,
      user_uid,
    });

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
      body: JSON.stringify({
        amount,
        memo,
        metadata: { user_uid },
        txid,
      }),
    });

    const text = await res.text();
    console.log("✅ [PI CREATE RESULT]", res.status);

    return new NextResponse(text, {
      status: res.status,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    console.error("💥 [PI CREATE ERROR]:", err);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

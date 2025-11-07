import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { paymentId } = await req.json();
    if (!paymentId) {
      return NextResponse.json({ ok: false, error: "Thiếu paymentId" }, { status: 400 });
    }

    const API_KEY = process.env.PI_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ ok: false, error: "Thiếu PI_API_KEY" }, { status: 500 });
    }

    const API_URL = "https://api.minepi.com/v2/payments";

    const res = await fetch(`${API_URL}/${paymentId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${API_KEY}`,
        "X-Pi-Api-Version": "2.0",
      },
    });

    const text = await res.text();

    if (text.startsWith("<!DOCTYPE")) {
      return NextResponse.json({
        ok: false,
        error: "⚠️ Pi API trả về HTML — domain chưa duyệt hoặc server lỗi.",
        message: text.slice(0, 200),
      });
    }

    return NextResponse.json({ ok: true, message: "✅ Approve thành công", result: text });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

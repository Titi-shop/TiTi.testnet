// /app/api/pi/create/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  console.log("📦 [Pi CREATE] Gửi giao dịch mới tới Pi API...");
  console.log("Payload:", body);

  try {
    const res = await fetch(`${process.env.PI_API_URL}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.PI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: body.amount,
        memo: body.memo,
        metadata: body.metadata,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ Pi API error:", text);
      return Response.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    console.log("✅ [Pi CREATE RESULT]:", data);
    return Response.json(data);
  } catch (err) {
    console.error("💥 Lỗi khi tạo payment:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

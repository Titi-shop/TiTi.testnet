const API_KEY = process.env.PI_API_KEY;
const API_URL = process.env.NEXT_PUBLIC_PI_ENV === "testnet"
  ? "https://api.minepi.com/v2/sandbox/payments"
  : "https://api.minepi.com/v2/payments";

// Gọi Pi API để hủy
const piRes = await fetch(`${API_URL}/${id}/cancel`, {
  method: "POST",
  headers: { Authorization: `Key ${API_KEY}` },
});

if (!piRes.ok) {
  const text = await piRes.text();
  console.error("❌ Pi Cancel Error:", text);
  return NextResponse.json({
    ok: false,
    error: `Không thể hủy trên Pi API (${piRes.status})`,
  });
}

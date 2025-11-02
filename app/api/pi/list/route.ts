import { NextResponse } from "next/server";

// ✅ Xử lý POST request để nhận log payment pending
export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("📦 [Pending Payment Log]:", data);

    return NextResponse.json({ ok: true, message: "Đã ghi log thành công" });
  } catch (err: any) {
    console.error("❌ [API Error]:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

// ✅ (Tuỳ chọn) Cho phép test nhanh bằng trình duyệt với GET
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "API /api/pi/list đang hoạt động 🚀",
  });
}

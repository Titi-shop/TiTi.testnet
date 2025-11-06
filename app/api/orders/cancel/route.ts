import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id)
    return NextResponse.json({ ok: false, error: "Thiếu ID đơn hàng" }, { status: 400 });

  try {
    // Gọi DB hoặc file JSON để xóa đơn hàng (tùy cấu trúc app bạn)
    console.log("🗑 Hủy đơn hàng ID:", id);

    // Giả lập thành công
    return NextResponse.json({ ok: true, message: "Đã hủy đơn hàng thành công" });
  } catch (err: any) {
    console.error("❌ Lỗi khi hủy đơn:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

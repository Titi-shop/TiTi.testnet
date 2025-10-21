import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Thiếu thông tin cập nhật." }, { status: 400 });
    }

    // Lấy danh sách đơn hiện tại
    const orders = (await kv.get("orders")) || [];

    // Tìm và cập nhật
    const updatedOrders = orders.map((o: any) =>
      o.id === id ? { ...o, status } : o
    );

    // Lưu lại
    await kv.set("orders", updatedOrders);

    console.log(`✅ Đơn ${id} đã cập nhật sang trạng thái: ${status}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi API PATCH:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

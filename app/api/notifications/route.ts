import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

// 📌 GET: Lấy toàn bộ thông báo từ KV
export async function GET() {
  try {
    // Lấy danh sách thông báo từ KV (list dạng JSON string)
    const raw = await kv.lrange("notifications", 0, -1);

    // Parse lại thành object
    const notifications = raw.map((item: string) => JSON.parse(item));

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("❌ Lỗi khi lấy thông báo:", error);
    return NextResponse.json(
      { error: "Không thể tải thông báo" },
      { status: 500 }
    );
  }
}

// 📌 POST: Thêm thông báo mới vào KV
export async function POST(req: Request) {
  try {
    const { title, message, date } = await req.json();

    const newNotification = {
      id: Date.now(),
      title,
      message,
      date: date || new Date().toISOString(),
    };

    // Lưu vào KV (dạng list)
    await kv.rpush("notifications", JSON.stringify(newNotification));

    return NextResponse.json({ success: true, newNotification });
  } catch (error) {
    console.error("❌ Lỗi khi thêm thông báo:", error);
    return NextResponse.json({ error: "Không thể lưu thông báo" }, { status: 500 });
  }
}

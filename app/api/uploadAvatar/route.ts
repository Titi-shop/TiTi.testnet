import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { Redis } from "@upstash/redis";

// 🧩 Kết nối Redis (Upstash)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  try {
    // 🟢 Lấy dữ liệu từ FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const username = formData.get("username")?.toString() || "";

    // ⚠️ Kiểm tra dữ liệu đầu vào
    if (!file || !username) {
      return NextResponse.json(
        { error: "Thiếu file hoặc tên người dùng!" },
        { status: 400 }
      );
    }

    console.log("📸 Upload avatar cho:", username);

    // 🔑 Kiểm tra token upload
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.error("❌ Thiếu biến môi trường: BLOB_READ_WRITE_TOKEN");
      return NextResponse.json(
        { error: "Server chưa cấu hình token upload ảnh." },
        { status: 500 }
      );
    }

    // 🧠 Upload ảnh lên Vercel Blob Storage
    const blob = await put(`avatars/${username}-${Date.now()}.jpg`, file, {
      access: "public",
      token,
    });

    console.log("✅ Upload thành công:", blob.url);

    // 💾 Lưu URL avatar vào Redis
    await redis.set(`avatar:${username}`, blob.url);

    // ✅ Trả về kết quả cho frontend
    return NextResponse.json({ success: true, url: blob.url });
  } catch (error: any) {
    console.error("❌ Lỗi upload avatar:", error?.message || error);
    return NextResponse.json(
      { error: "Không thể tải ảnh lên máy chủ.", detail: error?.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { put } from "@vercel/blob";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const username = (formData.get("username") as string | null)?.trim() || "";

    console.log("📦 Received upload:", {
      hasFile: !!file,
      username,
    });

    if (!file || !username) {
      return NextResponse.json(
        { error: "Thiếu dữ liệu file hoặc username", debug: { username, hasFile: !!file } },
        { status: 400 }
      );
    }

    // Upload ảnh lên Blob Storage
    const blob = await put(`avatars/${username}-${Date.now()}.jpg`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Lưu URL vào KV
    await kv.set(`avatar:${username.toLowerCase()}`, blob.url);

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("❌ Upload avatar error:", error);
    return NextResponse.json({ error: "Lỗi upload ảnh" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Không có file" }, { status: 400 });
    }

    const blob = await put(`category-${Date.now()}.png`, file, {
      access: "public",
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (err) {
    console.error("❌ Upload icon lỗi:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

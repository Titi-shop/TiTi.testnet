import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function GET() {
  const categories = [
    { id: 1, name: "Điện thoại & Laptop", icon: "/banners/Screenshot_2025-11-10-12-25-21-079_com.shopee.vn.jpg" },
    { id: 2, name: "Thời trang Nam", icon: "https://placekitten.com/201/200" },
    { id: 3, name: "Thời trang Nữ", icon: "https://placekitten.com/202/200" },
    { id: 4, name: "Giày dép", icon: "https://placekitten.com/203/200" },
    { id: 5, name: "Làm đẹp", icon: "https://placekitten.com/204/200" },
    { id: 6, name: "Nhà cửa & Đời sống", icon: "https://placekitten.com/205/200" },
    { id: 7, name: "Mẹ & Bé", icon: "https://placekitten.com/206/200" },
    { id: 8, name: "Thiết bị điện tử", icon: "https://placekitten.com/207/200" },
    { id: 9, name: "Đồ gia dụng", icon: "https://placekitten.com/208/200" },
    { id: 10, name: "Sức khỏe", icon: "https://placekitten.com/209/200" },
    { id: 11, name: "Thể thao & Du lịch", icon: "https://placekitten.com/210/200" },
    { id: 12, name: "Ô tô & Xe máy", icon: "https://placekitten.com/211/200" },
    { id: 13, name: "Thú cưng", icon: "https://placekitten.com/212/200" },
    { id: 14, name: "Tạp hóa", icon: "https://placekitten.com/213/200" },
    { id: 15, name: "Sách", icon: "https://placekitten.com/214/200" },
    { id: 16, name: "Đồng hồ", icon: "https://placekitten.com/215/200" },
    { id: 17, name: "Phụ kiện thời trang", icon: "https://placekitten.com/216/200" },
    { id: 18, name: "Máy ảnh & Flycam", icon: "https://placekitten.com/217/200" },
    { id: 19, name: "Đồ chơi", icon: "https://placekitten.com/218/200" },
    { id: 20, name: "Nội thất", icon: "https://placekitten.com/219/200" },
  ];

  await kv.set("categories", categories);

  return NextResponse.json({
    ok: true,
    message: "Đã tạo đầy đủ danh mục",
    count: categories.length,
    categories
  });
}

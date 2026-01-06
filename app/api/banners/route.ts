import { NextResponse } from "next/server";

/**
 * 🧩 API: /api/banners
 * Trả danh sách banner quảng cáo hiển thị trên trang chủ và trang quảng cáo
 */
export async function GET() {
  const banners = [
    {
      id: 1,
      image: "/banners/quảng cáo 1.jpg",
      link: "/category/pet",
      title: "Ưu đãi đặc biệt cho thú cưng 🐶",
    },
    {
      id: 2,
      image: "/banners/quảng cáo 2.jpg",
      link: "/category/electronics",
      title: "🔥 Siêu giảm giá điện tử - Mua ngay!",
    },
    {
      id: 3,
      image: "/banners/quảng cáo 3.jpg",
      link: "/category/fashion",
      title: "💃 Thời trang 2025 - Sale sốc toàn sàn",
    },
  ];

  return NextResponse.json(banners);
}

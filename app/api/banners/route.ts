import { NextResponse } from "next/server";

/**
 * 🧩 API: /api/banners
 * Trả danh sách banner quảng cáo hiển thị trên trang chủ
 */
export async function GET() {
  const banners = [
    {
      id: 1,
      image: "/banners/banner1.jpg",
      link: "/category/pet",
      title: "Thức ăn thú cưng tự nhiên - Ưu đãi 50%",
    },
    {
      id: 2,
      image: "/banners/banner2.jpg",
      link: "/category/electronics",
      title: "Điện tử giảm giá lớn - Mua ngay!",
    },
    {
      id: 3,
      image: "/banners/banner3.jpg",
      link: "/category/fashion",
      title: "Thời trang 2025 - Sale sốc toàn sàn",
    },
  ];

  return NextResponse.json(banners);
}

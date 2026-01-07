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
      title: "
    },
    {
      id: 2,
      image: "/banners/quảng cáo 2.jpg",
      link: "/category/electronics",
      title: "",
    },
    {
      id: 3,
      image: "/banners/quảng cáo 3.jpg",
      link: "/category/fashion",
      title: "",
    },
  ];

  return NextResponse.json(banners);
}

import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ti-ti-testnet-l0xrp7kcu-titi1.vercel.app";

  const banners = [
    {
      id: 1,
      image: `${baseUrl}/banners/d506c80c-c548-41ce-b0e2-79dafa6d2de4.jfif`,
      link: "/category/pet",
      title: "Ưu đãi đặc biệt cho thú cưng 🐶",
    },
    {
      id: 2,
      image: `${baseUrl}/banners/c60da310-1c35-4598-9ddb-e1457741a262.jfif`,
      link: "/category/electronics",
      title: "🔥 Siêu giảm giá điện tử - Mua ngay!",
    },
    {
      id: 3,
      image: `${baseUrl}/banners/b42db293-7ba1-41a2-9bd1-7373ca643943.jfif`,
      link: "/category/fashion",
      title: "💃 Thời trang 2025 - Sale sốc toàn sàn",
    },
  ];

  return NextResponse.json(banners);
}

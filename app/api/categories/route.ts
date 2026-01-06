import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    { id: 1, name: "Điện thoại & Laptop", icon: "/banners/laptop.jpg" },
    { id: 2, name: "Thời trang Nam", icon: "/banners/thời trang nam.jpg" },
    { id: 3, name: "Thời trang Nữ", icon: "/banners/thời trang nữ.jpg" },
    { id: 4, name: "Giày dép", icon: "/banners/giày dép.jpg" },
    { id: 5, name: "Nước hoa & Mỹ ", icon: "/banners/nước hoa.jpg" },
    { id: 20, name: "Nội thất", icon: "/banners/noithat.jpg" },
    { id: 7, name: "Mẹ & Bé", icon: "/banners/mevabe.jpg" },
    { id: 8, name: "Thiết bị điện tử", icon: "/banners/dienthoai.jpg" },
    { id: 9, name: "Đồ gia dụng", icon: "/banners/dogiadung.jpg" },
    { id: 10, name: "Sức khỏe", icon: "/banners/suckhoe.jpg" },
    { id: 11, name: "Thể thao & Du lịch", icon: "/banners/thethao.jpg" },
    { id: 12, name: "Ô tô & Xe máy", icon: "/banners/oto.jpg" },
    { id: 13, name: "Thú cưng", icon: "/banners/thucung.jpg" },
    { id: 14, name: "Điện máy", icon: "/banners/dienmay.jpg" },
    { id: 15, name: "Sách", icon: "/banners/sach.jpg" },
    { id: 16, name: "Đồng hồ", icon: "/banners/đông hồ .jpg" },
    { id: 19, name: "Đồ chơi", icon: "/banners/dochoi.jpg" },
    { id: 18, name: "Máy ảnh & Flycam", icon: "/banners/máy ảnh.jpg" },
  ]);
}

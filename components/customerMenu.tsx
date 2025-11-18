"use client";

import { useRouter } from "next/navigation";
import {
  User,
  Package,
  Wallet,
  HelpCircle,
  MessageCircle,
  Globe,
  MapPin,
  LogOut,
  PackagePlus,
  ClipboardList,
  Store
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const customerMenuItems = [
  { label: "Hồ sơ cá nhân", icon: <User size={22} />, path: "/customer/profile" },
  { label: "Đơn hàng của tôi", icon: <Package size={22} />, path: "/customer/orders" },
  { label: "Ví Pi", icon: <Wallet size={22} />, path: "/customer/wallet" },
  { label: "Tin nhắn", icon: <MessageCircle size={22} />, path: "/customer/messages" },
  { label: "Ngôn ngữ", icon: <Globe size={22} />, path: "/settings/language" },
  { label: "Địa chỉ giao hàng", icon: <MapPin size={22} />, path: "/customer/address" },
  { label: "Hỗ trợ", icon: <HelpCircle size={22} />, path: "/support" },
];

// 🛒 Menu Seller luôn hiển thị
const sellerMenuItems = [
  { label: "Đăng hàng", icon: <PackagePlus size={22} />, path: "/seller/post" },
  { label: "Kho hàng", icon: <Store size={22} />, path: "/seller/stock" },
  { label: "Đơn hàng bán", icon: <ClipboardList size={22} />, path: "/seller/orders" },
];

export default function CustomerMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // ⭐ CHỈ kiểm tra để điều hướng đúng chứ KHÔNG ẩn menu nữa
  const isSeller = user?.role === "seller";

  const handleSellerClick = (path: string) => {
    if (!user) {
      alert("⚠️ Vui lòng đăng nhập trước!");
      return router.push("/login");
    }
    if (!isSeller) {
      return router.push("/seller/register"); // 👉 Trang đăng ký người bán
    }
    router.push(path); // 👉 Nếu là seller thật → cho vào
  };

  return (
    <div className="bg-white mx-3 mt-6 p-5 rounded-2xl shadow-lg border border-gray-100 mb-6">
      
      {/* 👤 Menu khách hàng */}
      <div className="grid grid-cols-4 gap-4 text-center">
        {customerMenuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => router.push(item.path)}
            className="flex flex-col items-center text-gray-700 hover:text-orange-500 transition"
          >
            <div className="p-3 bg-gray-100 rounded-full shadow-sm mb-1">
              {item.icon}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      {/* 🛒 Menu Người Bán — luôn hiển thị */}
      <div className="border-t border-gray-200 my-4"></div>
      <p className="text-gray-500 text-sm mb-3 font-semibold"> 🛒 Kênh Người Bán</p>
      <div className="grid grid-cols-4 gap-4 text-center">
        {sellerMenuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleSellerClick(item.path)}
            className="flex flex-col items-center text-gray-700 hover:text-green-600 transition"
          >
            <div className="p-3 bg-green-100 rounded-full shadow-sm mb-1">
              {item.icon}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      {/* 🔻 Logout */}
      {user && <div className="border-t border-gray-200 my-4"></div>}

      {user && (
        <button
          onClick={logout}
          className="flex items-center gap-2 py-2 text-white bg-red-500 hover:bg-red-600 
          rounded-lg justify-center w-full font-medium shadow-md transition"
        >
          <LogOut size={18} /> Đăng xuất
        </button>
      )}
    </div>
  );
}

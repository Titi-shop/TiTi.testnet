"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

/**
 * 🖼️ BannerCarousel - Slider quảng cáo tự động
 * ✅ Hoạt động với ảnh từ thư mục public/banners/
 * ✅ Không cần API riêng nếu bạn muốn đọc ảnh tĩnh
 */
export default function BannerCarousel() {
  // Bạn có thể đổi danh sách ảnh ở đây
  const [banners, setBanners] = useState([
    { id: 1, image: "/banners/banner1.jpg", link: "#" },
    { id: 2, image: "/banners/banner2.jpg", link: "#" },
    { id: 3, image: "/banners/banner3.jpg", link: "#" },
  ]);

  // Nếu bạn có API riêng /api/banners thì bật phần dưới:
  // useEffect(() => {
  //   fetch("/api/banners")
  //     .then((res) => res.json())
  //     .then(setBanners)
  //     .catch((err) => console.error("Lỗi tải banner:", err));
  // }, []);

  return (
    <div className="w-full overflow-hidden rounded-xl shadow-md bg-white">
      <Swiper
        modules={[Pagination, Autoplay]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        loop
        className="h-48 md:h-60"
      >
        {banners.map((b) => (
          <SwiperSlide key={b.id}>
            <a href={b.link}>
              <img
                src={b.image}
                alt={`Banner ${b.id}`}
                className="w-full h-full object-cover"
              />
            </a>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

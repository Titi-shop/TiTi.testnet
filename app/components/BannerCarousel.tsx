"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

/**
 * 🖼️ BannerCarousel - Slider quảng cáo tự động
 * ✅ Chạy tốt trên Next.js 15.5.4 + Edge runtime
 */
export default function BannerCarousel() {
  const [banners, setBanners] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/banners")
      .then((res) => res.json())
      .then(setBanners)
      .catch((err) => console.error("Lỗi tải banner:", err));
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-xl shadow-md bg-white">
      <Swiper
        modules={[Pagination, Autoplay]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        loop
        className="h-48 md:h-60"
      >
        {banners.map((b) => (
          <SwiperSlide key={b.id}>
            <a href={b.link}>
              <img
                src={b.image}
                alt={b.title}
                className="w-full h-full object-cover"
              />
            </a>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

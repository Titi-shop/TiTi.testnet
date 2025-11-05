"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

export default function BannerCarousel() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🚀 Gọi API để lấy danh sách banner
  useEffect(() => {
    fetch("/api/banners")
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải dữ liệu banner");
        return res.json();
      })
      .then((data) => setBanners(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("❌ Lỗi tải banner:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  // 🧩 Hiển thị trạng thái tải hoặc lỗi
  if (loading)
    return (
      <div className="text-center py-10 text-gray-400">
        ⏳ Đang tải banner...
      </div>
    );

  if (error)
    return (
      <div className="text-center py-10 text-red-500">
        ⚠️ Lỗi tải banner: {error}
      </div>
    );

  if (banners.length === 0)
    return (
      <div className="text-center py-10 text-gray-400">
        🚫 Không có banner để hiển thị.
      </div>
    );

  // 🖼 Hiển thị Swiper Carousel
  return (
    <div className="w-full overflow-hidden rounded-xl shadow-md bg-white">
      <Swiper
        modules={[Pagination, Autoplay]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        loop
        className="h-48 md:h-60 relative"
      >
        {banners.map((b) => (
          <SwiperSlide key={b.id}>
            <a href={b.link} className="relative block">
              <img
                src={b.image}
                alt={b.title || `Banner ${b.id}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Hiển thị title của banner */}
              {b.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-2 text-sm md:text-base">
                  {b.title}
                </div>
              )}
            </a>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

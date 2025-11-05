"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

export default function BannerCarousel() {
  const [banners, setBanners] = useState([
    { id: 1, image: "/banners/banner1.jpg", link: "#" },
    { id: 2, image: "/banners/banner2.jpg", link: "#" },
    { id: 3, image: "/banners/banner3.jpg", link: "#" },
  ]);

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

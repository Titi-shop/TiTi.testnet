"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

export default function BannerCarousel() {
  const [banners, setBanners] = useState([
    {
      id: 1,
      image: "/banners/d506c80c-c548-41ce-b0e2-79dafa6d2de4.jfif",
      link: "#",
    },
    {
      id: 2,
      image: "/banners/c60da310-1c35-4598-9ddb-e1457741a262.jfif",
      link: "#",
    },
    {
      id: 3,
      image: "/banners/b42db293-7ba1-41a2-9bd1-7373ca643943.jfif",
      link: "#",
    },
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

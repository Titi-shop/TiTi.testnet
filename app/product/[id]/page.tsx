{/* 🖼️ Ảnh sản phẩm */}
<div className="relative w-full bg-white flex flex-col items-center justify-center mt-14 overflow-hidden">
  {validImages.length > 0 ? (
    <>
      {/* Slider chính */}
      <div
        className="w-full h-80 flex transition-transform duration-500 ease-in-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          width: `${validImages.length * 100}%`,
        }}
        onDoubleClick={() => setShowLightbox(true)}
      >
        {validImages.map((img: string, i: number) => (
          <img
            key={i}
            src={img}
            alt={product.name}
            className="w-full h-80 object-contain flex-shrink-0"
          />
        ))}
      </div>

      {/* 🔵 Chấm nhỏ dưới ảnh */}
      <div className="flex justify-center mt-2">
        {validImages.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2.5 h-2.5 mx-1 rounded-full cursor-pointer transition-all duration-300 ${
              currentIndex === i ? "bg-blue-600 scale-110" : "bg-gray-300"
            }`}
          ></div>
        ))}
      </div>
    </>
  ) : (
    <div className="h-72 flex items-center justify-center text-gray-400">
      {translate("no_image")}
    </div>
  )}
</div>

{/* 🔍 Khung ảnh zoom khi chạm 2 lần */}
{showLightbox && (
  <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
    <button
      onClick={() => setShowLightbox(false)}
      className="absolute top-4 right-4 text-white text-3xl"
    >
      ✕
    </button>

    <div className="relative flex items-center justify-center">
      <img
        src={validImages[currentIndex]}
        alt="Zoomed"
        className="w-[70%] h-[70%] object-contain rounded-md shadow-lg"
      />
      {/* Nút chuyển ảnh */}
      {validImages.length > 1 && (
        <>
          <button
            onClick={() =>
              setCurrentIndex((prev) =>
                prev === 0 ? validImages.length - 1 : prev - 1
              )
            }
            className="absolute left-4 text-white text-4xl select-none"
          >
            ‹
          </button>
          <button
            onClick={() =>
              setCurrentIndex((prev) => (prev + 1) % validImages.length)
            }
            className="absolute right-4 text-white text-4xl select-none"
          >
            ›
          </button>
        </>
      )}
    </div>
  </div>
)}

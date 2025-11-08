// app/category/[slug]/page.tsx
import Image from "next/image";

// 🧩 Kiểu dữ liệu sản phẩm
interface Product {
  id: number;
  name: string;
  price: number;
  thumbnail: string;
}

// 🧩 Nhận slug từ URL
interface Props {
  params: {
    slug: string;
  };
}

// ✅ Tạo metadata động cho SEO
export async function generateMetadata({ params }: Props) {
  const categoryName = params.slug.replace(/-/g, " ");
  return {
    title: `${categoryName} | TiTi Mall`,
    description: `Khám phá các sản phẩm thuộc danh mục ${categoryName} tại TiTi Mall.`,
  };
}

// ✅ Trang chính hiển thị sản phẩm
export default async function CategoryPage({ params }: Props) {
  const { slug } = params;

  // 🧠 Giả sử bạn có API lấy sản phẩm theo category slug
  const res = await fetch(`https://api.titimall.vn/products?category=${slug}`, {
    next: { revalidate: 60 }, // Cache 1 phút để tối ưu SSR
  });

  if (!res.ok) {
    throw new Error("Không thể tải dữ liệu sản phẩm");
  }

  const products: Product[] = await res.json();

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-semibold capitalize mb-6">
        {slug.replace(/-/g, " ")}
      </h1>

      {products.length === 0 ? (
        <p>Hiện chưa có sản phẩm trong danh mục này.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((item) => (
            <div
              key={item.id}
              className="border rounded-2xl shadow-sm hover:shadow-md transition p-3"
            >
              <Image
                src={item.thumbnail}
                alt={item.name}
                width={300}
                height={300}
                className="w-full h-auto rounded-lg object-cover"
              />
              <h2 className="mt-2 text-sm font-medium">{item.name}</h2>
              <p className="text-red-600 font-semibold mt-1">
                {item.price.toLocaleString("vi-VN")} ₫
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

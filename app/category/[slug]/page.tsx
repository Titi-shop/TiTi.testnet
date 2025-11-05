// 📁 app/category/[slug]/page.tsx
import { notFound } from "next/navigation";

export const metadata = {
  title: "Danh mục sản phẩm | TiTi Mall",
};

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // Giả lập tên danh mục hiển thị đẹp hơn
  const categories: Record<string, string> = {
    pet: "Thú cưng 🐶",
    electronics: "Điện tử 🔌",
    fashion: "Thời trang 👗",
  };

  const title = categories[slug];

  if (!title) return notFound(); // Nếu slug không đúng -> 404

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-center text-blue-600 mb-4">
        🛍️ Danh mục: {title}
      </h1>
      <p className="text-center text-gray-600">
        Đây là trang tạm thời cho danh mục <b>{slug}</b>.<br />
        Bạn có thể hiển thị danh sách sản phẩm thật tại đây sau này.
      </p>
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  finalPrice: number;
  images: string[];
}

interface Props {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: Props) {
  const categoryName = params.slug.replace(/-/g, " ");
  return {
    title: `${categoryName} | TiTi Mall`,
    description: `Khám phá các sản phẩm trong danh mục ${categoryName}.`,
  };
}

async function getProductsByCategory(categoryId: string) {
  try {
    const res = await fetch(
      `https://api.titimall.vn/api/products?category=${categoryId}`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = params;

  const products = await getProductsByCategory(slug);

  return (
    <div className="px-6 py-8">
      <Link href="/categories" className="text-orange-600 font-semibold mb-4 inline-block">
        ← Quay lại
      </Link>

      <h1 className="text-2xl font-semibold capitalize mb-6">
        Danh mục: {slug}
      </h1>

      {products.length === 0 ? (
        <p className="text-gray-500">Hiện chưa có sản phẩm trong danh mục này.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((item: Product) => (
            <div key={item.id} className="border rounded-xl p-3 bg-white shadow-sm">
              <Image
                src={item.images?.[0] || "/placeholder.png"}
                alt={item.name}
                width={300}
                height={300}
                className="w-full h-auto rounded-lg object-cover"
              />
              <h2 className="mt-2 text-sm font-medium line-clamp-2">{item.name}</h2>
              <p className="text-red-600 font-semibold">{item.finalPrice.toLocaleString()} ₫</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

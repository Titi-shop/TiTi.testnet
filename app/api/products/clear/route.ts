// TẠM DÙNG – XOÁ TẤT CẢ SẢN PHẨM
export async function POST() {
  await writeProducts([]); // ghi file rỗng
  return NextResponse.json({ success: true });
}

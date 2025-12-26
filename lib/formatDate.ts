/** ===========================================
 * 📅 Xử lý ngày tháng an toàn cho toàn hệ thống
 * ===========================================
 */

/** Kiểm tra 1 chuỗi ngày có hợp lệ không */
export function isValidDate(dateString: string): boolean {
  const d = new Date(dateString);
  return !isNaN(d.getTime());
}

/** Chuyển yyyy-MM-dd → ISO format */
export function toISO(dateString: string | null): string | null {
  if (!dateString) return null;

  // yyyy-MM-dd → ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString + "T00:00:00Z").toISOString();
  }

  // Đã là date hợp lệ → ISO
  if (isValidDate(dateString)) {
    return new Date(dateString).toISOString();
  }

  return null;
}

/** Chuẩn hóa các trường ngày của object có saleStart / saleEnd */
export function normalizeSaleDates<
  T extends { saleStart?: string | null; saleEnd?: string | null }
>(product: T): T {
  return {
    ...product,
    saleStart: toISO(product.saleStart ?? null),
    saleEnd: toISO(product.saleEnd ?? null),
  };
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        padding: "60px 20px",
        textAlign: "center",
        background: "#0d0d0d",
        color: "#fff",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: 48, fontWeight: "bold" }}>
        404 – Không tìm thấy trang
      </h1>

      <p style={{ color: "#bbb", marginBottom: 30 }}>
        Trang bạn tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>

      <Link
        href="/"
        style={{
          display: "inline-block",
          padding: "12px 24px",
          backgroundColor: "#f97316",
          color: "#fff",
          borderRadius: "8px",
          textDecoration: "none",
        }}
      >
        ← Về trang chủ
      </Link>
    </div>
  );
}

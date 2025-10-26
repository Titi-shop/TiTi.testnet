"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PiLoginPage() {
  const [isPiBrowser, setIsPiBrowser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginStatus, setLoginStatus] = useState("checking");
  const router = useRouter();

  // ✅ KIỂM TRA VÀ KHỞI TẠO PI SDK
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Kiểm tra môi trường Pi Browser
        if (typeof window !== "undefined" && window.Pi) {
          console.log("🔍 Pi Browser detected, initializing SDK...");
          
          // Khởi tạo Pi SDK
          await window.Pi.init({ 
            version: "2.0", 
            sandbox: process.env.NODE_ENV === "development" // Sandbox trong development
          });
          
          setIsPiBrowser(true);
          console.log("✅ Pi SDK initialized successfully");

          // ✅ KIỂM TRA ĐĂNG NHẬP HIỆN TẠI
          const savedUser = localStorage.getItem("pi_user");
          const isLoggedIn = localStorage.getItem("titi_is_logged_in");

          if (savedUser && isLoggedIn === "true") {
            try {
              const userData = JSON.parse(savedUser);
              const username = userData?.user?.username;
              
              console.log("✅ User already logged in:", username);
              setLoginStatus("already_logged_in");

              // 🔄 TỰ ĐỘNG REDIRECT THEO ROLE
              setTimeout(() => {
                if (username === "nguyenminhduc1991111") {
                  router.replace("/seller");
                } else {
                  router.replace("/customer");
                }
              }, 1000);

            } catch (parseError) {
              console.error("❌ Error parsing user data:", parseError);
              // Xóa data lỗi
              localStorage.removeItem("pi_user");
              localStorage.removeItem("titi_is_logged_in");
            }
          } else {
            setLoginStatus("ready_to_login");
          }

        } else {
          console.log("❌ Pi Browser not detected");
          setLoginStatus("pi_browser_required");
        }

      } catch (error) {
        console.error("❌ Pi SDK initialization failed:", error);
        setLoginStatus("sdk_error");
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [router]);

  // ✅ XỬ LÝ ĐĂNG NHẬP
  const handleLogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở trang này bằng Pi Browser.");
      return;
    }

    setIsLoading(true);
    setLoginStatus("logging_in");

    try {
      console.log("🚀 Starting Pi authentication...");

      // Scope cần thiết cho app e-commerce
      const scopes = ["username", "payments", "wallet_address"];
      
      // Callback cho incomplete payments (nếu có)
      const onIncompletePaymentFound = (payment) => {
        console.log("💰 Incomplete payment found:", payment);
        // Có thể xử lý payment pending ở đây
      };

      // Gọi Pi authenticate
      const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
      
      console.log("✅ Authentication successful:", authResult);

      // ✅ KIỂM TRA DỮ LIỆU NHẬN ĐƯỢC
      if (!authResult.user || !authResult.user.uid) {
        throw new Error("Không nhận được thông tin user từ Pi Network");
      }

      // ✅ LƯU THÔNG TIN USER ĐẦY ĐỦ
      const userData = {
        user: {
          uid: authResult.user.uid,
          username: authResult.user.username,
          walletAddress: authResult.user.walletAddress,
        },
        accessToken: authResult.accessToken,
        scopes: authResult.scopes,
        loginTime: new Date().toISOString()
      };

      // Lưu vào localStorage
      localStorage.setItem("pi_user", JSON.stringify(userData));
      localStorage.setItem("titi_is_logged_in", "true");
      localStorage.setItem("titi_username", authResult.user.username);
      localStorage.setItem("titi_user_id", authResult.user.uid);
      localStorage.setItem("titi_wallet", authResult.user.walletAddress);
      localStorage.setItem("titi_login_time", new Date().toISOString());

      console.log("💾 User data saved:", {
        username: authResult.user.username,
        uid: authResult.user.uid,
        wallet: authResult.user.walletAddress
      });

      setLoginStatus("login_success");

      // ✅ THÔNG BÁO THÀNH CÔNG VÀ REDIRECT
      const username = authResult.user.username;
      const isSeller = username === "nguyenminhduc1991111";
      
      setTimeout(() => {
        if (isSeller) {
          alert(`🎉 Đăng nhập thành công! Chào Seller ${username} 👑`);
          router.replace("/seller");
        } else {
          alert(`🎉 Đăng nhập thành công! Chào ${username} 🛍️`);
          router.replace("/customer");
        }
      }, 500);

    } catch (error) {
      console.error("❌ Login failed:", error);
      setLoginStatus("login_failed");
      
      // 🔥 XỬ LÝ LỖI CỤ THỂ
      let errorMessage = "Lỗi đăng nhập không xác định";
      
      if (error.message?.includes("user_cancelled")) {
        errorMessage = "Bạn đã hủy đăng nhập";
      } else if (error.message?.includes("network")) {
        errorMessage = "Lỗi kết nối mạng. Vui lòng thử lại";
      } else if (error.error === "user_not_found") {
        errorMessage = "Không tìm thấy thông tin user. Vui lòng thử lại";
      } else {
        errorMessage = error.message || "Lỗi đăng nhập";
      }
      
      alert(`❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ XỬ LÝ LOGOUT (cho testing)
  const handleForceLogout = () => {
    localStorage.removeItem("pi_user");
    localStorage.removeItem("titi_is_logged_in");
    localStorage.removeItem("titi_username");
    localStorage.removeItem("titi_user_id");
    localStorage.removeItem("titi_wallet");
    localStorage.removeItem("titi_login_time");
    
    setLoginStatus("ready_to_login");
    alert("✅ Đã đăng xuất thành công");
  };

  // 🎨 RENDER TRẠNG THÁI
  const renderStatusMessage = () => {
    switch (loginStatus) {
      case "checking":
        return { message: "🔍 Đang kiểm tra Pi Browser...", color: "#007bff" };
      case "pi_browser_required":
        return { message: "⚠️ Vui lòng mở bằng Pi Browser", color: "#dc3545" };
      case "ready_to_login":
        return { message: "✅ Sẵn sàng đăng nhập!", color: "#28a745" };
      case "already_logged_in":
        return { message: "✅ Đã đăng nhập, đang chuyển hướng...", color: "#28a745" };
      case "logging_in":
        return { message: "⏳ Đang đăng nhập với Pi Network...", color: "#ffc107" };
      case "login_success":
        return { message: "🎉 Đăng nhập thành công!", color: "#28a745" };
      case "login_failed":
        return { message: "❌ Đăng nhập thất bại", color: "#dc3545" };
      case "sdk_error":
        return { message: "⚠️ Lỗi khởi tạo Pi SDK", color: "#dc3545" };
      default:
        return { message: "🔍 Đang kiểm tra...", color: "#6c757d" };
    }
  };

  const status = renderStatusMessage();

  // ⏳ HIỂN THỊ LOADING
  if (isLoading && loginStatus === "checking") {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>⏳</div>
        <p>Đang khởi tạo ứng dụng...</p>
      </div>
    );
  }

  return (
    <main style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>🛍️ Titi Store</h1>
        <h2 style={styles.subtitle}>Đăng nhập bằng Pi Network</h2>
      </div>

      {/* STATUS MESSAGE */}
      <div style={{
        ...styles.statusMessage,
        background: status.color + "20",
        border: `1px solid ${status.color}`
      }}>
        {status.message}
      </div>

      {/* PI BROWSER WARNING */}
      {!isPiBrowser && (
        <div style={styles.warningBox}>
          <h3>📱 Cần Pi Browser</h3>
          <p>Vui lòng mở <strong>Pi Browser</strong> và truy cập:</p>
          <code style={styles.url}>muasam.titi.onl</code>
          <p style={styles.note}>
            Ứng dụng chỉ hoạt động trong Pi Browser
          </p>
        </div>
      )}

      {/* LOGIN BUTTON */}
      {isPiBrowser && loginStatus === "ready_to_login" && (
        <button
          onClick={handleLogin}
          disabled={isLoading}
          style={{
            ...styles.loginButton,
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? "not-allowed" : "pointer"
          }}
        >
          {isLoading ? (
            <>
              <span style={styles.spinnerSmall}>⏳</span>
              Đang xử lý...
            </>
          ) : (
            <>
              <span style={styles.piIcon}>π</span>
              Đăng nhập với Pi Network
            </>
          )}
        </button>
      )}

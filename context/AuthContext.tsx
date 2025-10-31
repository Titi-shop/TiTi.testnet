// ✅ Hàm pilogin - cập nhật cho SDK mới
  const pilogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở trong Pi Browser");
      return;
    }

    try {
      const scopes = ["username", "payments"];
      const onIncompletePayment = (payment: any) => {
        console.log("⚠️ Payment chưa hoàn tất:", payment);
      };

      // 👉 SDK mới không trả promise nữa, phải dùng callback
      await new Promise<void>((resolve, reject) => {
        window.Pi.authenticate(scopes, onIncompletePayment, (authResult: any) => {
          if (!authResult || authResult.error) {
            console.error("❌ Lỗi xác thực:", authResult?.error);
            reject(authResult?.error || "Đăng nhập thất bại");
          } else {
            const username = authResult.user?.username || "guest";
            const accessToken = authResult.accessToken || "";

            const piUser: PiUser = { username, accessToken };
            setUser(piUser);
            localStorage.setItem("pi_user", JSON.stringify(authResult));
            localStorage.setItem("titi_is_logged_in", "true");

            console.log("✅ Đăng nhập thành công:", piUser);
            resolve();
          }
        });
      });
    } catch (err) {
      console.error("❌ Lỗi đăng nhập:", err);
      alert("Đăng nhập thất bại, vui lòng thử lại.");
    }
  };

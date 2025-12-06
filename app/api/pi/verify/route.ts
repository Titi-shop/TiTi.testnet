export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "missing_access_token" },
        { status: 400 }
      );
    }

    const piRes = await fetch("https://api.minepi.com/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!piRes.ok) {
      return NextResponse.json(
        { success: false, error: "invalid_access_token" },
        { status: 401 }
      );
    }

    const data = await piRes.json();

    const user = {
      username: data.username,
      uid: data.uid || `user_${data.username}`,
      wallet_address: data.wallet_address ?? null,
      created_at: data.created_at ?? new Date().toISOString(),
      roles: data.roles ?? [],
    };

    const cookieValue = encodeUser(user);

    const res = NextResponse.json({ success: true, user });

    // 🔥 COOKIE CHUẨN PI BROWSER
    res.cookies.set({
      name: COOKIE_NAME,
      value: cookieValue,
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: MAX_AGE,
      path: "/",
      // ⭐ THÊM DÒNG NÀY RẤT QUAN TRỌNG
      domain: "titi.onl"
    });

    return res;
  } catch (err) {
    console.error("❌ PI LOGIN ERROR:", err);
    return NextResponse.json(
      { success: false, error: "server_error" },
      { status: 500 }
    );
  }
}

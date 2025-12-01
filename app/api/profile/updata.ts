import { validateEmail } from "@/utils/validateEmail";

export async function POST(req: Request) {
  const body = await req.json();
  const { email } = body;

  const check = validateEmail(email);
  if (!check.valid) {
    return Response.json(
      { success: false, error: check.message },
      { status: 400 }
    );
  }

  // tiếp tục lưu vào database...
}

import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        icon: true,
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("❌ Lỗi API categories:", error);
    return NextResponse.json([], { status: 500 });
  }
}

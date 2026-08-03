import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    id: "00000000-0000-0000-0000-000000000000",
    name: "Admin",
    credits: 999,
  });
}

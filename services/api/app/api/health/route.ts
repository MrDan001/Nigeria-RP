import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "nigeria-rp-api",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
}

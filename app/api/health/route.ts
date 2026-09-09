import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, service: "rsd-bot", timestamp: new Date().toISOString() });
}

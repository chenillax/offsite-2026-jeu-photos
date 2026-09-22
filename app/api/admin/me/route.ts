// GET /api/admin/me — l'appelant est-il connecté en admin ?
import { NextRequest, NextResponse } from "next/server";
import { isAdminReq } from "@/lib/admin";

export async function GET(req: NextRequest) {
  return NextResponse.json({ authed: isAdminReq(req) });
}

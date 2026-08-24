import { NextResponse } from "next/server";

import { destroySession } from "@/lib/auth";

/** Tombol "Keluar" pada menu pengguna mengirim POST ke sini. */
export async function POST(request: Request) {
  await destroySession();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}

// app/auth/callback/route.js
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();

    // 1. Tukar kode otorisasi Google dengan sesi user
    const { error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code);

    // 2. Jika gagal, kembalikan ke halaman login
    if (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.redirect(`${origin}/login`);
    }

    // 3. Jika berhasil, LANGSUNG arahkan ke halaman utama (Home)
    // Tidak perlu lagi membuat chat "New Chat" di sini
    return NextResponse.redirect(`${origin}/`);
  }

  // Jika tidak ada code di URL, kembalikan ke login
  return NextResponse.redirect(`${origin}/login`);
}

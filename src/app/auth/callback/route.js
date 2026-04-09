// app/auth/callback/route.js
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();

    const { data: sessionData, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (sessionError || !sessionData?.user) {
      console.error("Session error:", sessionError);
      return NextResponse.redirect(`${origin}/login`);
    }

    const user = sessionData.user;

    const { data: chat, error } = await supabase
      .from("chats")
      .insert({
        user_id: user.id,
        title: "New Chat",
      })
      .select()
      .single();

    if (error || !chat) {
      console.error("Insert error:", error);
      return new Response("INSERT GAGAL", { status: 500 });
    }

    return NextResponse.redirect(`${origin}/chat/${chat.id}`);
  }

  return NextResponse.redirect(`${origin}/login`);
}

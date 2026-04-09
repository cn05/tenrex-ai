// src/app/chat/[id]/page.jsx
import { AppSidebar } from "@/components/app-sidebar";
import ChatUI from "@/components/chat-ui";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { createClient } from "@/lib/server";
import { notFound } from "next/navigation";

export default async function Page({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return notFound();

  // 1. Cek kepemilikan chat yang sedang dibuka
  const { data: chat } = await supabase
    .from("chats")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!chat) return notFound();

  // 2. Ambil isi pesan dari chat yang sedang dibuka
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chat.id)
    .order("created_at", { ascending: true });

  // 3. 🔥 TAMBAH INI: Ambil SEMUA riwayat chat user untuk ditampilkan di Sidebar
  const { data: chatHistory } = await supabase
    .from("chats")
    .select("id, title")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false }); // Urutkan dari yang terbaru

  return (
    <SidebarProvider>
      <AppSidebar chatHistory={chatHistory || []} />

      {/* 🔥 UBAH 1: Gunakan h-[100dvh] (Dynamic Viewport) khusus untuk HP */}
      <SidebarInset className="flex flex-col h-[100dvh] overflow-hidden w-full">
        {/* 🔥 UBAH 2: Top Bar Diberi shrink-0 agar tidak pernah menyusut atau tertutup */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="font-semibold">Tenrex AI</span>
        </header>

        {/* 🔥 UBAH 3: Tambahkan min-h-0 dan flex flex-col agar area chat tidak bocor ke bawah layar */}
        <main className="flex-1 min-h-0 relative bg-background flex flex-col w-full">
          <ChatUI
            chatId={chat.id}
            userId={user.id}
            initialMessages={messages}
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

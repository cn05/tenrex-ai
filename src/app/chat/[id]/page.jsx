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

  console.log("USER ID:", user?.id);
  console.log("PARAM ID:", id);

  if (!user) return notFound();

  // 🔒 cek ownership
  const { data: chat } = await supabase
    .from("chats")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!chat) return notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chat.id)
    .order("created_at", { ascending: true });
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <span>Tenrex AI</span>
        </header>
        <div>
          {messages.map((m) => (
            <div key={m.id}>
              <b>{m.role}:</b> {m.content}
            </div>
          ))}

          <ChatUI />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

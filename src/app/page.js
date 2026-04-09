import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import HomeChat from "@/components/home-chat";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect ke halaman login jika belum autentikasi
  if (!user) {
    redirect("/login");
  }

  // Ambil history chat untuk ditampilkan di sidebar
  const { data: chatHistory } = await supabase
    .from("chats")
    .select("id, title")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <SidebarProvider>
      <AppSidebar chatHistory={chatHistory || []} />

      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span>Tenrex AI</span>
        </header>

        {/* Area utama untuk memulai chat baru */}
        <main className="flex-1 relative bg-background flex flex-col items-center justify-center p-4">
          <HomeChat userId={user.id} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

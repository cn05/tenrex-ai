"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";

export default function HomeChat({ userId }) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleStartChat = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);

    try {
      // 1. Buat record chat baru di tabel 'chats'
      const { data: chat, error: chatError } = await supabase
        .from("chats")
        .insert([{ user_id: userId, title: "Menganalisis..." }])
        .select()
        .single();

      if (chatError) throw chatError;

      // 2. Panggil API chat untuk memproses pesan pertama ke AI
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: chat.id,
          userId: userId,
          message: input,
          isFirstMessage: true, // Akan memicu backend untuk merename judul chat
        }),
      });

      // 3. Refresh router agar sidebar menarik data terbaru, lalu arahkan ke chat room
      router.refresh();
      router.push(`/chat/${chat.id}`);
    } catch (error) {
      console.error("Gagal membuat chat:", error);
      alert("Gagal memulai obrolan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col gap-8 items-center text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Apa yang ingin Anda riset hari ini?
      </h1>
      <p className="text-muted-foreground text-lg">
        Tenrex AI siap membantu analisis pasar, kompetitor, dan tren bisnis
        Anda.
      </p>

      <form
        onSubmit={handleStartChat}
        className="w-full flex gap-2 relative mt-4"
      >
        <input
          type="text"
          className="flex-1 rounded-2xl border bg-background pl-6 pr-32 py-4 text-base shadow-sm outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Contoh: Buatkan analisis tren pasar untuk bisnis kopi susu..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="absolute right-2 top-2 bottom-2 rounded-xl bg-primary px-6 text-primary-foreground font-medium disabled:opacity-50 transition-all hover:opacity-90"
        >
          {isLoading ? "Menganalisis..." : "Kirim"}
        </button>
      </form>
    </div>
  );
}

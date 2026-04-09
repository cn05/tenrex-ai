import { createClient } from "@/lib/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { chatId, userId, message, isFirstMessage } = await req.json();

    if (!chatId || !message) {
      return new Response(JSON.stringify({ error: "Bad Request" }), {
        status: 400,
      });
    }

    // 1. Simpan pesan User ke tabel messages
    await supabase
      .from("messages")
      .insert([{ chat_id: chatId, role: "user", content: message }]);

    // 2. Rename Chat jika ini pesan pertama
    if (isFirstMessage) {
      const title =
        message.length > 35 ? message.substring(0, 35) + "..." : message;
      await supabase.from("chats").update({ title: title }).eq("id", chatId);
    }

    // 3. Ambil riwayat percakapan sebelumnya
    const { data: previousMessages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(10);

    const systemPrompt = `Anda adalah Analis Riset Pasar Senior yang bekerja untuk Tenrex AI.
    Tugas Anda adalah memberikan insight pasar, analisis kompetitor, tren industri, dan profil audiens yang akurat, terstruktur, dan berbasis data. Format jawaban dengan markdown agar mudah dibaca.`;

    const openAiMessages = [{ role: "system", content: systemPrompt }];

    if (previousMessages) {
      previousMessages.forEach((msg) => {
        openAiMessages.push({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        });
      });
    } else {
      openAiMessages.push({ role: "user", content: message });
    }

    // 4. Panggil API OpenAI DENGAN STREAMING AKTIF
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: openAiMessages,
      temperature: 0.7,
      stream: true, // 🔥 Ini kuncinya!
    });

    // 5. Buat ReadableStream untuk mengirim data perlahan ke frontend
    const stream = new ReadableStream({
      async start(controller) {
        let fullAiResponse = "";
        const encoder = new TextEncoder();

        try {
          // Loop ini akan berjalan setiap kali OpenAI mengirim potongan kata baru
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              fullAiResponse += text;
              // Kirim potongan teks ke frontend
              controller.enqueue(encoder.encode(text));
            }
          }

          // Setelah streaming selesai, simpan pesan UTUH AI tersebut ke Database
          await supabase
            .from("messages")
            .insert([
              { chat_id: chatId, role: "assistant", content: fullAiResponse },
            ]);
        } catch (error) {
          console.error("Stream error:", error);
        } finally {
          controller.close(); // Tutup aliran koneksi
        }
      },
    });

    // Kembalikan stream ke client, bukan JSON!
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("API Chat Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

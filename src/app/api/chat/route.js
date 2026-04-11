import { createClient } from "@/lib/server";
import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Import fungsi asli dari folder tools Anda nanti di sini:
import { getTavilyNews } from "@/lib/tools/tavily-news";
import { getBinancePrice } from "@/lib/tools/binance-crypto";
import { getFearAndGreed } from "@/lib/tools/alternative-me";
import { getStockData } from "@/lib/tools/finnhub-stocks";
import { getMacroData } from "@/lib/tools/alpha-vantage-macro";
import { calculateTechnical } from "@/lib/tools/technical-calc";

export async function POST(req) {
  try {
    const supabase = await createClient();

    // 1. Cek Autentikasi
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { chatId, message, isFirstMessage } = await req.json();

    // 2. Simpan pesan User & Rename Chat
    await supabase
      .from("messages")
      .insert([{ chat_id: chatId, role: "user", content: message }]);
    if (isFirstMessage) {
      const title =
        message.length > 35 ? message.substring(0, 35) + "..." : message;
      await supabase.from("chats").update({ title: title }).eq("id", chatId);
    }

    // 3. Ambil riwayat chat
    const { data: previousMessages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(10);

    const coreMessages = previousMessages
      ? previousMessages.map((msg) => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        }))
      : [{ role: "user", content: message }];

    // 4. System Prompt Utama (Sang Manajer)
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const systemPrompt = `You are Tenrex AI, an Enterprise-grade Global Financial Market Analyst.
Today is **${today}**.
Your task is to research the market using your available "Tools/Staff" before answering the user's question.

STRICT RULES:
1. NEVER FABRICATE DATA. If the user asks for price, sentiment, fundamentals, or news, YOU MUST call the appropriate tools!
2. Answer straight to the point using a neat structure (use Headings, Bullet points, and Bold text).
3. Synthesize all data from the tools into one professional report, like a Wall Street analyst`;

    // ==========================================
    // 5. ORKESTRASI 6 STAF DENGAN VERCEL AI
    // ==========================================
    const result = streamText({
      model: openai("gpt-4o", { compatibility: "strict" }), // Sangat disarankan pakai gpt-4o atau gpt-4-turbo untuk handle 6 tools sekaligus
      system: systemPrompt,
      messages: coreMessages,
      maxSteps: 6, // Mengizinkan AI memanggil hingga 6 staf sebelum merangkum jawaban
      tools: {
        // --- STAF 1: TAVILY ---
        tavilyNews: tool({
          description:
            "Searches for the latest news, market sentiment, or articles.",
          parameters: z.object({
            query: z.string(), // Hapus .describe() yang bikin error
          }),
          execute: async ({ query }) => {
            return await getTavilyNews(query);
          },
        }),

        // --- STAF 2: BINANCE ---
        binanceCrypto: tool({
          description:
            "Fetches live price, volume, and 24-hour changes for Cryptocurrency assets.",
          parameters: z.object({
            symbol: z.string(),
          }),
          execute: async ({ symbol }) => {
            // Pastikan nama fungsinya sesuai dengan yang lu import ya
            return await getBinancePrice(symbol);
          },
        }),

        // --- STAF 3: SENTIMEN (FIKSASI ERROR OBJECT KOSONG) ---
        cryptoSentiment: tool({
          description:
            "Fetches the Fear & Greed Index to gauge current market psychology.",
          // 🔥 KUNCI: Kasih parameter dummy biar nggak dikirim sebagai object kosong ke OpenAI
          parameters: z.object({
            dummyTrigger: z.boolean().optional(),
          }),
          execute: async () => {
            return await getFearAndGreed();
          },
        }),

        // --- STAF 4: FINNHUB ---
        stockMarket: tool({
          description: "Fetches live global stock prices or fundamentals.",
          parameters: z.object({
            ticker: z.string(),
            dataType: z.enum(["price", "fundamental"]),
          }),
          execute: async ({ ticker, dataType }) => {
            return await getStockData(ticker, dataType);
          },
        }),

        // --- STAF 5: ALPHA VANTAGE ---
        macroForex: tool({
          description:
            "Fetches Forex exchange rates, Commodity prices, and macroeconomic indicators.",
          parameters: z.object({
            assetType: z.enum(["forex", "commodity", "economic_indicator"]),
            symbolOrIndicator: z.string(),
          }),
          execute: async ({ assetType, symbolOrIndicator }) => {
            return await getMacroData(assetType, symbolOrIndicator);
          },
        }),

        // --- STAF 6: TECHNICAL ENGINE ---
        technicalEngine: tool({
          description:
            "Calculates mathematical technical indicators (RSI, MACD, Moving Average).",
          parameters: z.object({
            assetSymbol: z.string(),
            indicator: z.enum(["RSI", "MACD", "MA"]),
            timeframe: z.string(),
          }),
          execute: async ({ assetSymbol, indicator, timeframe }) => {
            return await calculateTechnical(assetSymbol, indicator, timeframe);
          },
        }),
      },
      // 6. Simpan hasil akhir ke DB
      onFinish: async ({ text }) => {
        if (text) {
          await supabase
            .from("messages")
            .insert([{ chat_id: chatId, role: "assistant", content: text }]);
        }
      },
    });

    // 7. Streaming Response
    return new Response(result.textStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

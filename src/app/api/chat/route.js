import { createClient } from "@/lib/server";
import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Import fungsi asli dari folder tools Anda nanti di sini:
import { getTavilyNews } from "@/lib/tools/tavily-news";
// import { getBinancePrice } from "@/lib/tools/binance-crypto";
// import { getFearAndGreed } from "@/lib/tools/alternative-me";
// import { getStockData } from "@/lib/tools/finnhub-stocks";
// import { getMacroData } from "@/lib/tools/alpha-vantage-macro";
// import { calculateTechnical } from "@/lib/tools/technical-calc";

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
      model: openai("gpt-4o"), // Sangat disarankan pakai gpt-4o atau gpt-4-turbo untuk handle 6 tools sekaligus
      system: systemPrompt,
      messages: coreMessages,
      maxSteps: 6, // Mengizinkan AI memanggil hingga 6 staf sebelum merangkum jawaban
      tools: {
        // --- STAF 1: BERITA & NARASI (TAVILY) ---
        tavilyNews: tool({
          description:
            "Searches for the latest news, market sentiment, narratives, or articles related to assets, companies, or macroeconomics.",
          parameters: z.object({
            query: z
              .string()
              .describe(
                "The news topic to search for, must be specific (e.g., 'Bitcoin ETF news today' or 'Apple earnings report').",
              ),
          }),
          execute: async ({ query }) => {
            return await getTavilyNews(query);
          },
        }),

        // --- STAF 2: KRIPTO LIVE (BINANCE) ---
        binanceCrypto: tool({
          description:
            "Fetches live price, volume, and 24-hour changes specifically for Cryptocurrency assets.",
          parameters: z.object({
            symbol: z
              .string()
              .describe("Crypto symbol (e.g., 'BTCUSDT', 'ETHUSDT')."),
          }),
          execute: async ({ symbol }) => {
            // return await getBinancePrice(symbol);
            return `[Simulation] Crypto Live Price ${symbol}`;
          },
        }),

        // --- STAF 3: SENTIMEN PASAR (ALTERNATIVE.ME) ---
        cryptoSentiment: tool({
          description:
            "Fetches the Fear & Greed Index to gauge current market psychology.",
          parameters: z.object({
            // Tidak butuh parameter karena API Fear & Greed bersifat global
          }),
          execute: async () => {
            // return await getFearAndGreed();
            return `[Simulasi] Fear and Greed Index hari ini adalah 75 (Greed).`;
          },
        }),

        // --- STAF 4: SAHAM & FUNDAMENTAL (FINNHUB) ---
        stockMarket: tool({
          description:
            "Fetches live global stock prices (Equities), company metrics (P/E, Market Cap), or fundamentals.",
          parameters: z.object({
            ticker: z
              .string()
              .describe(
                "Company stock ticker (e.g., 'AAPL' for Apple, 'TSLA' for Tesla).",
              ),
            dataType: z
              .enum(["price", "fundamental"])
              .describe("The type of data needed: 'price' or 'fundamental'."),
          }),
          execute: async ({ ticker, dataType }) => {
            // return await getStockData(ticker, dataType);
            return `[Simulasi] Data saham ${ticker} untuk kategori ${dataType}`;
          },
        }),

        // --- STAF 5: MAKROEKONOMI & FOREX (ALPHA VANTAGE) ---
        macroForex: tool({
          description:
            "Fetches Forex exchange rates, Commodity prices (Gold/Oil), and macroeconomic indicators (Inflation, Interest Rates).",
          parameters: z.object({
            assetType: z
              .enum(["forex", "commodity", "economic_indicator"])
              .describe("The type of macro instrument."),
            symbolOrIndicator: z
              .string()
              .describe(
                "Symbol (e.g., 'EURUSD', 'XAUUSD') or indicator name (e.g., 'US CPI', 'Fed Interest Rate').",
              ),
          }),
          execute: async ({ assetType, symbolOrIndicator }) => {
            // return await getMacroData(assetType, symbolOrIndicator);
            return `[Simulasi] Data ${assetType} untuk ${symbolOrIndicator}`;
          },
        }),

        // --- STAF 6: MESIN ANALISIS TEKNIKAL ---
        technicalEngine: tool({
          description:
            "Calculates mathematical technical indicators (RSI, MACD, Moving Average) for all asset types.",
          parameters: z.object({
            assetSymbol: z
              .string()
              .describe(
                "The asset symbol to analyze (e.g., 'BTCUSDT' or 'AAPL').",
              ),
            indicator: z
              .enum(["RSI", "MACD", "MA"])
              .describe("The type of technical indicator to calculate."),
            timeframe: z
              .string()
              .describe("Chart timeframe, e.g., '1d' (daily), '4h' (4 hours)."),
          }),
          execute: async ({ assetSymbol, indicator, timeframe }) => {
            // return await calculateTechnical(assetSymbol, indicator, timeframe);
            return `[Simulasi] Indikator ${indicator} untuk ${assetSymbol} di timeframe ${timeframe}`;
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
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("API Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

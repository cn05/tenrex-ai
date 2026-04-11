import { createClient } from "@/lib/server";
import { smoothStream, stepCountIs, streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import {
  buildChatSystemPrompt,
  filterMessagesForCurrentFocus,
} from "@/lib/chat/request-profile";
import { getToolProgressPayload } from "@/lib/chat/tool-progress";

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

    // 4. System Prompt Utama (Sang Manajer)
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const { requestProfile, systemPrompt } = buildChatSystemPrompt({
      message,
      today,
    });
    const scopedMessages = filterMessagesForCurrentFocus(
      previousMessages || [],
      requestProfile,
    );

    const coreMessages = scopedMessages.length > 0
      ? scopedMessages.map((msg) => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        }))
      : [{ role: "user", content: message }];

    console.log(
      `[Tenrex AI] Request profile: ${requestProfile.label} (${requestProfile.depth})`,
    );

    if (scopedMessages.length !== (previousMessages || []).length) {
      console.log(
        `[Tenrex AI] Context narrowed to preserve current focus asset: ${requestProfile.focusAssets.join(", ")}`,
      );
    }

    // ==========================================
    // 5. ORKESTRASI 6 STAF DENGAN VERCEL AI
    // ==========================================
    const encoder = new TextEncoder();
    let streamController = null;
    let streamClosed = false;

    const pushEvent = (event) => {
      if (!streamController || streamClosed) return;

      streamController.enqueue(
        encoder.encode(`${JSON.stringify(event)}\n`),
      );
    };

    const normalizeToolEvent = (event) => {
      const toolCall = event?.toolCall;
      const toolName = toolCall?.toolName ?? event?.toolName ?? null;
      const input = toolCall?.input ?? event?.input ?? {};
      const fallbackToolCallId = toolName
        ? `${toolName}:${JSON.stringify(input)}`
        : null;

      return {
        toolName,
        toolCallId:
          toolCall?.toolCallId ?? event?.toolCallId ?? fallbackToolCallId,
        input,
      };
    };

    const result = streamText({
      model: openai("gpt-4o", { compatibility: "strict" }), // Sangat disarankan pakai gpt-4o atau gpt-4-turbo untuk handle 6 tools sekaligus
      system: systemPrompt,
      messages: coreMessages,
      stopWhen: stepCountIs(10), // Beri ruang untuk riset multi-step dan satu jawaban final yang lebih terstruktur
      experimental_transform: smoothStream({
        delayInMs: 18,
        chunking: "word",
      }),
      tools: {
        // --- STAF 1: TAVILY ---
        tavilyNews: tool({
          description:
            "Searches for the latest news, market sentiment, or articles.",
          inputSchema: z.object({
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
          inputSchema: z.object({
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
          inputSchema: z.object({
            dummyTrigger: z.boolean().optional(),
          }),
          execute: async () => {
            return await getFearAndGreed();
          },
        }),

        // --- STAF 4: FINNHUB ---
        stockMarket: tool({
          description: "Fetches live global stock prices or fundamentals.",
          inputSchema: z.object({
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
          inputSchema: z.object({
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
            "Calculates technical indicators or a broader chart snapshot including trend, momentum, support, and resistance.",
          inputSchema: z.object({
            assetSymbol: z.string(),
            indicator: z.enum(["RSI", "MACD", "MA", "SNAPSHOT"]),
            timeframe: z.string(),
          }),
          execute: async ({ assetSymbol, indicator, timeframe }) => {
            return await calculateTechnical(assetSymbol, indicator, timeframe);
          },
        }),
      },
      experimental_onToolCallStart: (event) => {
        const { toolName, toolCallId, input } = normalizeToolEvent(event);
        const progress = getToolProgressPayload(toolName, input);

        pushEvent({
          type: "tool-status",
          phase: "start",
          toolCallId,
          ...progress,
        });
      },
      experimental_onToolCallFinish: (event) => {
        const { toolName, toolCallId, input } = normalizeToolEvent(event);
        const progress = getToolProgressPayload(toolName, input);

        pushEvent({
          type: "tool-status",
          phase: event.success ? "done" : "error",
          toolCallId,
          durationMs: event.durationMs,
          ...progress,
        });
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

    const stream = new ReadableStream({
      async start(controller) {
        streamController = controller;

        pushEvent({
          type: "assistant-status",
          phase: "start",
          message: "Tenrex sedang mengoordinasikan riset...",
        });

        try {
          for await (const part of result.fullStream) {
            if (part.type === "text-delta" && part.text) {
              pushEvent({
                type: "text-delta",
                text: part.text,
              });
            }
          }

          pushEvent({
            type: "assistant-status",
            phase: "done",
            message: "Tenrex selesai menyusun jawaban.",
          });
          streamClosed = true;
          controller.close();
        } catch (error) {
          pushEvent({
            type: "assistant-status",
            phase: "error",
            message: "Streaming jawaban terhenti.",
          });
          streamClosed = true;
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

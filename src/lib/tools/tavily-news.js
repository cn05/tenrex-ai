// src/lib/tools/tavily-news.js
import { tavily } from "@tavily/core";

// Inisialisasi SDK Tavily (Pastikan TAVILY_API_KEY ada di .env.local Anda)
const tvly = tavily({
  apiKey: process.env.TAVILY_API_KEY,
});

function getSourceLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function clampSnippet(text, maxLength = 220) {
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

function scoreImpact(text) {
  const loweredText = text.toLowerCase();
  const bullishKeywords = [
    "approval",
    "inflow",
    "buy",
    "accumulation",
    "surge",
    "gain",
    "rally",
    "adoption",
    "launch",
    "record high",
    "partnership",
  ];
  const bearishKeywords = [
    "outflow",
    "selloff",
    "drop",
    "decline",
    "lawsuit",
    "hack",
    "liquidation",
    "recession",
    "ban",
    "investigation",
    "risk-off",
  ];

  const bullishScore = bullishKeywords.reduce(
    (score, keyword) => score + (loweredText.includes(keyword) ? 1 : 0),
    0,
  );
  const bearishScore = bearishKeywords.reduce(
    (score, keyword) => score + (loweredText.includes(keyword) ? 1 : 0),
    0,
  );

  if (bullishScore === bearishScore) return "neutral";
  return bullishScore > bearishScore ? "bullish" : "bearish";
}

function inferTheme(text) {
  const loweredText = text.toLowerCase();

  if (loweredText.includes("etf")) return "ETF flows and institutional access";
  if (loweredText.includes("fed") || loweredText.includes("inflation")) {
    return "macro and rates";
  }
  if (
    loweredText.includes("company") ||
    loweredText.includes("treasury") ||
    loweredText.includes("holding")
  ) {
    return "corporate adoption";
  }
  if (
    loweredText.includes("regulation") ||
    loweredText.includes("sec") ||
    loweredText.includes("law")
  ) {
    return "regulation";
  }

  return "market narrative";
}

/**
 * Fungsi untuk mencari berita dan sentimen pasar terbaru.
 * @param {string} query - Kata kunci pencarian dari AI (misal: "Bitcoin market news today")
 * @returns {Promise<object>} - Structured summary of the most relevant news items
 */
export async function getTavilyNews(query) {
  console.log(`[Staf 1 - Tavily] Menerima tugas mencari: "${query}"`);

  try {
    const searchResponse = await tvly.search(query, {
      searchDepth: "advanced", // Pencarian mendalam
      maxResults: 5, // Ambil 5 artikel terbaik (sweet spot untuk token)
      topic: "news", // Fokus ke portal berita (Abaikan blog biasa)
      days: 3, // Hanya ambil berita dalam 3 hari terakhir (Super Fresh!)
    });

    if (!Array.isArray(searchResponse?.results) || searchResponse.results.length === 0) {
      return {
        ok: true,
        tool: "tavilyNews",
        source: "Tavily",
        query,
        fetchedAt: new Date().toISOString(),
        summary: {
          headline: "No relevant news found in the last 3 days.",
          marketImpact: "neutral",
          dominantThemes: [],
        },
        items: [],
      };
    }

    const normalizedItems = searchResponse.results.slice(0, 4).map((result) => {
      const combinedText = `${result.title} ${result.content || ""}`;
      return {
        title: result.title,
        source: getSourceLabel(result.url),
        url: result.url,
        publishedAt: result.published_date || null,
        snippet: clampSnippet(result.content || result.raw_content || ""),
        impact: scoreImpact(combinedText),
        theme: inferTheme(combinedText),
        score: result.score || null,
      };
    });

    const bullishCount = normalizedItems.filter(
      (item) => item.impact === "bullish",
    ).length;
    const bearishCount = normalizedItems.filter(
      (item) => item.impact === "bearish",
    ).length;
    const dominantThemes = [...new Set(normalizedItems.map((item) => item.theme))];
    const marketImpact =
      bullishCount === bearishCount
        ? "mixed"
        : bullishCount > bearishCount
          ? "bullish tilt"
          : "bearish tilt";

    console.log(
      `[Staf 1 - Tavily] Berhasil menemukan ${searchResponse.results.length} berita.`,
    );

    return {
      ok: true,
      tool: "tavilyNews",
      source: "Tavily",
      query,
      fetchedAt: new Date().toISOString(),
      summary: {
        headline: `Found ${normalizedItems.length} recent items related to "${query}".`,
        marketImpact,
        dominantThemes,
      },
      items: normalizedItems,
      analystNotes: [
        "Use the marketImpact field as a directional clue, not as proof on its own.",
        "Prefer the highest-signal themes over listing every article.",
        "When relevant, explain why the news matters for price, flows, sentiment, or regulation.",
      ],
    };
  } catch (error) {
    console.error("[Staf 1 - Tavily] Gagal menjalankan tugas:", error.message);
    return {
      ok: false,
      source: "Tavily",
      query,
      error:
        "Sorry, the system failed to fetch news from the internet at this time.",
    };
  }
}

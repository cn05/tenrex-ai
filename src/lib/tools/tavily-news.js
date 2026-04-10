// src/lib/tools/tavily-news.js
import { tavily } from "@tavily/core";

// Inisialisasi SDK Tavily (Pastikan TAVILY_API_KEY ada di .env.local Anda)
const tvly = tavily({
  apiKey: process.env.TAVILY_API_KEY,
});

/**
 * Fungsi untuk mencari berita dan sentimen pasar terbaru.
 * @param {string} query - Kata kunci pencarian dari AI (misal: "Bitcoin market news today")
 * @returns {Promise<string>} - String berisi rangkuman artikel yang sudah diformat
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

    if (!searchResponse || searchResponse.results.length === 0) {
      return "Search completed. No relevant news found for this topic within the last 3 days.";
    }

    // Format array JSON dari Tavily menjadi teks laporan yang rapi untuk dibaca GPT
    const formattedNews = searchResponse.results
      .map((result, index) => {
        return `News ${index + 1}:\nTitle: ${result.title}\nSource: ${result.url}\nContent: ${result.content}`;
      })
      .join("\n\n---\n\n");

    console.log(
      `[Staf 1 - Tavily] Berhasil menemukan ${searchResponse.results.length} berita.`,
    );

    return `Here are the latest news search results:\n\n${formattedNews}`;
  } catch (error) {
    console.error("[Staf 1 - Tavily] Gagal menjalankan tugas:", error.message);
    return "Sorry, the system failed to fetch news from the internet at this time. Please proceed with the analysis using other available data.";
  }
}

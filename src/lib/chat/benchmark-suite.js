export const TENREX_EVALUATION_RUBRIC = [
  {
    id: "answer-first",
    label: "Answer First",
    prompt: "Does the first 1-2 sentences directly answer the user's question?",
  },
  {
    id: "relevance",
    label: "Relevance",
    prompt: "Did Tenrex include only the sections and facts that materially help answer the question?",
  },
  {
    id: "signal-density",
    label: "Signal Density",
    prompt: "Did the response surface the highest-signal metrics, catalysts, levels, or implications instead of generic filler?",
  },
  {
    id: "structure",
    label: "Structure",
    prompt: "Was the response easy to scan, logically ordered, and sized appropriately for the question?",
  },
  {
    id: "judgment",
    label: "Judgment",
    prompt: "Did Tenrex synthesize facts into a view, implication, or comparison instead of just listing data?",
  },
  {
    id: "tone",
    label: "Tone",
    prompt: "Did the response sound analyst-grade rather than like a generic assistant or raw research dump?",
  },
];

export const TENREX_BENCHMARK_SUITE = [
  {
    id: "market-update-btc",
    category: "Market Update",
    language: "id",
    prompt:
      "Berapa harga BTC sekarang, bagaimana perubahan 24 jamnya, dan apakah pergerakan hari ini penting atau biasa saja?",
    expectedIntent: "market-update",
    mustSee: [
      "Harga live muncul di pembuka.",
      "Ada interpretasi singkat apakah gerakan 24 jam itu signifikan atau tidak.",
      "Jawaban tidak berubah menjadi laporan panjang.",
    ],
    redFlags: [
      "Pembuka terlalu panjang.",
      "Daftar data mentah tanpa makna.",
      "Terlalu banyak section untuk pertanyaan sederhana.",
    ],
  },
  {
    id: "market-outlook-btc",
    category: "Market Outlook",
    language: "id",
    prompt:
      "Secara taktis 1-2 minggu ke depan, bias Bitcoin sekarang lebih bullish atau bearish? Jelaskan driver utama, level kunci, dan apa yang bisa membatalkan view itu.",
    expectedIntent: "market-outlook",
    mustSee: [
      "Ada bias yang jelas di pembuka.",
      "Level penting hanya yang decision-useful.",
      "Ada invalidation atau risiko utama.",
    ],
    redFlags: [
      "Tidak mengambil posisi.",
      "Menumpuk indikator tanpa sintesis.",
      "Risiko tidak disebut.",
    ],
  },
  {
    id: "technical-setup-eth",
    category: "Technical Analysis",
    language: "id",
    prompt:
      "Lihat ETH dari sisi teknikal harian. Saya butuh struktur trend, momentum, support-resistance, dan apakah ini breakout yang sehat atau belum.",
    expectedIntent: "technical-analysis",
    mustSee: [
      "Pembuka menjelaskan struktur chart, bukan sekadar angka RSI.",
      "Ada pembacaan trend dan momentum.",
      "Ada keputusan apakah breakout sehat, lemah, atau belum valid.",
    ],
    redFlags: [
      "RSI/MACD hanya dijelaskan definisinya.",
      "Support-resistance ditulis tanpa konteks.",
      "Tidak ada kesimpulan chart read.",
    ],
  },
  {
    id: "comparison-eth-sol",
    category: "Comparison",
    language: "id",
    prompt:
      "Untuk swing trade 2-4 minggu, ETH atau SOL yang secara risk-reward terlihat lebih menarik sekarang? Bandingkan secara ringkas tapi tajam.",
    expectedIntent: "comparison",
    mustSee: [
      "Ada pemenang atau verdict yang jelas di atas.",
      "Perbandingan memakai dimensi yang sama.",
      "Ada alasan kenapa salah satunya lebih unggul.",
    ],
    redFlags: [
      "Jawaban netral tanpa alasan.",
      "Membahas dua aset secara terpisah tanpa benar-benar membandingkan.",
      "Tidak ada takeaway praktis.",
    ],
  },
  {
    id: "news-catalysts-btc",
    category: "News and Catalysts",
    language: "en",
    prompt:
      "What are the two or three highest-signal catalysts moving Bitcoin this week, and are they actually meaningful for price or just noise?",
    expectedIntent: "news-analysis",
    mustSee: [
      "Headlines are grouped into themes.",
      "Each theme is translated into market impact.",
      "There is a judgment about signal versus noise.",
    ],
    redFlags: [
      "It lists many articles with no synthesis.",
      "It says news is important without explaining why.",
      "No distinction between major catalyst and background chatter.",
    ],
  },
  {
    id: "fundamental-nvda",
    category: "Fundamental and Macro",
    language: "en",
    prompt:
      "Is NVDA still fundamentally attractive after its recent run, or is the valuation now doing too much of the heavy lifting? Keep it investor-focused.",
    expectedIntent: "fundamental-analysis",
    mustSee: [
      "A valuation takeaway appears early.",
      "Only key metrics are surfaced.",
      "The answer ties metrics to investor implication.",
    ],
    redFlags: [
      "Mechanical metric dump.",
      "No investor takeaway.",
      "Overly technical accounting language without interpretation.",
    ],
  },
  {
    id: "macro-fed-risk",
    category: "Fundamental and Macro",
    language: "en",
    prompt:
      "How should I think about the next Fed move for risk assets? I want the practical market implication, not a macro textbook.",
    expectedIntent: "fundamental-analysis",
    mustSee: [
      "The response translates macro into market implication.",
      "It stays practical rather than academic.",
      "It makes clear what assets or regimes benefit or suffer.",
    ],
    redFlags: [
      "Long explanation of what the Fed is.",
      "No link to risk appetite or positioning.",
      "No bottom-line implication.",
    ],
  },
  {
    id: "strategy-breakout-btc",
    category: "Strategy and Risk",
    language: "id",
    prompt:
      "Kalau saya mau trading breakout BTC minggu ini, skenario entry, invalidasi, dan risk utama apa yang paling rasional?",
    expectedIntent: "strategy-risk",
    mustSee: [
      "Ada skenario jelas, bukan opini umum.",
      "Invalidasi disebut eksplisit.",
      "Risk utama fokus ke apa yang bisa salah.",
    ],
    redFlags: [
      "Hanya bilang tunggu konfirmasi tanpa menyebut bentuknya.",
      "Tidak ada invalidasi.",
      "Tidak menyebut kapan setup gugur.",
    ],
  },
  {
    id: "explainer-etf",
    category: "Concept Explainer",
    language: "id",
    prompt:
      "Jelaskan dengan sederhana kenapa ETF inflows penting untuk harga Bitcoin, seolah Anda menjelaskan ke investor yang paham pasar tapi bukan trader harian.",
    expectedIntent: "explainer",
    mustSee: [
      "Definisi sederhana muncul di awal.",
      "Ada penjelasan kenapa ini relevan untuk harga.",
      "Tidak berubah menjadi update berita live kecuali perlu.",
    ],
    redFlags: [
      "Terlalu teknis untuk pertanyaan penjelasan.",
      "Tidak memberi contoh implikasi.",
      "Melebar ke topik lain.",
    ],
  },
  {
    id: "portfolio-rotation",
    category: "General Research",
    language: "en",
    prompt:
      "If I can only watch one theme this week, should I focus on Bitcoin, AI equities, or gold? Give me the highest-conviction watchlist logic.",
    expectedIntent: "general-research",
    mustSee: [
      "There is a clear ranking or top pick.",
      "The rationale is selective and conviction-based.",
      "The answer feels like watchlist curation, not a broad market essay.",
    ],
    redFlags: [
      "Everything is treated as equally interesting.",
      "No prioritization.",
      "Too much background, not enough decision utility.",
    ],
  },
  {
    id: "simple-yes-no",
    category: "Market Outlook",
    language: "en",
    prompt:
      "Is this a good environment for chasing altcoins right now?",
    expectedIntent: "market-outlook",
    mustSee: [
      "The first sentence gives a clear yes/no/conditional answer.",
      "The support is concise.",
      "The answer is appropriately short.",
    ],
    redFlags: [
      "Long essay for a simple question.",
      "No direct answer.",
      "Too many sections.",
    ],
  },
  {
    id: "comparison-stocks-vs-crypto",
    category: "Comparison",
    language: "en",
    prompt:
      "For the next quarter, which looks cleaner on a risk-adjusted basis: BTC or the S&P 500? I want the trade-off, not a fan take.",
    expectedIntent: "comparison",
    mustSee: [
      "Trade-off is explicit.",
      "Risk-adjusted framing is preserved.",
      "Verdict is evidence-based and not tribal.",
    ],
    redFlags: [
      "One-sided cheerleading.",
      "No risk-adjusted lens.",
      "No actual comparison structure.",
    ],
  },
  {
    id: "news-local-language",
    category: "News and Catalysts",
    language: "id",
    prompt:
      "Ringkas berita paling penting yang memengaruhi Bitcoin minggu ini, tapi fokus ke dampaknya ke harga, bukan sekadar daftar headline.",
    expectedIntent: "news-analysis",
    mustSee: [
      "Jawaban tetap dalam Bahasa Indonesia.",
      "Riset tetap terasa global-market aware.",
      "Dampak ke harga lebih penting dari daftar headline.",
    ],
    redFlags: [
      "Headlines mentah.",
      "Tidak ada market impact.",
      "Bahasa output campur aduk tanpa alasan.",
    ],
  },
  {
    id: "macro-fx-update",
    category: "Market Update",
    language: "en",
    prompt:
      "Give me a quick EUR/USD update and tell me the one thing that matters most right now.",
    expectedIntent: "market-update",
    mustSee: [
      "Live rate is in the opening line.",
      "One dominant driver is identified.",
      "The answer stays compact.",
    ],
    redFlags: [
      "Too many secondary drivers.",
      "Macro essay instead of quick update.",
      "No clear 'one thing that matters'.",
    ],
  },
  {
    id: "strategy-investor",
    category: "Strategy and Risk",
    language: "id",
    prompt:
      "Saya bukan trader harian. Kalau saya investor yang ingin menambah posisi BTC bertahap, apa kondisi yang membuat akumulasi sekarang masuk akal dan apa kondisi yang membuat saya sebaiknya menunggu?",
    expectedIntent: "strategy-risk",
    mustSee: [
      "Nada cocok untuk investor, bukan intraday trader.",
      "Ada kondisi untuk bertindak dan kondisi untuk menunggu.",
      "Risiko atau invalidasi tetap ada.",
    ],
    redFlags: [
      "Gaya jawaban terlalu trading-centric.",
      "Tidak membedakan investor vs trader.",
      "Tidak ada kondisi keputusan.",
    ],
  },
  {
    id: "explainer-plain-english",
    category: "Concept Explainer",
    language: "en",
    prompt:
      "Explain RSI in plain English, then tell me how much weight I should actually give it in a real market decision.",
    expectedIntent: "explainer",
    mustSee: [
      "Definition is plain-English and short.",
      "The second half explains practical weight.",
      "The answer is educational but still judgment-oriented.",
    ],
    redFlags: [
      "Only textbook definition.",
      "No practical takeaway.",
      "Too much jargon.",
    ],
  },
];

export const TENREX_BENCHMARK_TARGET = {
  scoringScale: "1-5 for each rubric dimension",
  strongPassThreshold: "24/30 or better",
  analystGradeThreshold:
    "At least 4/5 on Answer First, Relevance, Judgment, and Tone",
};

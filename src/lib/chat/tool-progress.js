const TOOL_PROGRESS_CONFIG = {
  tavilyNews: {
    staffNumber: 1,
    title: "News & Catalysts",
    startMessage: (input) =>
      `Sedang mencari berita dan katalis untuk "${input?.query || "topik ini"}".`,
    doneMessage: () => "Berita dan katalis terbaru sudah dianalisis.",
    errorMessage: () => "Pencarian berita gagal diselesaikan.",
  },
  binanceCrypto: {
    staffNumber: 2,
    title: "Live Price",
    startMessage: (input) =>
      `Sedang mengambil harga live ${String(input?.symbol || "aset").toUpperCase()} dari Binance.`,
    doneMessage: () => "Harga live dan perubahan 24 jam sudah siap.",
    errorMessage: () => "Data harga live gagal diambil.",
  },
  cryptoSentiment: {
    staffNumber: 3,
    title: "Market Sentiment",
    startMessage: () => "Sedang membaca Fear & Greed Index crypto.",
    doneMessage: () => "Sentimen pasar crypto sudah diperbarui.",
    errorMessage: () => "Data sentimen pasar gagal diambil.",
  },
  stockMarket: {
    staffNumber: 4,
    title: "Stocks & Fundamentals",
    startMessage: (input) =>
      input?.dataType === "fundamental"
        ? `Sedang membaca fundamental ${String(input?.ticker || "saham").toUpperCase()}.`
        : `Sedang mengambil harga live ${String(input?.ticker || "saham").toUpperCase()}.`,
    doneMessage: (input) =>
      input?.dataType === "fundamental"
        ? "Data fundamental saham sudah siap."
        : "Harga live saham sudah siap.",
    errorMessage: () => "Data saham gagal diambil.",
  },
  macroForex: {
    staffNumber: 5,
    title: "Macro & FX",
    startMessage: (input) => {
      if (input?.assetType === "economic_indicator") {
        return `Sedang membaca indikator makro ${input?.symbolOrIndicator || "terkait"}.`;
      }

      return `Sedang mengambil data ${input?.symbolOrIndicator || "FX/makro"} terbaru.`;
    },
    doneMessage: () => "Data makro dan FX sudah siap.",
    errorMessage: () => "Data makro/FX gagal diambil.",
  },
  technicalEngine: {
    staffNumber: 6,
    title: "Technical Engine",
    startMessage: (input) =>
      `Sedang menghitung ${input?.indicator || "indikator"} untuk ${String(input?.assetSymbol || "aset").toUpperCase()} pada timeframe ${input?.timeframe || "-"}.`,
    doneMessage: () => "Analisis teknikal sudah selesai dihitung.",
    errorMessage: () => "Perhitungan teknikal gagal diselesaikan.",
  },
};

export function getToolProgressPayload(toolName, input) {
  const safeToolName = toolName || "researchTask";
  const config = TOOL_PROGRESS_CONFIG[toolName] || {
    staffNumber: "?",
    title: "Research Task",
    startMessage: () => "Sedang menjalankan riset tambahan.",
    doneMessage: () => "Riset tambahan selesai.",
    errorMessage: () => "Riset tambahan gagal dijalankan.",
  };

  return {
    toolName: safeToolName,
    staffNumber: config.staffNumber,
    title: config.title,
    startMessage: config.startMessage(input),
    doneMessage: config.doneMessage(input),
    errorMessage: config.errorMessage(input),
  };
}

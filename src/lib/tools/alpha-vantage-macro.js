// src/lib/tools/alpha-vantage-macro.js

/**
 * Fetches Forex exchange rates, Commodity prices, and macroeconomic indicators.
 * @param {string} assetType - "forex", "commodity", or "economic_indicator"
 * @param {string} symbolOrIndicator - e.g., "EURUSD", "XAUUSD", "US CPI", "Fed Interest Rate"
 * @returns {Promise<string>} - Formatted string with macro data
 */
export async function getMacroData(assetType, symbolOrIndicator) {
  console.log(
    `[Staff 5 - Macro/Forex] Fetching ${assetType} for: ${symbolOrIndicator}`,
  );

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY; // Pastikan ini ada di .env.local

  try {
    // 1. Logika untuk FOREX & KOMODITAS (Mata Uang & Emas/Perak)
    if (assetType === "forex" || assetType === "commodity") {
      // Membersihkan input (misal "EUR/USD" atau "EURUSD" menjadi "EUR" dan "USD")
      const cleanSymbol = symbolOrIndicator
        .replace(/[^A-Za-z]/g, "")
        .toUpperCase();
      const fromCurrency = cleanSymbol.substring(0, 3);
      const toCurrency = cleanSymbol.substring(3, 6) || "USD"; // Default ke USD jika hanya dikirim 3 huruf

      const response = await fetch(
        `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${apiKey}`,
      );
      const data = await response.json();

      if (!data["Realtime Currency Exchange Rate"]) {
        return `Failed to retrieve exchange rate for ${fromCurrency}/${toCurrency}. Please verify the symbol.`;
      }

      const rateData = data["Realtime Currency Exchange Rate"];
      return `Live Exchange Rate for ${fromCurrency}/${toCurrency}:
- Current Rate: ${rateData["5. Exchange Rate"]}
- Bid Price: ${rateData["8. Bid Price"]}
- Ask Price: ${rateData["9. Ask Price"]}
- Last Refreshed: ${rateData["6. Last Refreshed"]} (${rateData["7. Time Zone"]})

Use this exact rate to inform the user about the forex or commodity market.`;
    }

    // 2. Logika untuk INDIKATOR EKONOMI (Inflasi, Suku Bunga, PDB)
    else if (assetType === "economic_indicator") {
      let avFunction = "INFLATION"; // Default
      const query = symbolOrIndicator.toLowerCase();

      // Menerjemahkan permintaan AI ke endpoint Alpha Vantage yang spesifik
      if (
        query.includes("interest") ||
        query.includes("fed") ||
        query.includes("rate")
      ) {
        avFunction = "FEDERAL_FUNDS_RATE";
      } else if (query.includes("gdp")) {
        avFunction = "REAL_GDP";
      } else if (query.includes("unemployment")) {
        avFunction = "UNEMPLOYMENT";
      } else if (query.includes("cpi") || query.includes("inflation")) {
        avFunction = "INFLATION";
      }

      const response = await fetch(
        `https://www.alphavantage.co/query?function=${avFunction}&apikey=${apiKey}`,
      );
      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        return `Failed to retrieve economic indicator data for ${symbolOrIndicator}.`;
      }

      // Ambil data bulan/kuartal terbaru
      const latestData = data.data[0];
      const unit = data.unit || "%";

      return `Macroeconomic Indicator (${data.name || avFunction}):
- Latest Value: ${latestData.value} ${unit}
- Date Recorded: ${latestData.date}

Context: Use this fundamental economic data to analyze broader market impacts.`;
    }

    return "Invalid assetType requested for Macroeconomic staff.";
  } catch (error) {
    console.error("[Staff 5 - Macro/Forex] Error:", error.message);
    return "Error: Unable to connect to the global macroeconomic database.";
  }
}

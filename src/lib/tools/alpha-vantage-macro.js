// src/lib/tools/alpha-vantage-macro.js

function cleanValue(value) {
  return value === undefined || value === null || value === "" ? null : value;
}

/**
 * Fetches Forex exchange rates, Commodity prices, and macroeconomic indicators.
 * @param {string} assetType - "forex", "commodity", or "economic_indicator"
 * @param {string} symbolOrIndicator - e.g., "EURUSD", "XAUUSD", "US CPI", "Fed Interest Rate"
 * @returns {Promise<object>} - Structured macro and FX data
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
        return {
          ok: false,
          source: "Alpha Vantage",
          assetType,
          requestedSymbol: symbolOrIndicator,
          error: `Failed to retrieve exchange rate for ${fromCurrency}/${toCurrency}. Please verify the symbol.`,
        };
      }

      const rateData = data["Realtime Currency Exchange Rate"];
      return {
        ok: true,
        tool: "macroForex",
        source: "Alpha Vantage",
        assetType,
        requestedSymbol: symbolOrIndicator,
        fetchedAt: new Date().toISOString(),
        exchangeRateSnapshot: {
          pair: `${fromCurrency}/${toCurrency}`,
          rate: cleanValue(rateData["5. Exchange Rate"]),
          bid: cleanValue(rateData["8. Bid Price"]),
          ask: cleanValue(rateData["9. Ask Price"]),
          lastRefreshed: cleanValue(rateData["6. Last Refreshed"]),
          timezone: cleanValue(rateData["7. Time Zone"]),
        },
        analystNotes: [
          "Use the current rate as the headline number for forex or commodity questions.",
          "Explain why the rate matters only if the user asks for interpretation.",
        ],
      };
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
        return {
          ok: false,
          source: "Alpha Vantage",
          assetType,
          requestedSymbol: symbolOrIndicator,
          error: `Failed to retrieve economic indicator data for ${symbolOrIndicator}.`,
        };
      }

      // Ambil data bulan/kuartal terbaru
      const latestData = data.data[0];
      const unit = data.unit || "%";

      return {
        ok: true,
        tool: "macroForex",
        source: "Alpha Vantage",
        assetType,
        requestedSymbol: symbolOrIndicator,
        fetchedAt: new Date().toISOString(),
        macroSnapshot: {
          name: data.name || avFunction,
          latestValue: cleanValue(latestData.value),
          unit,
          dateRecorded: cleanValue(latestData.date),
        },
        analystNotes: [
          "Connect macro data to risk appetite, rates, inflation, or growth expectations only when relevant.",
          "Avoid overstating one macro data point as a full market conclusion.",
        ],
      };
    }

    return {
      ok: false,
      source: "Alpha Vantage",
      assetType,
      requestedSymbol: symbolOrIndicator,
      error: "Invalid assetType requested for Macroeconomic staff.",
    };
  } catch (error) {
    console.error("[Staff 5 - Macro/Forex] Error:", error.message);
    return {
      ok: false,
      source: "Alpha Vantage",
      assetType,
      requestedSymbol: symbolOrIndicator,
      error: "Unable to connect to the global macroeconomic database.",
    };
  }
}

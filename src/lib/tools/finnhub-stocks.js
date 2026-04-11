// src/lib/tools/finnhub-stocks.js

function round(value, digits = 2) {
  if (!Number.isFinite(value)) return null;
  return Number.parseFloat(value.toFixed(digits));
}

/**
 * Fetches live stock prices or basic financials from Finnhub.
 * @param {string} ticker - Company stock ticker (e.g., "AAPL", "TSLA")
 * @param {string} dataType - Type of data: "price" or "fundamental"
 * @returns {Promise<object>} - Structured stock market snapshot
 */
export async function getStockData(ticker, dataType) {
  console.log(`[Staff 4 - Finnhub] Fetching ${dataType} for: ${ticker}`);

  const apiKey = process.env.FINNHUB_API_KEY;
  const symbol = ticker.toUpperCase();

  try {
    if (dataType === "price") {
      // Fetch Real-time Quote
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
      );
      const data = await response.json();

      if (!data.c) {
        return {
          ok: false,
          source: "Finnhub",
          symbol,
          requestType: dataType,
          error: `Could not find stock price data for ${symbol}. Please check if the ticker is correct.`,
        };
      }

      return {
        ok: true,
        tool: "stockMarket",
        source: "Finnhub",
        requestType: "price",
        symbol,
        fetchedAt: new Date().toISOString(),
        priceSnapshot: {
          currentUsd: round(data.c),
          changeUsd: round(data.d),
          changePercent: round(data.dp),
          highUsd: round(data.h),
          lowUsd: round(data.l),
          openUsd: round(data.o),
          previousCloseUsd: round(data.pc),
        },
        analystNotes: [
          "Use currentUsd as the live anchor price.",
          "Use changePercent for the session move and highUsd/lowUsd for intraday range context.",
        ],
      };
    } else if (dataType === "fundamental") {
      // Fetch Basic Financials
      const response = await fetch(
        `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`,
      );
      const data = await response.json();

      if (!data.metric) {
        return {
          ok: false,
          source: "Finnhub",
          symbol,
          requestType: dataType,
          error: `Could not find fundamental data for ${symbol}.`,
        };
      }

      const m = data.metric;
      return {
        ok: true,
        tool: "stockMarket",
        source: "Finnhub",
        requestType: "fundamental",
        symbol,
        fetchedAt: new Date().toISOString(),
        fundamentalSnapshot: {
          marketCapMillionUsd: m.marketCapitalization || null,
          peRatioTtm: m.peTTM || null,
          priceToBookQuarterly: m.pbQuarterly || null,
          week52High: m["52WeekHigh"] || null,
          week52Low: m["52WeekLow"] || null,
          dividendYieldPercent: m.dividendYieldIndicatedAnnual || null,
          epsTtm: m.epsExclExtraItemsTTM || null,
        },
        analystNotes: [
          "Use only the metrics that answer the user's question.",
          "Explain what the valuation metrics imply instead of listing them without context.",
        ],
      };
    }

    return {
      ok: false,
      source: "Finnhub",
      symbol,
      requestType: dataType,
      error: "Invalid dataType requested for Stock Market staff.",
    };
  } catch (error) {
    console.error("[Staff 4 - Finnhub] Error:", error.message);
    return {
      ok: false,
      source: "Finnhub",
      symbol,
      requestType: dataType,
      error: "Unable to connect to the stock market database.",
    };
  }
}

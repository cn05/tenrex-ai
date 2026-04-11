// src/lib/tools/finnhub-stocks.js

/**
 * Fetches live stock prices or basic financials from Finnhub.
 * @param {string} ticker - Company stock ticker (e.g., "AAPL", "TSLA")
 * @param {string} dataType - Type of data: "price" or "fundamental"
 * @returns {Promise<string>} - Formatted string for the AI manager
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
        return `Could not find stock price data for ${symbol}. Please check if the ticker is correct.`;
      }

      const currentPrice = data.c.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });
      const change = data.d.toFixed(2);
      const percentChange = data.dp.toFixed(2);
      const high = data.h.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });
      const low = data.l.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });

      return `Live Stock Data for ${symbol}:
- Current Price: ${currentPrice}
- Change: ${change} (${percentChange}%)
- High of the day: ${high}
- Low of the day: ${low}

Context: These are real-time quotes from global exchanges via Finnhub.`;
    } else if (dataType === "fundamental") {
      // Fetch Basic Financials
      const response = await fetch(
        `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`,
      );
      const data = await response.json();

      if (!data.metric) {
        return `Could not find fundamental data for ${symbol}.`;
      }

      const m = data.metric;
      return `Fundamental Metrics for ${symbol}:
- Market Cap: ${m.marketCapitalization ? m.marketCapitalization.toLocaleString() + "M" : "N/A"}
- P/E Ratio (TTM): ${m.peTTM || "N/A"}
- 52-Week High: ${m["52WeekHigh"] || "N/A"}
- 52-Week Low: ${m["52WeekLow"] || "N/A"}
- Dividend Yield: ${m.dividendYieldIndicatedAnnual || "N/A"}%
- EPS (TTM): ${m.epsExclExtraItemsTTM || "N/A"}

Use this data to analyze the company's valuation and long-term health.`;
    }

    return "Invalid dataType requested for Stock Market staff.";
  } catch (error) {
    console.error("[Staff 4 - Finnhub] Error:", error.message);
    return "Error: Unable to connect to the stock market database.";
  }
}

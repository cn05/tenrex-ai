// src/lib/tools/binance-crypto.js

function toNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round(value, digits = 2) {
  if (!Number.isFinite(value)) return null;
  return Number.parseFloat(value.toFixed(digits));
}

function classifyIntradayBias(changePercent) {
  if (changePercent >= 2) return "strongly bullish";
  if (changePercent > 0) return "mildly bullish";
  if (changePercent <= -2) return "strongly bearish";
  if (changePercent < 0) return "mildly bearish";
  return "flat";
}

/**
 * Fetches live cryptocurrency price, volume, and 24h change from Binance API.
 * @param {string} symbol - The crypto symbol (e.g., "BTC", "ETH")
 * @returns {Promise<object>} - Structured live market snapshot
 */
export async function getBinancePrice(symbol) {
  console.log(`[Staff 2 - Binance Live] Fetching data for: ${symbol}`);

  const cleanSymbol = symbol.toUpperCase().includes("USDT")
    ? symbol.toUpperCase()
    : `${symbol.toUpperCase()}USDT`;

  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${cleanSymbol}`,
      {
        method: "GET",
        headers: {
          "X-MBX-APIKEY": process.env.BINANCE_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (data.code && data.code !== 200) {
      return {
        ok: false,
        source: "Binance",
        symbol: cleanSymbol,
        error: data.msg || "Failed to retrieve market data.",
      };
    }

    const price = toNumber(data.lastPrice);
    const openPrice = toNumber(data.openPrice);
    const high24h = toNumber(data.highPrice);
    const low24h = toNumber(data.lowPrice);
    const percentChange24h = toNumber(data.priceChangePercent);
    const volume24hUsd = toNumber(data.quoteVolume);
    const priceChange24hUsd = toNumber(data.priceChange);

    const intradayRangePercent =
      low24h && high24h ? round(((high24h - low24h) / low24h) * 100) : null;
    const distanceFrom24hHighPercent =
      price && high24h ? round(((price - high24h) / high24h) * 100) : null;
    const distanceFrom24hLowPercent =
      price && low24h ? round(((price - low24h) / low24h) * 100) : null;
    const rangePositionPercent =
      price && high24h && low24h && high24h !== low24h
        ? round(((price - low24h) / (high24h - low24h)) * 100)
        : null;

    console.log(`[Staff 2 - Binance Live] Success fetching ${cleanSymbol}.`);

    return {
      ok: true,
      tool: "binanceCrypto",
      source: "Binance",
      marketType: "crypto",
      symbol: cleanSymbol,
      fetchedAt: new Date().toISOString(),
      priceSnapshot: {
        currentUsd: price,
        open24hUsd: openPrice,
        change24hUsd: priceChange24hUsd,
        change24hPercent: round(percentChange24h),
        high24hUsd: high24h,
        low24hUsd: low24h,
        volume24hUsd: round(volume24hUsd),
      },
      derivedSignals: {
        intradayBias: classifyIntradayBias(percentChange24h || 0),
        intradayRangePercent,
        distanceFrom24hHighPercent,
        distanceFrom24hLowPercent,
        rangePositionPercent,
      },
      analystNotes: [
        "Use currentUsd as the anchor price in the opening sentence when the user asks for live market context.",
        "Use rangePositionPercent to judge whether price is trading near the top or bottom of the 24h range.",
        "Use intradayBias as context, not as a full forecast on its own.",
      ],
    };
  } catch (error) {
    console.error("[Staff 2 - Binance Live] Error:", error.message);
    return {
      ok: false,
      source: "Binance",
      symbol: cleanSymbol,
      error: "Unable to connect to the Binance live market database at this moment.",
    };
  }
}

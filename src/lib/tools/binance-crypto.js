// src/lib/tools/binance-crypto.js

/**
 * Fetches live cryptocurrency price, volume, and 24h change from Binance API.
 * @param {string} symbol - The crypto symbol (e.g., "BTC", "ETH")
 * @returns {Promise<string>} - Formatted string with live market data
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
      return `Failed to retrieve data for ${cleanSymbol}. Binance API message: ${data.msg}`;
    }

    const price = parseFloat(data.lastPrice).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
    const volume24h = parseFloat(data.quoteVolume).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
    const percentChange24h = parseFloat(data.priceChangePercent).toFixed(2);
    const high24h = parseFloat(data.highPrice).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
    const low24h = parseFloat(data.lowPrice).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

    console.log(`[Staff 2 - Binance Live] Success fetching ${cleanSymbol}.`);

    return `Live Market Data for ${cleanSymbol} (Source: Binance):
- Current Price: ${price}
- 24h Price Change: ${percentChange24h}%
- 24h Trading Volume (in USD): ${volume24h}
- 24h High: ${high24h}
- 24h Low: ${low24h}

Use this precise data to inform the user. Do not guess the price.`;
  } catch (error) {
    console.error("[Staff 2 - Binance Live] Error:", error.message);
    return "Error: Unable to connect to the Binance live market database at this moment.";
  }
}

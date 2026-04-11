// src/lib/tools/technical-calc.js
import { RSI, MACD, SMA } from "technicalindicators";

/**
 * Calculates technical indicators (RSI, MACD, MA) using historical data.
 * @param {string} assetSymbol - e.g., "BTCUSDT", "ETHUSDT"
 * @param {string} indicator - "RSI", "MACD", or "MA"
 * @param {string} timeframe - e.g., "1d", "4h", "1h"
 * @returns {Promise<string>} - Formatted string with technical analysis results
 */
export async function calculateTechnical(assetSymbol, indicator, timeframe) {
  console.log(
    `[Staff 6 - Technical Engine] Calculating ${indicator} for ${assetSymbol} on ${timeframe}`,
  );

  const cleanSymbol = assetSymbol.toUpperCase().includes("USDT")
    ? assetSymbol.toUpperCase()
    : `${assetSymbol.toUpperCase()}USDT`;

  try {
    // 1. Ambil Data Mentah (Candlestick/Klines) dari Binance
    // Kita mengambil 100 candle terakhir untuk memastikan data cukup untuk dihitung
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${cleanSymbol}&interval=${timeframe}&limit=100`,
    );
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return `Failed to retrieve historical candle data for ${cleanSymbol}.`;
    }

    // 2. Ekstrak hanya Harga Penutupan (Close Price)
    // Di Binance API, index ke-4 dari array kline adalah Close Price
    const closePrices = data.map((candle) => parseFloat(candle[4]));
    const currentPrice = closePrices[closePrices.length - 1];

    let resultText = `Technical Analysis for ${cleanSymbol} (Timeframe: ${timeframe}):\n- Current Price: $${currentPrice.toLocaleString()}\n\n`;

    // 3. Mesin Kalkulator Matematika
    if (indicator === "RSI") {
      const rsiInput = { values: closePrices, period: 14 };
      const rsiResult = RSI.calculate(rsiInput);
      const currentRSI = rsiResult[rsiResult.length - 1].toFixed(2);

      resultText += `Indicator: RSI (14 period)\n- Value: ${currentRSI}\n\n`;
      resultText += `Context:\n- RSI > 70: Overbought (Asset might be overpriced, potential pullback).\n- RSI < 30: Oversold (Asset might be undervalued, potential bounce).\n- RSI 30-70: Neutral zone.`;
    } else if (indicator === "MACD") {
      const macdInput = {
        values: closePrices,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
      };
      const macdResult = MACD.calculate(macdInput);
      const latestMACD = macdResult[macdResult.length - 1];

      resultText += `Indicator: MACD (12, 26, 9)\n`;
      resultText += `- MACD Line: ${latestMACD.MACD ? latestMACD.MACD.toFixed(2) : "N/A"}\n`;
      resultText += `- Signal Line: ${latestMACD.signal ? latestMACD.signal.toFixed(2) : "N/A"}\n`;
      resultText += `- Histogram: ${latestMACD.histogram ? latestMACD.histogram.toFixed(2) : "N/A"}\n\n`;
      resultText += `Context:\n- MACD Line crossing ABOVE Signal Line = Bullish momentum.\n- MACD Line crossing BELOW Signal Line = Bearish momentum.`;
    } else if (indicator === "MA") {
      // Menghitung SMA 20 dan SMA 50
      const sma20 = SMA.calculate({ values: closePrices, period: 20 });
      const sma50 = SMA.calculate({ values: closePrices, period: 50 });

      const currentSMA20 =
        sma20.length > 0 ? sma20[sma20.length - 1].toFixed(2) : "N/A";
      const currentSMA50 =
        sma50.length > 0 ? sma50[sma50.length - 1].toFixed(2) : "N/A";

      resultText += `Indicator: Moving Averages (SMA)\n`;
      resultText += `- SMA 20: $${currentSMA20}\n`;
      resultText += `- SMA 50: $${currentSMA50}\n\n`;
      resultText += `Context:\n- Price > MA = Uptrend. Price < MA = Downtrend.\n- SMA 20 crossing above SMA 50 is a bullish signal (Golden Cross).`;
    } else {
      return `Indicator ${indicator} is not supported yet.`;
    }

    resultText += `\n\nUse this mathematical data to advise the user on technical market conditions.`;
    return resultText;
  } catch (error) {
    console.error("[Staff 6 - Technical Engine] Error:", error.message);
    return "Error: Unable to calculate technical indicators at this moment.";
  }
}

// src/lib/tools/technical-calc.js
import { RSI, MACD, SMA } from "technicalindicators";

function round(value, digits = 2) {
  if (!Number.isFinite(value)) return null;
  return Number.parseFloat(value.toFixed(digits));
}

function latestValue(values) {
  return values.length > 0 ? values[values.length - 1] : null;
}

function describeRsi(rsi) {
  if (rsi === null) return "unknown";
  if (rsi >= 70) return "overbought";
  if (rsi <= 30) return "oversold";
  if (rsi >= 60) return "bullish momentum";
  if (rsi <= 40) return "bearish momentum";
  return "neutral momentum";
}

function describeMacd(macdLine, signalLine, histogram) {
  if (
    macdLine === null ||
    signalLine === null ||
    histogram === null
  ) {
    return "unknown";
  }

  if (macdLine > signalLine && histogram > 0) return "bullish";
  if (macdLine < signalLine && histogram < 0) return "bearish";
  return "mixed";
}

function describeTrendBias({
  currentPrice,
  sma20,
  sma50,
  rsi,
  macdLine,
  signalLine,
  histogram,
}) {
  let score = 0;

  if (currentPrice !== null && sma20 !== null) {
    if (currentPrice > sma20) score += 1;
    if (currentPrice < sma20) score -= 1;
  }

  if (currentPrice !== null && sma50 !== null) {
    if (currentPrice > sma50) score += 1;
    if (currentPrice < sma50) score -= 1;
  }

  if (sma20 !== null && sma50 !== null) {
    if (sma20 > sma50) score += 1;
    if (sma20 < sma50) score -= 1;
  }

  if (rsi !== null) {
    if (rsi >= 60) score += 1;
    if (rsi <= 40) score -= 1;
  }

  if (
    macdLine !== null &&
    signalLine !== null &&
    histogram !== null
  ) {
    if (macdLine > signalLine && histogram > 0) score += 1;
    if (macdLine < signalLine && histogram < 0) score -= 1;
  }

  if (score >= 4) return "strong bullish bias";
  if (score >= 2) return "moderate bullish bias";
  if (score <= -4) return "strong bearish bias";
  if (score <= -2) return "moderate bearish bias";
  return "mixed or range-bound";
}

function buildRequestedIndicatorRead(indicator, values) {
  if (indicator === "RSI") {
    return {
      focus: "RSI",
      summary: `RSI is ${values.rsi14 ?? "N/A"}, which suggests ${values.rsiContext}.`,
    };
  }

  if (indicator === "MACD") {
    return {
      focus: "MACD",
      summary: `MACD momentum is ${values.macdContext} with MACD ${values.macdLine ?? "N/A"} and signal ${values.macdSignal ?? "N/A"}.`,
    };
  }

  if (indicator === "MA") {
    const priceVsSma20 =
      values.currentPriceUsd !== null && values.sma20Usd !== null
        ? values.currentPriceUsd > values.sma20Usd
          ? "above"
          : values.currentPriceUsd < values.sma20Usd
            ? "below"
            : "at"
        : "around";
    const priceVsSma50 =
      values.currentPriceUsd !== null && values.sma50Usd !== null
        ? values.currentPriceUsd > values.sma50Usd
          ? "above"
          : values.currentPriceUsd < values.sma50Usd
            ? "below"
            : "at"
        : "around";

    return {
      focus: "Moving Averages",
      summary: `Price is ${priceVsSma20} SMA20 and ${priceVsSma50} SMA50.`,
    };
  }

  return {
    focus: "Technical Snapshot",
    summary: `Trend bias is ${values.trendBias} with ${values.rsiContext} and ${values.macdContext} momentum.`,
  };
}

/**
 * Calculates technical indicators (RSI, MACD, MA, or a broader snapshot) using historical data.
 * @param {string} assetSymbol - e.g., "BTCUSDT", "ETHUSDT"
 * @param {string} indicator - "RSI", "MACD", "MA", or "SNAPSHOT"
 * @param {string} timeframe - e.g., "1d", "4h", "1h"
 * @returns {Promise<object>} - Structured technical analysis snapshot
 */
export async function calculateTechnical(assetSymbol, indicator, timeframe) {
  console.log(
    `[Staff 6 - Technical Engine] Calculating ${indicator} for ${assetSymbol} on ${timeframe}`,
  );

  const cleanSymbol = assetSymbol.toUpperCase().includes("USDT")
    ? assetSymbol.toUpperCase()
    : `${assetSymbol.toUpperCase()}USDT`;
  const requestedIndicator = indicator.toUpperCase();

  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${cleanSymbol}&interval=${timeframe}&limit=100`,
    );
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return {
        ok: false,
        source: "Binance klines",
        symbol: cleanSymbol,
        timeframe,
        error: `Failed to retrieve historical candle data for ${cleanSymbol}.`,
      };
    }

    const closePrices = data.map((candle) => Number.parseFloat(candle[4]));
    const highPrices = data.map((candle) => Number.parseFloat(candle[2]));
    const lowPrices = data.map((candle) => Number.parseFloat(candle[3]));
    const quoteVolumes = data.map((candle) => Number.parseFloat(candle[7]));

    const currentPrice = latestValue(closePrices);
    const rsiResult = RSI.calculate({ values: closePrices, period: 14 });
    const macdResult = MACD.calculate({
      values: closePrices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
    const sma20 = SMA.calculate({ values: closePrices, period: 20 });
    const sma50 = SMA.calculate({ values: closePrices, period: 50 });

    const latestRsi = round(latestValue(rsiResult));
    const latestMacd = latestValue(macdResult);
    const latestSma20 = round(latestValue(sma20));
    const latestSma50 = round(latestValue(sma50));

    const macdLine = round(latestMacd?.MACD ?? null);
    const macdSignal = round(latestMacd?.signal ?? null);
    const macdHistogram = round(latestMacd?.histogram ?? null);

    const recentWindowHigh = round(Math.max(...highPrices.slice(-20)));
    const recentWindowLow = round(Math.min(...lowPrices.slice(-20)));
    const averageQuoteVolume20 =
      quoteVolumes.length >= 20
        ? round(
            quoteVolumes.slice(-20).reduce((sum, value) => sum + value, 0) / 20,
          )
        : null;

    const rsiContext = describeRsi(latestRsi);
    const macdContext = describeMacd(macdLine, macdSignal, macdHistogram);
    const trendBias = describeTrendBias({
      currentPrice,
      sma20: latestSma20,
      sma50: latestSma50,
      rsi: latestRsi,
      macdLine,
      signalLine: macdSignal,
      histogram: macdHistogram,
    });

    const values = {
      currentPriceUsd: round(currentPrice),
      rsi14: latestRsi,
      rsiContext,
      macdLine,
      macdSignal,
      macdHistogram,
      macdContext,
      sma20Usd: latestSma20,
      sma50Usd: latestSma50,
      trendBias,
    };

    return {
      ok: true,
      tool: "technicalEngine",
      source: "Binance klines + technicalindicators",
      symbol: cleanSymbol,
      timeframe,
      requestedIndicator,
      fetchedAt: new Date().toISOString(),
      priceSnapshot: {
        currentUsd: round(currentPrice),
        recent20CandleHighUsd: recentWindowHigh,
        recent20CandleLowUsd: recentWindowLow,
        averageQuoteVolume20,
      },
      indicators: {
        rsi14: latestRsi,
        macd: {
          line: macdLine,
          signal: macdSignal,
          histogram: macdHistogram,
        },
        movingAverages: {
          sma20: latestSma20,
          sma50: latestSma50,
        },
      },
      marketStructure: {
        trendBias,
        momentumBias: macdContext,
        supportLevelsUsd: [recentWindowLow, latestSma20, latestSma50].filter(
          (value) => value !== null,
        ),
        resistanceLevelsUsd: [recentWindowHigh].filter(
          (value) => value !== null,
        ),
        priceVsSma20Percent:
          currentPrice !== null && latestSma20
            ? round(((currentPrice - latestSma20) / latestSma20) * 100)
            : null,
        priceVsSma50Percent:
          currentPrice !== null && latestSma50
            ? round(((currentPrice - latestSma50) / latestSma50) * 100)
            : null,
      },
      requestedIndicatorRead: buildRequestedIndicatorRead(
        requestedIndicator,
        values,
      ),
      analystNotes: [
        "Trend bias is stronger when price is above both SMA20 and SMA50 with SMA20 above SMA50.",
        "Use RSI as momentum context, not as a standalone trade signal.",
        "Use support and resistance levels as zones rather than exact guaranteed turning points.",
      ],
    };
  } catch (error) {
    console.error("[Staff 6 - Technical Engine] Error:", error.message);
    return {
      ok: false,
      source: "Binance klines",
      symbol: cleanSymbol,
      timeframe,
      error: "Unable to calculate technical indicators at this moment.",
    };
  }
}

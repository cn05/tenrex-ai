// src/lib/tools/alternative-me.js

function classifyContrarianSignal(value) {
  if (value <= 24) return "contrarian bullish";
  if (value <= 46) return "cautious";
  if (value <= 54) return "neutral";
  if (value <= 74) return "optimistic";
  return "contrarian bearish";
}

/**
 * Fetches the current Cryptocurrency Fear & Greed Index.
 * @returns {Promise<object>} - Structured sentiment snapshot
 */
export async function getFearAndGreed() {
  console.log(`[Staff 3 - Crypto Sentiment] Fetching Fear & Greed Index...`);

  try {
    const response = await fetch("https://api.alternative.me/fng/?limit=1", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!data || !data.data || data.data.length === 0) {
      return {
        ok: false,
        source: "alternative.me",
        error: "Failed to retrieve the Fear & Greed Index at this time.",
      };
    }

    const todayData = data.data[0];
    const value = Number.parseInt(todayData.value, 10);
    const classification = todayData.value_classification;

    console.log(
      `[Staff 3 - Crypto Sentiment] Success: ${value} (${classification})`,
    );

    return {
      ok: true,
      tool: "cryptoSentiment",
      source: "alternative.me",
      fetchedAt: new Date().toISOString(),
      sentimentSnapshot: {
        value,
        classification,
        previousCloseUnix: todayData.timestamp || null,
        lastUpdatedInSeconds: todayData.time_until_update || null,
      },
      derivedSignals: {
        regime:
          value <= 24
            ? "extreme fear"
            : value <= 46
              ? "fear"
              : value <= 54
                ? "neutral"
                : value <= 74
                  ? "greed"
                  : "extreme greed",
        contrarianSignal: classifyContrarianSignal(value),
      },
      analystNotes: [
        "Extreme fear can support a contrarian bullish case, but it is not a standalone buy signal.",
        "Extreme greed can increase correction risk, but it does not automatically end an uptrend.",
        "Use the sentiment reading to contextualize price action, not replace it.",
      ],
    };
  } catch (error) {
    console.error("[Staff 3 - Crypto Sentiment] Error:", error.message);
    return {
      ok: false,
      source: "alternative.me",
      error: "Unable to connect to the Fear & Greed sentiment database at this moment.",
    };
  }
}

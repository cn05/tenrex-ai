// src/lib/tools/alternative-me.js

/**
 * Fetches the current Cryptocurrency Fear & Greed Index.
 * @returns {Promise<string>} - Formatted string with sentiment data
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
      return "Failed to retrieve the Fear & Greed Index at this time.";
    }

    const todayData = data.data[0];
    const value = todayData.value;
    const classification = todayData.value_classification;

    console.log(
      `[Staff 3 - Crypto Sentiment] Success: ${value} (${classification})`,
    );

    return `Cryptocurrency Market Sentiment (Fear & Greed Index):
- Current Value: ${value} out of 100
- Market Psychology: ${classification}

Context for Analysis:
- 0-24: Extreme Fear (Potential buying opportunity / market bottom)
- 25-46: Fear
- 47-54: Neutral
- 55-74: Greed
- 75-100: Extreme Greed (Market may be due for a correction)

Use this exact sentiment classification to explain the current market psychology to the user.`;
  } catch (error) {
    console.error("[Staff 3 - Crypto Sentiment] Error:", error.message);
    return "Error: Unable to connect to the Fear & Greed sentiment database at this moment.";
  }
}

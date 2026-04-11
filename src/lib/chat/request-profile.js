const REQUEST_INTENTS = [
  {
    id: "comparison",
    label: "Comparison",
    keywords: [
      " vs ",
      "versus",
      "compare",
      "comparison",
      "perbandingan",
      "dibanding",
      "lebih baik",
      "better than",
      "mana yang lebih",
    ],
  },
  {
    id: "strategy-risk",
    label: "Strategy and Risk",
    keywords: [
      "strategy",
      "setup",
      "plan",
      "entry",
      "exit",
      "stop loss",
      "take profit",
      "risk",
      "risk-reward",
      "invalidasi",
      "skenario",
      "trade",
    ],
  },
  {
    id: "technical-analysis",
    label: "Technical Analysis",
    keywords: [
      "rsi",
      "macd",
      "moving average",
      "ma ",
      "sma",
      "ema",
      "support",
      "resistance",
      "breakout",
      "breakdown",
      "chart",
      "teknikal",
      "technical",
    ],
  },
  {
    id: "market-outlook",
    label: "Market Outlook",
    keywords: [
      "bullish",
      "bearish",
      "outlook",
      "bias",
      "naik",
      "turun",
      "upside",
      "downside",
      "target",
      "forecast",
      "prediksi",
      "rebound",
      "will it go",
    ],
  },
  {
    id: "news-analysis",
    label: "News and Catalysts",
    keywords: [
      "news",
      "headline",
      "berita",
      "catalyst",
      "katalis",
      "latest",
      "terbaru",
      "etf",
      "announcement",
      "update",
    ],
  },
  {
    id: "fundamental-analysis",
    label: "Fundamental and Macro",
    keywords: [
      "fundamental",
      "valuation",
      "pe ratio",
      "market cap",
      "revenue",
      "earnings",
      "dividend",
      "macro",
      "inflation",
      "cpi",
      "fed",
      "interest rate",
      "gdp",
      "unemployment",
    ],
  },
  {
    id: "explainer",
    label: "Concept Explainer",
    keywords: [
      "apa itu",
      "what is",
      "jelaskan",
      "explain",
      "how does",
      "bagaimana cara kerja",
      "why does",
      "kenapa",
      "mengapa",
    ],
  },
  {
    id: "market-update",
    label: "Market Update",
    keywords: [
      "harga",
      "price",
      "berapa",
      "current",
      "sekarang",
      "today",
      "hari ini",
      "snapshot",
      "update market",
      "market update",
    ],
  },
];

const DETAILED_KEYWORDS = [
  "detail",
  "detailed",
  "lengkap",
  "mendalam",
  "deep dive",
  "komprehensif",
  "full analysis",
];

const CONCISE_KEYWORDS = [
  "singkat",
  "brief",
  "short",
  "ringkas",
  "quick",
  "cepat",
  "tl;dr",
];

const FOCUS_ASSET_ALIASES = {
  BTC: ["btc", "bitcoin", "xbt"],
  ETH: ["eth", "ethereum", "ether"],
  BNB: ["bnb", "binance coin"],
  SOL: ["sol", "solana"],
  XRP: ["xrp", "ripple"],
  ADA: ["ada", "cardano"],
  DOGE: ["doge", "dogecoin"],
  AVAX: ["avax", "avalanche"],
  LTC: ["ltc", "litecoin"],
  LINK: ["link", "chainlink"],
  DOT: ["dot", "polkadot"],
  ATOM: ["atom", "cosmos"],
  SUI: ["sui"],
  TON: ["ton", "toncoin"],
  TRX: ["trx", "tron"],
  AAPL: ["aapl", "apple"],
  TSLA: ["tsla", "tesla"],
  NVDA: ["nvda", "nvidia"],
  META: ["meta", "facebook"],
  AMZN: ["amzn", "amazon"],
  SPX: ["s&p 500", "sp500", "s&p500", "spx"],
  GOLD: ["gold", "xau"],
  SILVER: ["silver", "xag"],
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractFocusAssets(message) {
  const loweredMessage = message.toLowerCase();
  const matches = [];

  for (const [asset, aliases] of Object.entries(FOCUS_ASSET_ALIASES)) {
    const hasMatch = aliases.some((alias) => {
      const pattern = new RegExp(
        `(^|[^a-z0-9])${escapeRegex(alias.toLowerCase())}([^a-z0-9]|$)`,
        "i",
      );

      return pattern.test(loweredMessage);
    });

    if (hasMatch) {
      matches.push(asset);
    }
  }

  return [...new Set(matches)];
}

function buildFocusRules(requestProfile) {
  if (requestProfile.focusAssets.length === 0) {
    return [
      "If the latest user message names a different asset, ticker, or market than earlier turns, treat that as a topic shift and follow the latest message.",
      "Do not reuse a previous asset or ticker unless the latest user message clearly refers back to it.",
    ];
  }

  if (requestProfile.intent === "comparison") {
    return [
      `The latest user message explicitly focuses on: ${requestProfile.focusAssets.join(", ")}.`,
      "Treat those assets as the comparison set and keep the answer scoped to them.",
      "Do not switch the comparison target to a different asset from earlier turns.",
    ];
  }

  if (requestProfile.focusAssets.length === 1) {
    return [
      `The latest user message explicitly focuses on: ${requestProfile.focusAssets[0]}.`,
      `Treat ${requestProfile.focusAssets[0]} as the primary asset/topic for both tool calls and the final answer.`,
      "Do not answer about a different asset from earlier turns unless the user explicitly asks for a comparison or broader market context.",
    ];
  }

  return [
    `The latest user message explicitly mentions these focus assets/topics: ${requestProfile.focusAssets.join(", ")}.`,
    "Keep the answer anchored to those entities and do not drift back to older assets from the chat history.",
  ];
}

function scoreIntent(message, keywords) {
  return keywords.reduce(
    (score, keyword) => score + (message.includes(keyword) ? 1 : 0),
    0,
  );
}

function detectDepth(message) {
  const detailedScore = scoreIntent(message, DETAILED_KEYWORDS);
  const conciseScore = scoreIntent(message, CONCISE_KEYWORDS);

  if (detailedScore > conciseScore) return "detailed";
  if (conciseScore > detailedScore) return "concise";
  return "balanced";
}

function detectLanguage(message) {
  const indonesianHints = [
    " apa ",
    " bagaimana ",
    " apakah ",
    " kenapa ",
    " tolong ",
    " jelaskan ",
    " berita ",
    " harga ",
    " hari ini ",
    " lebih ",
  ];

  const paddedMessage = ` ${message} `;
  const indonesianScore = indonesianHints.reduce(
    (score, hint) => score + (paddedMessage.includes(hint) ? 1 : 0),
    0,
  );

  return indonesianScore >= 2 ? "Bahasa Indonesia" : "the user's language";
}

function getBlueprint(intentId, depth) {
  const detailInstruction =
    depth === "concise"
      ? "Keep the response compact: direct answer first, then only the most important supporting points."
      : depth === "detailed"
        ? "Go deeper than usual, but keep the answer organized and selective rather than exhaustive."
        : "Balance clarity and depth. Give enough detail to be useful without overloading the user.";

  const blueprints = {
    comparison: [
      "Open with the winner, difference, or key takeaway in 1-2 sentences.",
      "Compare only the dimensions that matter for the user's question.",
      "Use a short section such as 'Key Differences' or 'Why One Looks Better'.",
      "End with the practical takeaway: which asset/setup looks stronger and why.",
    ],
    "strategy-risk": [
      "Open with the core setup or recommendation, including whether the idea is strong, weak, or conditional.",
      "Present the scenario, trigger, invalidation, and main risk in a clean order.",
      "Use levels only when they are decision-useful.",
      "End with what would confirm the setup versus break it.",
    ],
    "technical-analysis": [
      "Open with the market structure or technical thesis in plain language.",
      "Use sections only if helpful, such as 'Trend', 'Momentum', and 'Key Levels'.",
      "Translate indicators into meaning instead of listing indicator values without context.",
      "End with what the chart currently favors and what would change that read.",
    ],
    "market-outlook": [
      "Open with the directional answer first, including confidence or bias when appropriate.",
      "Support the thesis with the most relevant technical, sentiment, and catalyst evidence.",
      "Use a short 'Key Risks' section if the view is conditional or mixed.",
      "End with the most likely path and the invalidation level or condition.",
    ],
    "news-analysis": [
      "Open with what happened and why it matters now.",
      "Group headlines into themes instead of dumping every article.",
      "Explain market impact: bullish, bearish, neutral, or mixed, and why.",
      "End with what the user should watch next.",
    ],
    "fundamental-analysis": [
      "Open with the business, valuation, or macro takeaway first.",
      "Surface only the metrics that matter for the user's question.",
      "Interpret the numbers instead of listing them mechanically.",
      "End with the implication for valuation, demand, risk, or market direction.",
    ],
    explainer: [
      "Start with a clean definition in plain language.",
      "Use a simple structure such as 'What It Is', 'Why It Matters', and 'Example' only if useful.",
      "Avoid live data unless it helps answer the user's actual question.",
      "End with the practical takeaway for an investor or trader.",
    ],
    "market-update": [
      "Answer the user's question immediately with the most relevant live metric.",
      "Add only the minimum context needed: what changed, why it matters, and the main driver.",
      "Prefer one short summary plus a few bullets over a long report.",
      "End with the next thing to watch only if it adds value.",
    ],
    "general-research": [
      "Open with the direct answer or thesis.",
      "Select only the sections that materially help answer the question.",
      "Synthesize across tools instead of pasting raw results.",
      "Close with the most useful takeaway or next step.",
    ],
  };

  return [detailInstruction, ...(blueprints[intentId] || blueprints["general-research"])].join(
    "\n- ",
  );
}

function getResearchPriorities(intentId) {
  const priorities = {
    comparison: [
      "Pull the same dimensions for both assets or topics before concluding.",
      "Prioritize comparative edge, not isolated facts.",
      "State the winner only if the evidence is clear.",
    ],
    "strategy-risk": [
      "Prioritize triggers, levels, and conditions over broad commentary.",
      "Only use tools that materially change the setup.",
      "Explicitly mention what could invalidate the scenario.",
    ],
    "technical-analysis": [
      "Prefer technicalEngine with indicator=SNAPSHOT for broad chart reads.",
      "Use live price data to anchor the technical narrative.",
      "Translate technical data into trend, momentum, and levels.",
    ],
    "market-outlook": [
      "Combine live price, technical context, sentiment, and catalysts.",
      "Give a directional bias only when evidence supports it.",
      "If signals conflict, say the bias is mixed or conditional.",
    ],
    "news-analysis": [
      "Use tavilyNews to identify the latest catalysts.",
      "Summarize the highest-signal themes rather than every headline.",
      "Tie news back to price, sentiment, or risk only if relevant.",
    ],
    "fundamental-analysis": [
      "Use stockMarket or macroForex for valuation and macro context when relevant.",
      "Prioritize the few metrics that answer the user's question.",
      "Connect fundamentals to decision-making, not just description.",
    ],
    explainer: [
      "Use tools only if the user wants current, factual, or market-linked context.",
      "Favor clarity and pedagogy over raw data density.",
      "Avoid unnecessary sections or jargon.",
    ],
    "market-update": [
      "Answer with the current metric first.",
      "Use one or two tools maximum unless deeper context is required.",
      "Keep the update focused on what changed and why.",
    ],
    "general-research": [
      "Only call tools that are directly relevant to the user's question.",
      "Lead with the answer, then support it with selected facts.",
      "Avoid repeating overlapping evidence.",
    ],
  };

  return priorities[intentId] || priorities["general-research"];
}

function getAnalystToneRules(depth) {
  const depthRule =
    depth === "concise"
      ? "Prefer one compact answer block or one short summary plus a few bullets."
      : depth === "detailed"
        ? "Use a brief executive summary first, then expand only into the most relevant sections."
        : "Keep the flow tight: answer first, evidence second, takeaway last.";

  return [
    "Sound like a market analyst briefing a smart client, not a generic chatbot.",
    "Do not open with filler such as 'Here is the analysis', 'Of course', or 'Certainly'.",
    "Use crisp language built around thesis, drivers, risks, and implication.",
    "If the user's question can be answered with a clear yes/no, directional view, winner, or takeaway, do that in the first sentence.",
    "Avoid repeating the same metric, conclusion, or caveat in multiple sections.",
    depthRule,
  ];
}

function getFormattingGuardrails(depth) {
  const sectionLimit =
    depth === "detailed"
      ? "Use at most 4 top-level sections."
      : "Use at most 3 top-level sections, and use no headings at all for simple questions unless they truly help scanability.";

  return [
    sectionLimit,
    "Use bullets only for genuinely list-shaped information such as levels, catalysts, risks, or comparisons.",
    "Do not dump raw article lists or raw indicator readouts without telling the user what they mean.",
    "If you include a 'Bottom line', it must add synthesis rather than restate everything above it.",
    "Only add follow-up questions or next-watch items when they clearly extend the user's decision-making.",
  ];
}

function resolveIntent(message) {
  const loweredMessage = message.toLowerCase();

  const scoredIntents = REQUEST_INTENTS.map((intent) => ({
    ...intent,
    score: scoreIntent(loweredMessage, intent.keywords),
  })).sort((a, b) => b.score - a.score);

  return scoredIntents[0]?.score > 0 ? scoredIntents[0] : null;
}

export function buildChatRequestProfile(message) {
  const resolvedIntent = resolveIntent(message) || {
    id: "general-research",
    label: "General Research",
  };
  const depth = detectDepth(message.toLowerCase());
  const responseLanguage = detectLanguage(message.toLowerCase());
  const blueprint = getBlueprint(resolvedIntent.id, depth);
  const researchPriorities = getResearchPriorities(resolvedIntent.id);
  const focusAssets = extractFocusAssets(message);

  return {
    intent: resolvedIntent.id,
    label: resolvedIntent.label,
    depth,
    responseLanguage,
    blueprint,
    researchPriorities,
    focusAssets,
  };
}

export function filterMessagesForCurrentFocus(messages = [], requestProfile) {
  if (!Array.isArray(messages) || messages.length === 0) return messages;
  if (!requestProfile || requestProfile.intent === "comparison") return messages;
  if (requestProfile.focusAssets.length !== 1) return messages;

  const currentFocusAsset = requestProfile.focusAssets[0];
  let removedAnyMessage = false;

  const filteredMessages = messages.filter((message, index) => {
    if (index === messages.length - 1) return true;

    const messageAssets = extractFocusAssets(message.content || "");
    if (messageAssets.length === 0) return true;

    const shouldKeep = messageAssets.includes(currentFocusAsset);

    if (!shouldKeep) {
      removedAnyMessage = true;
    }

    return shouldKeep;
  });

  return removedAnyMessage ? filteredMessages : messages;
}

export function buildChatSystemPrompt({ message, today }) {
  const requestProfile = buildChatRequestProfile(message);
  const analystToneRules = getAnalystToneRules(requestProfile.depth);
  const formattingGuardrails = getFormattingGuardrails(requestProfile.depth);
  const focusRules = buildFocusRules(requestProfile);

  const systemPrompt = `You are Tenrex AI, an enterprise-grade global market analyst.
Today is ${today}.

Your job is to answer the user's actual question with the best structure for that question type, not with a generic report template.

Global answer rules:
- Respond in ${requestProfile.responseLanguage}, unless the user explicitly asks for another language.
- The first 1-2 sentences must directly answer the user's question.
- Lead with the most decision-useful fact, metric, or conclusion.
- Use only the sections that materially help answer the question.
- Do not dump raw tool output, article lists, or indicator values without interpretation.
- Synthesize across tools into one coherent view.
- The latest user message is the authority if it conflicts with earlier turns.
- If the user asks for live data, sentiment, fundamentals, macro, or news, you must call the relevant tools.
- If the evidence is mixed, say so clearly instead of forcing a strong conclusion.
- If you give an opinion, bias, comparison, or forecast, include the main drivers and the main invalidation or risk.
- Use exact numbers from tools whenever available. Do not fabricate missing facts.
- For simple questions, keep the answer compact. For complex questions, use a concise summary followed by the most relevant sections.
- ${focusRules.join("\n- ")}

Research execution rules:
- For global market topics, do your research thinking and tool-query formulation in English unless the user explicitly asks for local-language or local-market sources.
- Present the final answer in ${requestProfile.responseLanguage}, unless the user explicitly asks for another language.
- Prefer high-signal facts, catalysts, and levels over exhaustive background.

Analyst-grade tone rules:
- ${analystToneRules.join("\n- ")}

Formatting guardrails:
- ${formattingGuardrails.join("\n- ")}

Detected request profile:
- Answer type: ${requestProfile.label}
- Desired depth: ${requestProfile.depth}

Response blueprint:
- ${requestProfile.blueprint}

Research priorities:
- ${requestProfile.researchPriorities.join("\n- ")}

Before finalizing:
- Check that every section is relevant to the user's question.
- Remove repetitive points.
- Prefer clarity, relevance, and judgment over quantity.
- End with the most practical takeaway.`;

  return {
    requestProfile,
    systemPrompt,
  };
}

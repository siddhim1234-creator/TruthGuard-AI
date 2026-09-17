const express = require("express");
const cors = require("cors");
const axios = require("axios");
const Parser = require("rss-parser");
const cheerio = require("cheerio");

const app = express();
const PORT = 5000;

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  },
});

app.use(cors());
app.use(express.json());


// ======================================================
// BASIC ROUTE
// ======================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TruthGuard AI backend is running",
    features: [
      "Live news search",
      "Historical news search",
      "Article extraction",
      "Evidence analysis",
    ],
  });
});


// ======================================================
// STOP WORDS
// ======================================================

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "if",
  "then",
  "than",
  "this",
  "that",
  "these",
  "those",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "to",
  "of",
  "in",
  "on",
  "at",
  "for",
  "from",
  "with",
  "by",
  "as",
  "about",
  "into",
  "after",
  "before",
  "during",
  "over",
  "under",
  "through",
  "has",
  "have",
  "had",
  "will",
  "would",
  "could",
  "should",
  "can",
  "may",
  "might",
  "it",
  "its",
  "he",
  "she",
  "they",
  "them",
  "their",
  "his",
  "her",
  "you",
  "your",
  "we",
  "our",
  "i",
  "me",
  "my",
  "who",
  "what",
  "when",
  "where",
  "why",
  "how",
  "which",
  "also",
  "very",
  "more",
  "most",
  "some",
  "any",
  "not",
  "no",
  "yes",
  "new",
  "news",
]);


// ======================================================
// CLEAN TEXT
// ======================================================

function cleanText(text) {
  if (!text) return "";

  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


// ======================================================
// GET IMPORTANT WORDS
// ======================================================

function getImportantWords(text) {
  const cleaned = cleanText(text);

  return cleaned
    .split(" ")
    .filter((word) => {
      return word.length >= 3 && !STOP_WORDS.has(word);
    });
}


// ======================================================
// CREATE SEARCH QUERY
// ======================================================

function createSearchQuery(text) {
  const words = getImportantWords(text);

  // Keep query manageable
  const selectedWords = words.slice(0, 18);

  return selectedWords.join(" ");
}


// ======================================================
// EXTRACT YEAR
// ======================================================

function extractYear(text) {
  if (!text) return null;

  const match = text.match(/\b(19\d{2}|20\d{2})\b/);

  if (match) {
    return parseInt(match[1], 10);
  }

  return null;
}


// ======================================================
// GOOGLE NEWS RSS SEARCH
// ======================================================

async function searchNews(query) {
  try {
    const year = extractYear(query);

    let searchQuery = createSearchQuery(query);

    // Historical search
    if (year) {
      searchQuery += ` after:${year}-01-01 before:${year + 1}-01-01`;
    }

    console.log("\n----------------------------------------");
    console.log("Google News search:");
    console.log(searchQuery);
    console.log("----------------------------------------");

    const feed = await parser.parseURL(
      `https://news.google.com/rss/search?q=${encodeURIComponent(
        searchQuery
      )}&hl=en-IN&gl=IN&ceid=IN:en`
    );

    console.log(`News results: ${feed.items.length}`);

    return feed.items.map((item) => ({
      title: item.title || "",
      url: item.link || "",
      date: item.pubDate || "",
      contentSnippet: item.contentSnippet || "",
      content: item.content || "",
    }));
  } catch (error) {
    console.error("Google News search error:", error.message);

    return [];
  }
}


// ======================================================
// EXTRACT ARTICLE CONTENT
// ======================================================

async function extractArticleContent(url) {
  if (!url) {
    return "";
  }

  try {
    const response = await axios.get(url, {
      timeout: 12000,

      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",

        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },

      maxRedirects: 5,
    });

    const html = response.data;

    const $ = cheerio.load(html);

    // Remove unnecessary elements
    $(
      "script, style, nav, footer, header, aside, form, noscript, iframe, svg"
    ).remove();

    let paragraphs = [];

    // ------------------------------------------
    // METHOD 1: Article paragraphs
    // ------------------------------------------

    $("article p").each((index, element) => {
      const text = $(element).text().replace(/\s+/g, " ").trim();

      if (text.length >= 40) {
        paragraphs.push(text);
      }
    });

    // ------------------------------------------
    // METHOD 2: Normal paragraphs
    // ------------------------------------------

    if (paragraphs.length < 3) {
      paragraphs = [];

      $("p").each((index, element) => {
        const text = $(element).text().replace(/\s+/g, " ").trim();

        if (text.length >= 40) {
          paragraphs.push(text);
        }
      });
    }

    // ------------------------------------------
    // METHOD 3: Meta description
    // ------------------------------------------

    if (paragraphs.length === 0) {
      const description =
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content");

      if (description && description.length > 30) {
        paragraphs.push(description);
      }
    }

    // ------------------------------------------
    // METHOD 4: JSON-LD articleBody
    // ------------------------------------------

    if (paragraphs.length < 2) {
      $("script[type='application/ld+json']").each(
        (index, element) => {
          try {
            const json = JSON.parse($(element).html());

            const objects = Array.isArray(json)
              ? json
              : [json];

            for (const obj of objects) {
              if (
                obj &&
                typeof obj.articleBody === "string" &&
                obj.articleBody.length > 100
              ) {
                paragraphs.push(obj.articleBody);
              }
            }
          } catch (error) {
            // Ignore invalid JSON-LD
          }
        }
      );
    }

    // Remove duplicates
    paragraphs = [...new Set(paragraphs)];

    // Limit article size
    paragraphs = paragraphs.slice(0, 40);

    const articleText = paragraphs.join(" ");

    console.log(
      `Extracted ${articleText.length} characters from: ${url}`
    );

    return articleText;
  } catch (error) {
    console.log(
      `Extraction failed: ${url}`
    );

    console.log(
      `Reason: ${error.message}`
    );

    return "";
  }
}


// ======================================================
// TOKEN SIMILARITY
// ======================================================

function calculateSimilarity(claim, articleText) {
  if (!claim || !articleText) {
    return 0;
  }

  const claimWords = new Set(
    getImportantWords(claim)
  );

  const articleWords = new Set(
    getImportantWords(articleText)
  );

  if (claimWords.size === 0) {
    return 0;
  }

  let matchingWords = 0;

  for (const word of claimWords) {
    if (articleWords.has(word)) {
      matchingWords++;
    }
  }

  return matchingWords / claimWords.size;
}


// ======================================================
// ANALYZE EVIDENCE
// ======================================================

function analyzeEvidence(claim, articles) {
  if (!articles || articles.length === 0) {
    return {
      prediction: "Insufficient Evidence",
      confidence: 0,
      explanation:
        "No relevant news evidence was found for this claim.",
      message:
        "TruthGuard could not find enough evidence to determine whether the claim is supported or false.",
    };
  }

  const analyzedArticles = articles.map((article) => {
    const combinedText = `
      ${article.title}
      ${article.contentSnippet}
      ${article.content}
    `;

    const similarity = calculateSimilarity(
      claim,
      combinedText
    );

    return {
      ...article,
      similarity,
    };
  });

  const strongMatches = analyzedArticles.filter(
    (article) => article.similarity >= 0.45
  );

  const moderateMatches = analyzedArticles.filter(
    (article) =>
      article.similarity >= 0.25 &&
      article.similarity < 0.45
  );

  const highestSimilarity = Math.max(
    ...analyzedArticles.map(
      (article) => article.similarity
    )
  );

  console.log("\nEvidence analysis:");
  console.log(
    `Strong matches: ${strongMatches.length}`
  );
  console.log(
    `Moderate matches: ${moderateMatches.length}`
  );
  console.log(
    `Highest similarity: ${highestSimilarity.toFixed(2)}`
  );


  // ------------------------------------------
  // Strong evidence
  // ------------------------------------------

  if (strongMatches.length >= 3) {
    const confidence = Math.min(
      90,
      Math.round(
        60 + strongMatches.length * 7
      )
    );

    return {
      prediction: "Likely Supported",
      confidence,

      explanation:
        "Multiple retrieved news sources contain information that closely matches the submitted claim.",

      message:
        "The available evidence is consistent with this claim. However, TruthGuard does not treat source matching as absolute proof.",

      analyzedArticles,
    };
  }


  // ------------------------------------------
  // Some evidence
  // ------------------------------------------

  if (
    strongMatches.length >= 1 ||
    moderateMatches.length >= 2
  ) {
    const confidence = Math.min(
      80,
      Math.round(
        45 + highestSimilarity * 30
      )
    );

    return {
      prediction: "Potentially Supported",
      confidence,

      explanation:
        "Some retrieved sources contain information related to the submitted claim, but the available evidence is not strong enough for a definitive conclusion.",

      message:
        "The claim has supporting evidence, but additional verification from reliable sources is recommended.",

      analyzedArticles,
    };
  }


  // ------------------------------------------
  // No meaningful evidence
  // ------------------------------------------

  return {
    prediction: "Insufficient Evidence",
    confidence: Math.round(
      highestSimilarity * 30
    ),

    explanation:
      "The retrieved sources did not contain enough information closely matching the submitted claim.",

    message:
      "This does not mean the claim is false. TruthGuard could not find sufficient evidence in the sources it checked.",

    analyzedArticles,
  };
}


// ======================================================
// NEWS VERIFICATION API
// ======================================================

app.post("/api/verify-news", async (req, res) => {
  try {
    const { text } = req.body;

    // ------------------------------------------
    // Validation
    // ------------------------------------------

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a news claim or article text.",
      });
    }

    const cleanedInput = text.trim();

    if (cleanedInput.length < 10) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a more detailed news claim.",
      });
    }

    console.log("\n\n========================================");
    console.log("TRUTHGUARD AI - NEWS VERIFICATION");
    console.log("========================================");

    console.log("User claim:");
    console.log(cleanedInput);


    // ------------------------------------------
    // Search news
    // ------------------------------------------

    const newsResults = await searchNews(
      cleanedInput
    );


    if (newsResults.length === 0) {
      return res.json({
        success: true,

        prediction:
          "Insufficient Evidence",

        confidence: 0,

        explanation:
          "No relevant news sources were found for this claim.",

        message:
          "TruthGuard could not find enough evidence. This does not automatically mean the claim is false.",

        sources: [],
      });
    }


    // ------------------------------------------
    // Take top 5 sources
    // ------------------------------------------

    const selectedArticles =
      newsResults.slice(0, 5);


    console.log(
      `Checking ${selectedArticles.length} sources...`
    );


    // ------------------------------------------
    // Extract article content
    // ------------------------------------------

    const articlesWithContent =
      await Promise.all(
        selectedArticles.map(
          async (article) => {

            let content = "";

            if (article.url) {
              content =
                await extractArticleContent(
                  article.url
                );
            }

            // ----------------------------------
            // FALLBACK TO RSS CONTENT
            // ----------------------------------

            if (!content || content.length < 100) {
              content =
                article.contentSnippet ||
                article.content ||
                "";
            }

            return {
              ...article,
              content,
            };
          }
        )
      );


    // ------------------------------------------
    // Analyze evidence
    // ------------------------------------------

    const analysis =
      analyzeEvidence(
        cleanedInput,
        articlesWithContent
      );


    console.log(
      `Prediction: ${analysis.prediction}`
    );

    console.log(
      `Confidence: ${analysis.confidence}%`
    );


    // ------------------------------------------
    // Format sources for frontend
    // ------------------------------------------

    const sources =
  articlesWithContent.map(
    (article) => {

      let domain = "";

      try {
        domain =
          new URL(article.url).hostname
            .replace("www.", "");
      } catch (error) {
        domain = "Unknown source";
      }

      return {
        title:
          article.title ||
          "Untitled source",

        url:
          article.url || "",

        date:
          article.date || "",

        domain,

        similarity:
          typeof article.similarity === "number"
            ? Math.round(article.similarity * 100)
            : 0,

        contentAvailable:
          Boolean(
            article.content &&
            article.content.length > 0
          ),
      };
    }
  );


    // ------------------------------------------
    // Final response
    // ------------------------------------------

    return res.json({
      success: true,

      prediction:
        analysis.prediction,

      confidence:
        analysis.confidence,

      explanation:
        analysis.explanation,

      message:
        analysis.message,

      sourceCount:
        sources.length,

      sources,
    });

  } catch (error) {

    console.error(
      "Verification error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Something went wrong while verifying the news.",

      error:
        error.message,
    });
  }
});


// ======================================================
// ERROR HANDLER
// ======================================================

app.use(
  (err, req, res, next) => {

    console.error(
      "Server error:",
      err
    );

    res.status(500).json({
      success: false,
      message:
        "Internal server error.",
    });
  }
);


// ======================================================
// START SERVER
// ======================================================

app.listen(PORT, () => {

  console.log("");
  console.log("========================================");
  console.log("TruthGuard AI Backend");
  console.log("========================================");

  console.log(
    `Backend running on http://localhost:${PORT}`
  );

  console.log(
    "Live + historical article analysis enabled."
  );

  console.log(
    "Article extraction + RSS fallback enabled."
  );

  console.log("========================================");
  console.log("");
});
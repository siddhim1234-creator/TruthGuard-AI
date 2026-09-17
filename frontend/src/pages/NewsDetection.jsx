import { useState } from "react";

function NewsDetection() {
  const [newsText, setNewsText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeNews = async () => {
    if (!newsText.trim()) {
      alert("Please enter a news claim or article.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        "http://localhost:5000/api/verify-news",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: newsText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Something went wrong."
        );
      }

      setResult(data);
    } catch (error) {
      console.error("News verification error:", error);

      alert(
        "Could not connect to the TruthGuard backend.\n\n" +
          "Make sure the backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  const getResultClass = (prediction) => {
    if (!prediction) return "";

    const value = prediction.toLowerCase();

    if (
      value.includes("supported") ||
      value.includes("true")
    ) {
      return "result-supported";
    }

    if (
      value.includes("false") ||
      value.includes("fake")
    ) {
      return "result-false";
    }

    if (value.includes("misleading")) {
      return "result-misleading";
    }

    if (value.includes("conflicting")) {
      return "result-conflicting";
    }

    return "result-insufficient";
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    try {
      return new Date(date).toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return date;
    }
  };

  return (
    <div className="page-content">

      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <div className="page-header">
        <div>
          <h1>News Detection</h1>

          <p>
            Verify news claims using live and
            historical evidence.
          </p>
        </div>
      </div>


      {/* ========================================= */}
      {/* INPUT CARD */}
      {/* ========================================= */}

      <div className="card">

        <h2>Analyze a News Claim</h2>

        <p>
          Enter a news statement, headline, or claim
          that you want TruthGuard AI to investigate.
        </p>

        <textarea
          value={newsText}
          onChange={(event) =>
            setNewsText(event.target.value)
          }
          placeholder="Example: India successfully landed Chandrayaan-3 on the Moon in 2023"
          rows={7}
        />

        <button
          className="primary-button"
          onClick={analyzeNews}
          disabled={loading}
        >
          {loading
            ? "Analyzing..."
            : "Analyze News"}
        </button>

      </div>


      {/* ========================================= */}
      {/* HOW IT WORKS */}
      {/* ========================================= */}

      <div className="card">

        <h2>How TruthGuard Works</h2>

        <div className="steps-grid">

          <div className="step-card">
            <div className="step-number">1</div>

            <h3>Submit Claim</h3>

            <p>
              Enter a news statement or article
              for verification.
            </p>
          </div>


          <div className="step-card">
            <div className="step-number">2</div>

            <h3>Search Evidence</h3>

            <p>
              TruthGuard searches live and
              historical news sources.
            </p>
          </div>


          <div className="step-card">
            <div className="step-number">3</div>

            <h3>Analyze Evidence</h3>

            <p>
              Retrieved information is compared
              with the submitted claim.
            </p>
          </div>


          <div className="step-card">
            <div className="step-number">4</div>

            <h3>Generate Result</h3>

            <p>
              The system provides an evidence-based
              assessment and sources.
            </p>
          </div>

        </div>

      </div>


      {/* ========================================= */}
      {/* RESULT */}
      {/* ========================================= */}

      {result && (
        <div className="card result-section">

          <div className="result-header">

            <div>
              <h2>Verification Result</h2>

              <p>
                Analysis based on retrieved evidence.
              </p>
            </div>

            <div
              className={`result-badge ${getResultClass(
                result.prediction
              )}`}
            >
              {result.prediction}
            </div>

          </div>


          {/* ===================================== */}
          {/* CONFIDENCE */}
          {/* ===================================== */}

          <div className="result-stats">

            <div className="result-stat">

              <span>Evidence Strength</span>

              <strong>
                {result.confidence ?? 0}%
              </strong>

            </div>


            <div className="result-stat">

              <span>Sources Checked</span>

              <strong>
                {result.sourceCount ??
                  result.sources?.length ??
                  0}
              </strong>

            </div>

          </div>


          {/* ===================================== */}
          {/* EXPLANATION */}
          {/* ===================================== */}

          <div className="result-analysis">

            <h3>Analysis</h3>

            <p>
              {result.explanation ||
                "No detailed explanation was returned."}
            </p>

            {result.message && (
              <p>
                {result.message}
              </p>
            )}

          </div>


          {/* ===================================== */}
          {/* SOURCES */}
          {/* ===================================== */}

          <div className="sources-section">

            <h3>Evidence Sources</h3>

            {result.sources &&
            result.sources.length > 0 ? (

              <div className="sources-list">

                {result.sources.map(
                  (source, index) => (

                    <div
                      className="source-card"
                      key={
                        source.url ||
                        index
                      }
                    >

                      <div className="source-number">
                        {index + 1}
                      </div>


                      <div className="source-content">

                        <h4>
                          {source.title ||
                            "Untitled source"}
                        </h4>


                        <div className="source-meta">

                          <span>
                            {source.domain ||
                              "Unknown source"}
                          </span>

                          <span>
                            {formatDate(
                              source.date
                            )}
                          </span>

                        </div>


                        {typeof source.similarity ===
                          "number" && (
                          <div className="source-match">

                            Evidence match:{" "}

                            <strong>
                              {source.similarity}%
                            </strong>

                          </div>
                        )}


                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Source →
                          </a>
                        )}

                      </div>

                    </div>

                  )
                )}

              </div>

            ) : (

              <div className="no-sources">

                <p>
                  No usable evidence sources were
                  found for this claim.
                </p>

              </div>

            )}

          </div>


          {/* ===================================== */}
          {/* DISCLAIMER */}
          {/* ===================================== */}

          <div className="result-disclaimer">

            <strong>Important:</strong>

            <span>
              TruthGuard AI provides an automated
              evidence assessment. A lack of matching
              sources does not automatically mean that
              a claim is false. Always verify important
              information using reliable primary sources.
            </span>

          </div>

        </div>
      )}

    </div>
  );
}

export default NewsDetection;
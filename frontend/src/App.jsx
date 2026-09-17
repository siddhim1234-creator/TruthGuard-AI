import "./App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

import NewsDetection from "./pages/NewsDetection";

function AppContent() {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* News Detection Page */}
      <Route path="/news" element={<NewsDetection />} />

      {/* Dashboard */}
      <Route
        path="*"
        element={
          <div className="app">
            {/* Sidebar */}
            <aside className="sidebar">
              <div className="logo">
                <div className="logo-icon">🛡️</div>

                <div>
                  <h2>TruthGuard</h2>
                  <span>AI Detection</span>
                </div>
              </div>

              <nav className="navigation">
                {/* Dashboard */}
                <button
                  className="nav-item active"
                  onClick={() => navigate("/")}
                >
                  <span>📊</span>
                  Dashboard
                </button>

                {/* News Detection */}
                <button
                  className="nav-item"
                  onClick={() => navigate("/news")}
                >
                  <span>📰</span>
                  News Detection
                </button>

                {/* Image Detection - Coming Soon */}
                <button
                  className="nav-item"
                  onClick={() =>
                    alert("Image Detection page is coming soon.")
                  }
                >
                  <span>🖼️</span>
                  Image Detection
                </button>

                {/* Job Detection - Coming Soon */}
                <button
                  className="nav-item"
                  onClick={() =>
                    alert("Job Detection page is coming soon.")
                  }
                >
                  <span>💼</span>
                  Job Detection
                </button>

                {/* History - Coming Soon */}
                <button
                  className="nav-item"
                  onClick={() =>
                    alert("History page is coming soon.")
                  }
                >
                  <span>🕘</span>
                  History
                </button>

                {/* About - Coming Soon */}
                <button
                  className="nav-item"
                  onClick={() =>
                    alert("About page is coming soon.")
                  }
                >
                  <span>ℹ️</span>
                  About
                </button>
              </nav>

              <div className="sidebar-bottom">
                <div className="security-box">
                  <span className="security-icon">🔒</span>

                  <div>
                    <strong>Protected Analysis</strong>
                    <p>Your data stays secure.</p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
              {/* Top Bar */}
              <header className="topbar">
                <div>
                  <p className="breadcrumb">Dashboard</p>
                  <h1>TruthGuard AI</h1>
                </div>

                <div className="user-area">
                  <div className="status-dot"></div>
                  <span>System Ready</span>
                  <div className="avatar">S</div>
                </div>
              </header>

              {/* Welcome Section */}
              <section className="welcome-section">
                <div>
                  <p className="small-label">
                    AI-POWERED VERIFICATION
                  </p>

                  <h2>
                    Detect misinformation with confidence.
                  </h2>

                  <p>
                    Analyze news articles, images and job postings
                    using machine-learning based detection systems.
                  </p>
                </div>
              </section>

              {/* Detection Cards */}
              <section>
                <div className="section-heading">
                  <h2>Choose an Analysis</h2>

                  <p>
                    Select what you want TruthGuard AI to analyze.
                  </p>
                </div>

                <div className="detection-grid">
                  {/* News */}
                  <div className="detection-card">
                    <div className="card-icon news-icon">
                      📰
                    </div>

                    <span className="card-tag">
                      TEXT ANALYSIS
                    </span>

                    <h3>News Detection</h3>

                    <p>
                      Analyze news articles and identify patterns
                      associated with potentially fake or unreliable
                      information.
                    </p>

                    <button
                      className="analyze-button"
                      onClick={() => navigate("/news")}
                    >
                      Analyze News →
                    </button>
                  </div>

                  {/* Image */}
                  <div className="detection-card">
                    <div className="card-icon image-icon">
                      🖼️
                    </div>

                    <span className="card-tag">
                      IMAGE ANALYSIS
                    </span>

                    <h3>Image Detection</h3>

                    <p>
                      Check whether an image shows characteristics
                      associated with AI-generated or synthetic
                      content.
                    </p>

                    <button
                      className="analyze-button"
                      onClick={() =>
                        alert(
                          "Image Detection page is coming soon."
                        )
                      }
                    >
                      Analyze Image →
                    </button>
                  </div>

                  {/* Job */}
                  <div className="detection-card">
                    <div className="card-icon job-icon">
                      💼
                    </div>

                    <span className="card-tag">
                      FRAUD ANALYSIS
                    </span>

                    <h3>Job Detection</h3>

                    <p>
                      Analyze job postings for patterns associated
                      with potentially fraudulent employment
                      opportunities.
                    </p>

                    <button
                      className="analyze-button"
                      onClick={() =>
                        alert(
                          "Job Detection page is coming soon."
                        )
                      }
                    >
                      Analyze Job →
                    </button>
                  </div>
                </div>
              </section>

              {/* Statistics */}
              <section className="statistics-section">
                <div className="section-heading">
                  <h2>Analysis Overview</h2>

                  <p>Your verification activity.</p>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-icon">🔎</span>

                    <div>
                      <p>Total Analyses</p>
                      <h3>0</h3>
                    </div>
                  </div>

                  <div className="stat-card">
                    <span className="stat-icon">📰</span>

                    <div>
                      <p>News Checked</p>
                      <h3>0</h3>
                    </div>
                  </div>

                  <div className="stat-card">
                    <span className="stat-icon">🖼️</span>

                    <div>
                      <p>Images Checked</p>
                      <h3>0</h3>
                    </div>
                  </div>

                  <div className="stat-card">
                    <span className="stat-icon">💼</span>

                    <div>
                      <p>Jobs Checked</p>
                      <h3>0</h3>
                    </div>
                  </div>
                </div>
              </section>

              {/* Recent Activity */}
              <section className="activity-section">
                <div className="section-heading">
                  <h2>Recent Activity</h2>

                  <p>
                    Your latest verification results will appear
                    here.
                  </p>
                </div>

                <div className="empty-activity">
                  <div>📋</div>

                  <h3>No analyses yet</h3>

                  <p>
                    Start by selecting News, Image or Job Detection
                    above.
                  </p>
                </div>
              </section>

              {/* Disclaimer */}
              <footer className="disclaimer">
                ⚠️ AI predictions are probabilistic and should not
                be treated as definitive proof. Always verify
                important information using reliable sources.
              </footer>
            </main>
          </div>
        }
      />
    </Routes>
  );
}

/* Main App */
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
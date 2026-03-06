import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function VerifyCertificate() {
  const navigate = useNavigate();
  const [certId, setCertId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // holds verification result

  const handleVerify = async () => {
    if (!certId.trim()) return setError("Please enter a certificate ID.");
    setLoading(true);
    setError("");
    setResult(null);

    try {
      // First get full cert details from MongoDB
      const dbRes = await API.get(`/cert/${certId.trim()}`);
      const cert = dbRes.data;

      // Then verify on blockchain
      let blockchainData = null;
      try {
        const bcRes = await API.get(`/cert/verify/${certId.trim()}`);
        blockchainData = bcRes.data;
      } catch (bcErr) {
        console.warn("Blockchain verify failed:", bcErr.message);
      }

      setResult({ cert, blockchainData });
    } catch (err) {
      if (err.response?.status === 404) {
        setError("No certificate found with this ID. Please check and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleVerify();
  };

  const isValid = result && !result.cert?.isRevoked;

  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* Background */}
      <div style={styles.gridBg} />
      <div style={styles.glowTop} />

      {/* Top bar */}
      <div style={styles.topBar}>
        <div style={styles.logo} onClick={() => navigate("/")}>
          <span style={styles.logoMark}>VX</span>
          <span style={styles.logoText}>VerifyX</span>
        </div>
        <div style={styles.topRight}>
          <span style={styles.topLink} onClick={() => navigate("/")}>Home</span>
          <span style={styles.topLink} onClick={() => navigate("/login")}>Issuer Login →</span>
        </div>
      </div>

      {/* Hero */}
      <div style={styles.hero}>
        <span style={styles.heroTag}>Public Verification</span>
        <h1 style={styles.heroTitle}>
          Verify a Certificate
        </h1>
        <p style={styles.heroSub}>
          Enter a certificate ID below to instantly verify its authenticity on the blockchain.
          No login required.
        </p>

        {/* Search box */}
        <div style={styles.searchWrap}>
          <input
            style={styles.searchInput}
            className="vx-search"
            type="text"
            placeholder="Enter Certificate ID — e.g. VX-2026-a3f9c12e-8b4d"
            value={certId}
            onChange={(e) => { setCertId(e.target.value); setError(""); setResult(null); }}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button
            style={{ ...styles.searchBtn, opacity: loading ? 0.7 : 1 }}
            className="vx-btn"
            onClick={handleVerify}
            disabled={loading}
          >
            {loading
              ? <span style={styles.loadingRow}><span className="spinner" /> Verifying...</span>
              : "Verify →"
            }
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBox} className="result-fadein">
            <span style={styles.errorIcon}>✕</span>
            <div>
              <div style={styles.errorTitle}>Certificate Not Found</div>
              <div style={styles.errorSub}>{error}</div>
            </div>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div style={styles.resultWrap} className="result-fadein">

          {/* Status banner */}
          <div style={{
            ...styles.statusBanner,
            background: isValid ? "rgba(42,245,152,0.06)" : "rgba(255,107,107,0.06)",
            border: `1px solid ${isValid ? "rgba(42,245,152,0.25)" : "rgba(255,107,107,0.25)"}`,
          }}>
            <div style={{
              ...styles.statusIcon,
              background: isValid ? "rgba(42,245,152,0.15)" : "rgba(255,107,107,0.15)",
              color: isValid ? "#2af598" : "#ff6b6b",
              border: `1px solid ${isValid ? "rgba(42,245,152,0.3)" : "rgba(255,107,107,0.3)"}`,
            }}>
              {isValid ? "✓" : "✕"}
            </div>
            <div>
              <div style={{
                ...styles.statusTitle,
                color: isValid ? "#2af598" : "#ff6b6b",
              }}>
                {isValid ? "Certificate is Valid" : "Certificate has been Revoked"}
              </div>
              <div style={styles.statusSub}>
                {isValid
                  ? "This certificate is authentic and has been verified on the blockchain."
                  : "This certificate was revoked and is no longer valid."}
              </div>
            </div>
          </div>

          {/* Certificate details */}
          <div style={styles.detailsGrid}>

            {/* Left — cert info */}
            <div style={styles.detailsCard}>
              <div style={styles.detailsHeader}>Certificate Details</div>

              <div style={styles.certPreview}>
                <div style={styles.certTop}>
                  <span style={styles.certLogoMark}>VX</span>
                  <span style={styles.certPlatform}>VerifyX</span>
                  <span style={{
                    ...styles.certStatus,
                    color: isValid ? "#2af598" : "#ff6b6b",
                  }}>
                    {isValid ? "✓ VERIFIED" : "✕ REVOKED"}
                  </span>
                </div>

                <div style={styles.certMeta}>Certificate of Achievement</div>

                <div style={styles.certRecipientLabel}>This certifies that</div>
                <div style={styles.certRecipient}>{result.cert.recipientName}</div>

                <div style={styles.certRecipientLabel}>has successfully completed</div>
                <div style={styles.certCourse}>{result.cert.courseName}</div>

                <div style={styles.certFooter}>
                  <div>
                    <div style={styles.certFooterVal}>{result.cert.issuerName}</div>
                    <div style={styles.certFooterLabel}>Issued by</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={styles.certFooterVal}>
                      {new Date(result.cert.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </div>
                    <div style={styles.certFooterLabel}>Date Issued</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — blockchain proof */}
            <div style={styles.proofCard}>
              <div style={styles.detailsHeader}>Blockchain Proof</div>

              <div style={styles.proofRows}>
                {[
                  ["Certificate ID", result.cert.certId],
                  ["Recipient Email", result.cert.recipientEmail],
                  ["Transaction Hash", result.cert.txHash || "Pending"],
                  ["IPFS Hash", result.cert.ipfsHash || "Pending"],
                  ["Status", result.cert.isRevoked ? "Revoked" : "Active"],
                  ...(result.cert.isRevoked ? [
                    ["Revoked At", new Date(result.cert.revokedAt).toLocaleDateString()],
                    ["Reason", result.cert.revokeReason || "No reason provided"],
                  ] : []),
                ].map(([label, value]) => (
                  <div key={label} style={styles.proofRow}>
                    <div style={styles.proofLabel}>{label}</div>
                    <div style={{
                      ...styles.proofValue,
                      color: label === "Status"
                        ? (result.cert.isRevoked ? "#ff6b6b" : "#2af598")
                        : "#e8eaf0"
                    }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* IPFS link */}
              {result.cert.ipfsUrl && (
                <a
                  href={result.cert.ipfsUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.ipfsLink}
                  className="ipfs-link"
                >
                  View on IPFS →
                </a>
              )}

              {/* View full detail */}
              <button
                style={styles.viewBtn}
                className="view-btn"
                onClick={() => navigate(`/certificate/${result.cert.certId}`)}
              >
                View Full Certificate →
              </button>
            </div>
          </div>

          {/* Verify another */}
          <div style={styles.verifyAnother}>
            <span
              style={styles.verifyAnotherBtn}
              onClick={() => { setResult(null); setCertId(""); setError(""); }}
            >
              ← Verify another certificate
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      {!result && (
        <div style={styles.footer}>
          <div style={styles.footerNote}>
            🔒 Verification is free, public, and requires no account.
            Certificate data is stored on the blockchain and cannot be altered.
          </div>
        </div>
      )}
    </div>
  );
}

/* ── STYLES ── */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#050810",
    color: "#e8eaf0",
    fontFamily: "'Syne', sans-serif",
    position: "relative",
    overflowX: "hidden",
  },
  gridBg: {
    position: "fixed", inset: 0,
    backgroundImage:
      "linear-gradient(rgba(42,245,152,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(42,245,152,0.03) 1px, transparent 1px)",
    backgroundSize: "50px 50px",
    pointerEvents: "none", zIndex: 0,
  },
  glowTop: {
    position: "fixed", top: -200, left: "50%",
    transform: "translateX(-50%)",
    width: 700, height: 400,
    background: "rgba(42,245,152,0.06)",
    borderRadius: "50%", filter: "blur(100px)",
    pointerEvents: "none", zIndex: 0,
  },
  topBar: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", padding: "24px 48px",
    position: "relative", zIndex: 2,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  logo: {
    display: "flex", alignItems: "center",
    gap: 10, cursor: "pointer",
  },
  logoMark: {
    background: "#2af598", color: "#050810",
    fontWeight: 800, fontSize: 13,
    padding: "3px 7px", letterSpacing: "0.05em",
  },
  logoText: { fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" },
  topRight: { display: "flex", alignItems: "center", gap: 24 },
  topLink: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 13, color: "rgba(232,234,240,0.4)",
    cursor: "pointer", transition: "color 0.2s",
  },
  hero: {
    maxWidth: 720, margin: "0 auto",
    padding: "80px 24px 48px",
    textAlign: "center",
    position: "relative", zIndex: 2,
  },
  heroTag: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11, color: "#2af598",
    border: "1px solid rgba(42,245,152,0.3)",
    padding: "4px 12px", letterSpacing: "0.1em",
    textTransform: "uppercase",
    display: "inline-block", marginBottom: 20,
  },
  heroTitle: {
    fontSize: "clamp(32px, 5vw, 56px)",
    fontWeight: 800, letterSpacing: "-0.03em",
    lineHeight: 1.1, marginBottom: 16,
  },
  heroSub: {
    fontSize: 15, color: "rgba(232,234,240,0.5)",
    fontFamily: "'DM Mono', monospace", fontWeight: 300,
    lineHeight: 1.7, marginBottom: 40,
  },
  searchWrap: {
    display: "flex", gap: 0,
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 2, overflow: "hidden",
    background: "rgba(255,255,255,0.03)",
    transition: "border-color 0.2s",
    marginBottom: 16,
  },
  searchInput: {
    flex: 1, background: "transparent",
    border: "none", color: "#e8eaf0",
    padding: "16px 20px", fontSize: 14,
    fontFamily: "'DM Mono', monospace",
    fontWeight: 300, outline: "none",
  },
  searchBtn: {
    background: "#2af598", color: "#050810",
    border: "none", padding: "16px 32px",
    fontSize: 15, fontWeight: 700,
    fontFamily: "'Syne', sans-serif",
    cursor: "pointer", flexShrink: 0,
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  errorBox: {
    display: "flex", alignItems: "flex-start",
    gap: 16, padding: "16px 20px",
    background: "rgba(255,107,107,0.06)",
    border: "1px solid rgba(255,107,107,0.2)",
    borderRadius: 2, textAlign: "left",
    marginTop: 8,
  },
  errorIcon: {
    width: 32, height: 32, borderRadius: "50%",
    background: "rgba(255,107,107,0.15)",
    border: "1px solid rgba(255,107,107,0.3)",
    display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 14,
    color: "#ff6b6b", flexShrink: 0,
    lineHeight: "32px", textAlign: "center",
  },
  errorTitle: {
    fontSize: 14, fontWeight: 700,
    color: "#ff6b6b", marginBottom: 4,
  },
  errorSub: {
    fontSize: 12, color: "rgba(232,234,240,0.4)",
    fontFamily: "'DM Mono', monospace", fontWeight: 300,
  },
  resultWrap: {
    maxWidth: 1000, margin: "0 auto",
    padding: "0 24px 80px",
    position: "relative", zIndex: 2,
  },
  statusBanner: {
    display: "flex", alignItems: "center",
    gap: 20, padding: "24px 28px",
    borderRadius: 2, marginBottom: 24,
  },
  statusIcon: {
    width: 52, height: 52, borderRadius: "50%",
    display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 22,
    fontWeight: 700, flexShrink: 0,
  },
  statusTitle: {
    fontSize: 22, fontWeight: 800,
    letterSpacing: "-0.02em", marginBottom: 4,
  },
  statusSub: {
    fontSize: 13, color: "rgba(232,234,240,0.5)",
    fontFamily: "'DM Mono', monospace", fontWeight: 300,
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20, marginBottom: 24,
  },
  detailsCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 2, padding: "28px",
  },
  proofCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 2, padding: "28px",
  },
  detailsHeader: {
    fontSize: 11, fontWeight: 600,
    letterSpacing: "0.08em", textTransform: "uppercase",
    color: "rgba(232,234,240,0.35)",
    fontFamily: "'DM Mono', monospace",
    marginBottom: 20,
  },
  certPreview: {
    background: "linear-gradient(135deg, #0d1117, #111827)",
    border: "1px solid rgba(42,245,152,0.15)",
    borderRadius: 2, padding: "24px",
  },
  certTop: {
    display: "flex", alignItems: "center",
    gap: 8, marginBottom: 20,
  },
  certLogoMark: {
    background: "#2af598", color: "#050810",
    fontWeight: 800, fontSize: 11,
    padding: "2px 6px",
  },
  certPlatform: {
    fontSize: 13, fontWeight: 700,
    letterSpacing: "-0.01em", flex: 1,
  },
  certStatus: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11, fontWeight: 500,
    letterSpacing: "0.05em",
  },
  certMeta: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10, color: "rgba(42,245,152,0.5)",
    letterSpacing: "0.1em", textTransform: "uppercase",
    marginBottom: 20,
  },
  certRecipientLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10, color: "rgba(232,234,240,0.3)",
    marginBottom: 4,
  },
  certRecipient: {
    fontSize: 22, fontWeight: 800,
    letterSpacing: "-0.02em", marginBottom: 16,
  },
  certCourse: {
    fontSize: 14, fontWeight: 600,
    color: "#2af598", marginBottom: 20,
  },
  certFooter: {
    display: "flex", justifyContent: "space-between",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    paddingTop: 16,
  },
  certFooterVal: {
    fontSize: 13, fontWeight: 600, marginBottom: 4,
  },
  certFooterLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10, color: "rgba(232,234,240,0.3)",
  },
  proofRows: {
    display: "flex", flexDirection: "column", gap: 0,
    marginBottom: 20,
  },
  proofRow: {
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  proofLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10, color: "rgba(232,234,240,0.3)",
    textTransform: "uppercase", letterSpacing: "0.05em",
    marginBottom: 4,
  },
  proofValue: {
    fontSize: 12, fontWeight: 600,
    fontFamily: "'DM Mono', monospace",
    wordBreak: "break-all",
  },
  ipfsLink: {
    display: "block",
    fontFamily: "'DM Mono', monospace",
    fontSize: 12, color: "#2af598",
    textDecoration: "none", marginBottom: 12,
    transition: "opacity 0.2s",
  },
  viewBtn: {
    width: "100%", background: "#2af598",
    color: "#050810", border: "none",
    padding: "13px 24px", fontSize: 14,
    fontWeight: 700, fontFamily: "'Syne', sans-serif",
    cursor: "pointer", transition: "all 0.2s",
    clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
  },
  verifyAnother: {
    textAlign: "center", paddingTop: 8,
  },
  verifyAnotherBtn: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 13, color: "rgba(232,234,240,0.35)",
    cursor: "pointer", transition: "color 0.2s",
  },
  footer: {
    position: "relative", zIndex: 2,
    padding: "48px 24px 80px",
    textAlign: "center",
  },
  footerNote: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 13, color: "rgba(232,234,240,0.2)",
    lineHeight: 1.7, maxWidth: 500, margin: "0 auto",
  },
  loadingRow: {
    display: "flex", alignItems: "center",
    justifyContent: "center", gap: 10,
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  .vx-search:focus { outline: none; }
  .vx-search::placeholder { color: rgba(232,234,240,0.2); }

  .vx-search:focus ~ * { border-color: rgba(42,245,152,0.4); }

  .searchWrap:focus-within {
    border-color: rgba(42,245,152,0.4) !important;
  }

  .vx-btn:hover:not(:disabled) {
    background: #fff !important;
  }

  .view-btn:hover {
    background: #fff !important;
    box-shadow: 0 6px 24px rgba(42,245,152,0.2);
    transform: translateY(-1px);
  }

  .ipfs-link:hover { opacity: 0.7; }

  .topLink:hover { color: rgba(232,234,240,0.8) !important; }

  .verifyAnotherBtn:hover { color: rgba(232,234,240,0.6) !important; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .result-fadein {
    animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid rgba(5,8,16,0.3);
    border-top-color: #050810;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @media (max-width: 700px) {
    .detailsGrid { grid-template-columns: 1fr !important; }
    .topBar { padding: 20px 24px !important; }
    .hero { padding: 48px 20px 32px !important; }
    .searchWrap { flex-direction: column; }
    .searchBtn { width: 100%; }
  }
`;
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";

export default function CertificateDetail() {
  const { certId } = useParams();
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCert();
  }, [certId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCert = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get(`/cert/${certId}`);
      setCert(res.data);
    } catch (err) {
      setError("Certificate not found.");
    } finally {
      setLoading(false);
    }
  };

  const isValid = cert && !cert.isRevoked;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });

  if (loading) return (
    <div style={styles.loadingPage}>
      <style>{css}</style>
      <span className="spinner-lg" />
      <p style={styles.loadingText}>Loading certificate...</p>
    </div>
  );

  if (error) return (
    <div style={styles.loadingPage}>
      <style>{css}</style>
      <div style={styles.errorIcon}>✕</div>
      <p style={styles.errorText}>{error}</p>
      <button style={styles.backBtn} onClick={() => navigate("/verify")}>
        ← Back to Verify
      </button>
    </div>
  );

  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* Background */}
      <div style={styles.gridBg} />
      <div style={{
        ...styles.glow,
        background: isValid
          ? "rgba(42,245,152,0.07)"
          : "rgba(255,107,107,0.07)",
      }} />

      {/* Top bar */}
      <div style={styles.topBar}>
        <div style={styles.logo} onClick={() => navigate("/")}>
          <span style={styles.logoMark}>VX</span>
          <span style={styles.logoText}>VerifyX</span>
        </div>
        <div style={styles.topRight}>
          <span style={styles.topLink} onClick={() => navigate("/verify")}>
            ← Verify another
          </span>
        </div>
      </div>

      <div style={styles.content}>

        {/* Status pill */}
        <div style={styles.statusRow} className="fadein">
          <div style={{
            ...styles.statusPill,
            background: isValid ? "rgba(42,245,152,0.1)" : "rgba(255,107,107,0.1)",
            border: `1px solid ${isValid ? "rgba(42,245,152,0.3)" : "rgba(255,107,107,0.3)"}`,
            color: isValid ? "#2af598" : "#ff6b6b",
          }}>
            {isValid ? "✓ Certificate Valid" : "✕ Certificate Revoked"}
          </div>
        </div>

        {/* Main certificate card */}
        <div style={styles.certCard} className="fadein-delay-1">

          {/* Certificate visual */}
          <div style={styles.certVisual}>
            {/* Header */}
            <div style={styles.certHeader}>
              <div style={styles.certBranding}>
                <span style={styles.certLogoMark}>VX</span>
                <span style={styles.certBrandName}>VerifyX</span>
              </div>
              <div style={styles.certHeaderRight}>
                <span style={{
                  ...styles.certStatusBadge,
                  color: isValid ? "#2af598" : "#ff6b6b",
                  borderColor: isValid ? "rgba(42,245,152,0.3)" : "rgba(255,107,107,0.3)",
                }}>
                  {isValid ? "✓ VERIFIED" : "✕ REVOKED"}
                </span>
              </div>
            </div>

            {/* Decorative line */}
            <div style={{
              ...styles.certAccentLine,
              background: isValid
                ? "linear-gradient(90deg, #2af598, transparent)"
                : "linear-gradient(90deg, #ff6b6b, transparent)",
            }} />

            {/* Body */}
            <div style={styles.certBody}>
              <div style={styles.certSubtitle}>Certificate of Achievement</div>

              <div style={styles.certPresents}>This certifies that</div>
              <div style={styles.certRecipient}>{cert.recipientName}</div>

              <div style={styles.certPresents}>has successfully completed</div>
              <div style={styles.certCourse}>{cert.courseName}</div>
            </div>

            {/* Footer */}
            <div style={styles.certFooterRow}>
              <div style={styles.certFooterItem}>
                <div style={styles.certFooterVal}>{cert.issuerName}</div>
                <div style={styles.certFooterLabel}>Issued by</div>
              </div>
              <div style={styles.certFooterItem}>
                <div style={styles.certFooterVal}>{formatDate(cert.createdAt)}</div>
                <div style={styles.certFooterLabel}>Date of Issue</div>
              </div>
              <div style={styles.certFooterItem}>
                <div style={{ ...styles.certFooterVal, fontSize: 11, wordBreak: "break-all" }}>
                  {cert.certId}
                </div>
                <div style={styles.certFooterLabel}>Certificate ID</div>
              </div>
            </div>

            {/* QR code */}
            {cert.qrCodeUrl && (
              <div style={styles.qrWrap}>
                <img src={cert.qrCodeUrl} alt="QR Code" style={styles.qrImg} />
                <div style={styles.qrLabel}>Scan to verify</div>
              </div>
            )}

            {/* Blockchain stamp */}
            <div style={styles.blockchainStamp}>
              <span style={styles.stampDot} />
              Anchored on Blockchain · Stored on IPFS · Powered by VerifyX
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div style={styles.infoGrid} className="fadein-delay-2">

          {/* Blockchain details */}
          <div style={styles.infoCard}>
            <div style={styles.infoCardHeader}>
              <span style={styles.infoCardIcon}>⛓</span>
              Blockchain Details
            </div>
            <div style={styles.infoRows}>
              {[
                ["Transaction Hash", cert.txHash || "Pending"],
                ["Contract Address", cert.blockchainAddress || "—"],
                ["Network", "Polygon Amoy (Local)"],
                ["Anchored", cert.txHash ? "Yes ✓" : "Pending"],
              ].map(([label, value]) => (
                <div key={label} style={styles.infoRow}>
                  <div style={styles.infoLabel}>{label}</div>
                  <div style={styles.infoValue}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* IPFS details */}
          <div style={styles.infoCard}>
            <div style={styles.infoCardHeader}>
              <span style={styles.infoCardIcon}>📦</span>
              IPFS Storage
            </div>
            <div style={styles.infoRows}>
              {[
                ["IPFS Hash", cert.ipfsHash || "Pending"],
                ["Storage", cert.ipfsUrl ? "Pinata ✓" : "Pending"],
              ].map(([label, value]) => (
                <div key={label} style={styles.infoRow}>
                  <div style={styles.infoLabel}>{label}</div>
                  <div style={styles.infoValue}>{value}</div>
                </div>
              ))}
              {cert.ipfsUrl && (
                <a
                  href={cert.ipfsUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.externalLink}
                  className="ext-link"
                >
                  View on IPFS →
                </a>
              )}
            </div>
          </div>

          {/* Revocation info (only if revoked) */}
          {cert.isRevoked && (
            <div style={{ ...styles.infoCard, borderColor: "rgba(255,107,107,0.2)" }}>
              <div style={{ ...styles.infoCardHeader, color: "#ff6b6b" }}>
                <span style={styles.infoCardIcon}>🚫</span>
                Revocation Details
              </div>
              <div style={styles.infoRows}>
                {[
                  ["Revoked On", formatDate(cert.revokedAt)],
                  ["Reason", cert.revokeReason || "No reason provided"],
                ].map(([label, value]) => (
                  <div key={label} style={styles.infoRow}>
                    <div style={styles.infoLabel}>{label}</div>
                    <div style={{ ...styles.infoValue, color: "#ff6b6b" }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={styles.actions} className="fadein-delay-3">
          <button
            style={styles.primaryBtn}
            className="primary-btn"
            onClick={() => navigate("/verify")}
          >
            Verify Another Certificate
          </button>
          <button
            style={styles.outlineBtn}
            className="outline-btn"
            onClick={() => window.print()}
          >
            Print / Save as PDF
          </button>
          <button
            style={styles.outlineBtn}
            className="outline-btn"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Link copied to clipboard!");
            }}
          >
            Copy Link
          </button>
        </div>

      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerText}>
          VerifyX — Blockchain Certificate Verification · Built for Hackathon 2026
        </div>
      </footer>
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
  loadingPage: {
    minHeight: "100vh",
    background: "#050810",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: 16, fontFamily: "'Syne', sans-serif",
    color: "#e8eaf0",
  },
  loadingText: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 13, color: "rgba(232,234,240,0.35)",
  },
  errorIcon: {
    width: 60, height: 60, borderRadius: "50%",
    border: "2px solid #ff6b6b",
    display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 24,
    color: "#ff6b6b",
  },
  errorText: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 14, color: "rgba(232,234,240,0.5)",
  },
  backBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(232,234,240,0.6)", padding: "10px 20px",
    fontSize: 13, fontFamily: "'Syne', sans-serif",
    fontWeight: 600, cursor: "pointer", borderRadius: 2,
  },
  gridBg: {
    position: "fixed", inset: 0,
    backgroundImage:
      "linear-gradient(rgba(42,245,152,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(42,245,152,0.025) 1px, transparent 1px)",
    backgroundSize: "50px 50px",
    pointerEvents: "none", zIndex: 0,
  },
  glow: {
    position: "fixed", top: -200, left: "50%",
    transform: "translateX(-50%)",
    width: 800, height: 500,
    borderRadius: "50%", filter: "blur(120px)",
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
  topRight: {},
  topLink: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 13, color: "rgba(232,234,240,0.4)",
    cursor: "pointer", transition: "color 0.2s",
  },
  content: {
    maxWidth: 900, margin: "0 auto",
    padding: "48px 24px 80px",
    position: "relative", zIndex: 2,
  },
  statusRow: {
    display: "flex", justifyContent: "center",
    marginBottom: 32,
  },
  statusPill: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 13, fontWeight: 500,
    padding: "8px 24px", borderRadius: 100,
    letterSpacing: "0.03em",
  },
  certCard: {
    marginBottom: 24,
  },
  certVisual: {
    background: "linear-gradient(135deg, #0a0f1a 0%, #0d1520 50%, #0a0f1a 100%)",
    border: "1px solid rgba(42,245,152,0.15)",
    borderRadius: 4,
    padding: "40px",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 0 80px rgba(42,245,152,0.06), 0 32px 80px rgba(0,0,0,0.4)",
  },
  certHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 8,
  },
  certBranding: {
    display: "flex", alignItems: "center", gap: 10,
  },
  certLogoMark: {
    background: "#2af598", color: "#050810",
    fontWeight: 800, fontSize: 13,
    padding: "3px 8px", letterSpacing: "0.05em",
  },
  certBrandName: {
    fontWeight: 700, fontSize: 18,
    letterSpacing: "-0.02em",
  },
  certHeaderRight: {},
  certStatusBadge: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12, fontWeight: 500,
    border: "1px solid",
    padding: "4px 12px", letterSpacing: "0.05em",
  },
  certAccentLine: {
    height: 2, marginBottom: 36,
    borderRadius: 1,
  },
  certBody: {
    marginBottom: 36,
  },
  certSubtitle: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11, color: "rgba(42,245,152,0.5)",
    letterSpacing: "0.15em", textTransform: "uppercase",
    marginBottom: 28,
  },
  certPresents: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12, color: "rgba(232,234,240,0.35)",
    marginBottom: 8,
  },
  certRecipient: {
    fontSize: "clamp(28px, 4vw, 48px)",
    fontWeight: 800, letterSpacing: "-0.03em",
    marginBottom: 24, lineHeight: 1.1,
  },
  certCourse: {
    fontSize: 20, fontWeight: 700,
    color: "#2af598", letterSpacing: "-0.01em",
  },
  certFooterRow: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
    gap: 24, borderTop: "1px solid rgba(255,255,255,0.07)",
    paddingTop: 24, marginBottom: 24,
  },
  certFooterItem: {},
  certFooterVal: {
    fontSize: 14, fontWeight: 700,
    marginBottom: 4, letterSpacing: "-0.01em",
  },
  certFooterLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10, color: "rgba(232,234,240,0.3)",
    textTransform: "uppercase", letterSpacing: "0.05em",
  },
  qrWrap: {
    position: "absolute",
    bottom: 40, right: 40,
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 6,
  },
  qrImg: {
    width: 90, height: 90,
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 2,
    background: "#fff",
    padding: 4,
  },
  qrLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 9, color: "rgba(232,234,240,0.25)",
    letterSpacing: "0.05em", textTransform: "uppercase",
  },
  blockchainStamp: {
    display: "flex", alignItems: "center", gap: 8,
    fontFamily: "'DM Mono', monospace",
    fontSize: 10, color: "rgba(232,234,240,0.15)",
    letterSpacing: "0.04em",
  },
  stampDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#2af598", opacity: 0.4, flexShrink: 0,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16, marginBottom: 28,
  },
  infoCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 2, padding: "24px",
  },
  infoCardHeader: {
    display: "flex", alignItems: "center", gap: 10,
    fontSize: 13, fontWeight: 700,
    letterSpacing: "-0.01em", marginBottom: 20,
    color: "rgba(232,234,240,0.7)",
  },
  infoCardIcon: { fontSize: 16 },
  infoRows: { display: "flex", flexDirection: "column", gap: 0 },
  infoRow: {
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  infoLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10, color: "rgba(232,234,240,0.3)",
    textTransform: "uppercase", letterSpacing: "0.05em",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 12, fontWeight: 600,
    fontFamily: "'DM Mono', monospace",
    color: "#e8eaf0", wordBreak: "break-all",
  },
  externalLink: {
    display: "inline-block", marginTop: 12,
    fontFamily: "'DM Mono', monospace",
    fontSize: 12, color: "#2af598",
    textDecoration: "none",
  },
  actions: {
    display: "flex", gap: 12, flexWrap: "wrap",
  },
  primaryBtn: {
    background: "#2af598", color: "#050810",
    border: "none", padding: "13px 28px",
    fontSize: 14, fontWeight: 700,
    fontFamily: "'Syne', sans-serif",
    cursor: "pointer", transition: "all 0.2s",
    clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
  },
  outlineBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(232,234,240,0.6)", padding: "12px 24px",
    fontSize: 14, fontWeight: 600,
    fontFamily: "'Syne', sans-serif",
    cursor: "pointer", borderRadius: 2, transition: "all 0.2s",
  },
  footer: {
    borderTop: "1px solid rgba(255,255,255,0.05)",
    padding: "24px 48px", position: "relative", zIndex: 2,
  },
  footerText: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11, color: "rgba(232,234,240,0.15)",
    textAlign: "center", letterSpacing: "0.04em",
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  .primary-btn:hover {
    background: #fff !important;
    box-shadow: 0 6px 24px rgba(42,245,152,0.25);
    transform: translateY(-1px);
  }
  .outline-btn:hover {
    border-color: rgba(232,234,240,0.25) !important;
    color: #e8eaf0 !important;
  }
  .ext-link:hover { opacity: 0.7; }
  .topLink:hover { color: rgba(232,234,240,0.7) !important; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fadein { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .fadein-delay-1 { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
  .fadein-delay-2 { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
  .fadein-delay-3 { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s both; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner-lg {
    display: inline-block;
    width: 32px; height: 32px;
    border: 2px solid rgba(232,234,240,0.1);
    border-top-color: #2af598;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @media print {
    .topBar, .actions, footer { display: none !important; }
    .page { background: #fff !important; color: #000 !important; }
    .certVisual { border: 1px solid #ccc !important; box-shadow: none !important; }
  }

  @media (max-width: 600px) {
    .certFooterRow { grid-template-columns: 1fr !important; }
    .qrWrap { position: static !important; margin-top: 24px; }
    .topBar { padding: 20px 24px !important; }
  }
`;
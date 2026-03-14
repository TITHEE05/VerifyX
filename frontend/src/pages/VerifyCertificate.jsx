import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import API from "../api/axios";

export default function VerifyCertificate() {
  const navigate = useNavigate();
  const [certId, setCertId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scanning, setScanning] = useState(false);

  const html5QrCodeRef = useRef(null);
  const scannerDivId = "qr-reader";

  const startScanner = async () => {
    setScannerOpen(true);
    setScannerError("");
    setScanning(false);
  };

  useEffect(() => {
    if (!scannerOpen) return;
    const timer = setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerDivId);
        html5QrCodeRef.current = html5QrCode;
        setScanning(true);
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => { handleQrSuccess(decodedText, html5QrCode); },
          () => {}
        );
      } catch (err) {
        setScannerError("Could not access camera. Please allow camera permission or use manual entry.");
        setScanning(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [scannerOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQrSuccess = async (decodedText, html5QrCode) => {
    try { await html5QrCode.stop(); html5QrCodeRef.current = null; } catch (e) {}
    setScannerOpen(false);
    setScanning(false);

    let extractedId = decodedText;
    if (decodedText.includes("/certificate/")) {
      extractedId = decodedText.split("/certificate/")[1];
    } else if (decodedText.includes("/verify/")) {
      extractedId = decodedText.split("/verify/")[1];
    }
    extractedId = extractedId?.trim();
    if (!extractedId) { setError("Could not read certificate ID from QR code."); return; }

    setCertId(extractedId);
    await handleVerify(extractedId);
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.stop(); html5QrCodeRef.current = null; } catch (e) {}
    }
    setScannerOpen(false);
    setScanning(false);
    setScannerError("");
  };

  const handleVerify = async (id) => {
    const idToVerify = id || certId;
    if (!idToVerify?.trim()) return setError("Please enter a certificate ID.");
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const dbRes = await API.get(`/cert/${idToVerify.trim()}`);
      const cert = dbRes.data;
      let blockchainData = null;
      try {
        const bcRes = await API.get(`/cert/verify/${idToVerify.trim()}`);
        blockchainData = bcRes.data;
      } catch (bcErr) { console.warn("Blockchain verify failed:", bcErr.message); }
      setResult({ cert, blockchainData });
    } catch (err) {
      if (err.response?.status === 404) {
        setError("No certificate found with this ID. Please check and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally { setLoading(false); }
  };

  const isValid = result && !result.cert?.isRevoked;

  return (
    <div style={styles.page}>
      <style>{css}</style>
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
            {(() => {
              const token = localStorage.getItem("vx_token");
              if (!token) return (
                <span style={styles.topLink} onClick={() => navigate("/login")}>
                  Issuer Login →
                </span>
              );
              try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                if (payload.exp * 1000 > Date.now()) return (
                  <span style={styles.topLink} onClick={() => navigate("/dashboard")}>
                    ← Dashboard
                  </span>
                );
              } catch {}
              return (
                <span style={styles.topLink} onClick={() => navigate("/login")}>
                  Issuer Login →
                </span>
              );
            })()}
</div>
      </div>

      {/* Hero */}
      <div style={styles.hero}>
        <span style={styles.heroTag}>Public Verification</span>
        <h1 style={styles.heroTitle}>Verify a Certificate</h1>
        <p style={styles.heroSub}>
          Enter a certificate ID or scan the QR code on the certificate. No login required.
        </p>

        {/* Search */}
        <div style={styles.searchWrap} className="search-wrap">
          <input
            style={styles.searchInput}
            className="vx-search"
            type="text"
            placeholder="Enter Certificate ID — e.g. a3f9c12e-8b4d-..."
            value={certId}
            onChange={(e) => { setCertId(e.target.value); setError(""); setResult(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
            autoFocus
          />
          <button
            style={{ ...styles.searchBtn, opacity: loading ? 0.7 : 1 }}
            className="vx-btn"
            onClick={() => handleVerify()}
            disabled={loading}
          >
            {loading ? <span style={styles.loadingRow}><span className="spinner" /> Verifying...</span> : "Verify →"}
          </button>
        </div>

        {/* Divider */}
        <div style={styles.dividerRow}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Scan button */}
        <button style={styles.scanBtn} className="scan-btn" onClick={startScanner} disabled={scannerOpen}>
          <span style={{ fontSize: 20 }}>📷</span>
          Scan QR Code from Certificate
        </button>
        <p style={styles.scanNote}>Works on mobile — point your camera at the QR code on the certificate</p>

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

      {/* ── QR SCANNER MODAL ── */}
      {scannerOpen && (
        <div style={styles.modalOverlay} className="result-fadein">
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalTitle}>Scan Certificate QR Code</div>
                <div style={styles.modalSub}>Point your camera at the QR code on the certificate</div>
              </div>
              <button style={styles.closeBtn} className="close-btn" onClick={stopScanner}>✕</button>
            </div>

            <div style={styles.scannerWrap}>
              <div id={scannerDivId} style={styles.scannerDiv} />

              {scanning && (
                <div style={styles.scanOverlay}>
                  <div style={styles.scanCorner} className="scan-corner tl" />
                  <div style={styles.scanCorner} className="scan-corner tr" />
                  <div style={styles.scanCorner} className="scan-corner bl" />
                  <div style={styles.scanCorner} className="scan-corner br" />
                  <div className="scan-line-anim" style={styles.scanLineAnim} />
                </div>
              )}

              {scannerError && (
                <div style={styles.scannerErrorBox}>
                  <div style={styles.scannerErrorText}>{scannerError}</div>
                  <button style={styles.scannerErrorBtn} onClick={stopScanner}>Use Manual Entry</button>
                </div>
              )}

              {!scanning && !scannerError && (
                <div style={styles.scannerLoading}>
                  <span className="spinner-lg" />
                  <p style={styles.scannerLoadingText}>Starting camera...</p>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <span style={styles.modalFooterText}>🔒 Camera is used only for scanning — no photos are saved</span>
            </div>
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {result && (
        <div style={styles.resultWrap} className="result-fadein">
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
              <div style={{ ...styles.statusTitle, color: isValid ? "#2af598" : "#ff6b6b" }}>
                {isValid ? "Certificate is Valid" : "Certificate has been Revoked"}
              </div>
              <div style={styles.statusSub}>
                {isValid
                  ? "This certificate is authentic and verified on the blockchain."
                  : "This certificate was revoked and is no longer valid."}
              </div>
            </div>
          </div>
          
          {result.cert.source === "blockchain" && (
              <div style={{
                background: "rgba(255,165,0,0.06)",
                border: "1px solid rgba(255,165,0,0.2)",
                padding: "12px 20px",
                marginBottom: 16,
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                color: "rgba(255,165,0,0.8)",
              }}>
                ⚠ Limited data — retrieved directly from blockchain. Some details may not be available.
              </div>
            )}


          <div style={styles.detailsGrid}>
            <div style={styles.detailsCard}>
              <div style={styles.detailsHeader}>Certificate Details</div>
              <div style={styles.certPreview}>
                <div style={styles.certTop}>
                  <span style={styles.certLogoMark}>VX</span>
                  <span style={styles.certPlatform}>VerifyX</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: isValid ? "#2af598" : "#ff6b6b" }}>
                    {isValid ? "✓ VERIFIED" : "✕ REVOKED"}
                  </span>
                </div>
                <div style={styles.certMeta}>Certificate of Achievement</div>
                <div style={styles.certRecipientLabel}>This certifies that</div>
                <div style={styles.certRecipient}>{result.cert.recipientName}</div>
                <div style={styles.certRecipientLabel}>has successfully completed</div>
                <div style={styles.certCourse}>{result.cert.courseName}</div>
                {result.cert.expiryDate && (
                    <div style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 12,
                        color: new Date() > new Date(result.cert.expiryDate) ? "#ff6b6b" : "rgba(232,234,240,0.5)",
                        marginBottom: 16,
                      }}>
                      {new Date() > new Date(result.cert.expiryDate)
                          ? `⏰ Expired on ${new Date(result.cert.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                          : `Valid until ${new Date(result.cert.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                      }
                    </div>
                )}
                <div style={styles.certFooter}>
                  <div>
                    <div style={styles.certFooterVal}>{result.cert.issuerName}</div>
                    <div style={styles.certFooterLabel}>Issued by</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={styles.certFooterVal}>
                      {new Date(result.cert.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <div style={styles.certFooterLabel}>Date Issued</div>
                  </div>
                </div>
              </div>
            </div>

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
                    <div style={{ ...styles.proofValue, color: label === "Status" ? (result.cert.isRevoked ? "#ff6b6b" : "#2af598") : "#e8eaf0" }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
              {result.cert.ipfsUrl && (
                <a href={result.cert.ipfsUrl} target="_blank" rel="noreferrer" style={styles.ipfsLink} className="ipfs-link">
                  View on IPFS →
                </a>
              )}
              <button style={styles.viewBtn} className="view-btn" onClick={() => navigate(`/certificate/${result.cert.certId}`)}>
                View Full Certificate →
              </button>
            </div>
          </div>

          <div style={{ textAlign: "center", paddingTop: 8 }}>
            <span
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "rgba(232,234,240,0.35)", cursor: "pointer" }}
              onClick={() => { setResult(null); setCertId(""); setError(""); }}
            >
              ← Verify another certificate
            </span>
          </div>
        </div>
      )}

      {!result && !scannerOpen && (
        <div style={{ position: "relative", zIndex: 2, padding: "48px 24px 80px", textAlign: "center" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "rgba(232,234,240,0.2)", lineHeight: 1.7, maxWidth: 500, margin: "0 auto" }}>
            🔒 Verification is free, public, and requires no account. Certificate data is stored on the blockchain and cannot be altered.
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { 
    minHeight: "100vh", 
    background: "#050810", 
    color: "#e8eaf0", 
    fontFamily: "'Syne', sans-serif", 
    position: "relative", 
    overflowX: "hidden" 
  },
  gridBg: { 
    position: "fixed", inset: 0, 
    backgroundImage: "linear-gradient(rgba(42,245,152,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(42,245,152,0.03) 1px, transparent 1px)", 
    backgroundSize: "50px 50px", 
    pointerEvents: "none", 
    zIndex: 0 
  },
  glowTop: { 
    position: "fixed", 
    top: -200, 
    left: "50%", 
    transform: "translateX(-50%)", 
    width: 700, 
    height: 400, 
    background: "rgba(42,245,152,0.06)", 
    borderRadius: "50%", filter: "blur(100px)", 
    pointerEvents: "none", zIndex: 0 
},
  topBar: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: "24px 48px", 
    position: "relative", 
    zIndex: 2, 
    borderBottom: "1px solid rgba(255,255,255,0.05)" 
},
  logo: { 
    display: "flex", 
    alignItems: "center", 
    gap: 10, 
    cursor: "pointer" 
},
  logoMark: { background: "#2af598", color: "#050810", fontWeight: 800, fontSize: 13, padding: "3px 7px", letterSpacing: "0.05em" },
  logoText: { fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" },
  topRight: { display: "flex", alignItems: "center", gap: 24 },
  topLink: { fontFamily: "'DM Mono', monospace", fontSize: 13, color: "rgba(232,234,240,0.4)", cursor: "pointer", transition: "color 0.2s" },
  hero: { maxWidth: 680, margin: "0 auto", padding: "80px 24px 48px", textAlign: "center", position: "relative", zIndex: 2 },
  heroTag: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#2af598", border: "1px solid rgba(42,245,152,0.3)", padding: "4px 12px", letterSpacing: "0.1em", textTransform: "uppercase", display: "inline-block", marginBottom: 20 },
  heroTitle: { fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16 },
  heroSub: { fontSize: 15, color: "rgba(232,234,240,0.5)", fontFamily: "'DM Mono', monospace", fontWeight: 300, lineHeight: 1.7, marginBottom: 32 },
  searchWrap: { display: "flex", gap: 0, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden", background: "rgba(255,255,255,0.03)", transition: "border-color 0.2s", marginBottom: 20 },
  searchInput: { flex: 1, background: "transparent", border: "none", color: "#e8eaf0", padding: "16px 20px", fontSize: 14, fontFamily: "'DM Mono', monospace", fontWeight: 300, outline: "none" },
  searchBtn: { background: "#2af598", color: "#050810", border: "none", padding: "16px 32px", fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif", cursor: "pointer", flexShrink: 0, transition: "all 0.2s", whiteSpace: "nowrap" },
  dividerRow: { display: "flex", alignItems: "center", gap: 16, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, background: "rgba(255,255,255,0.07)" },
  dividerText: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(232,234,240,0.25)", letterSpacing: "0.05em" },
  scanBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaf0", padding: "16px 24px", fontSize: 15, fontWeight: 600, fontFamily: "'Syne', sans-serif", cursor: "pointer", borderRadius: 2, transition: "all 0.2s", marginBottom: 12 },
  scanNote: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(232,234,240,0.2)", marginBottom: 24 },
  errorBox: { display: "flex", alignItems: "flex-start", gap: 16, padding: "16px 20px", background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 2, textAlign: "left", marginTop: 8 },
  errorIcon: { width: 32, height: 32, borderRadius: "50%", background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#ff6b6b", flexShrink: 0, lineHeight: "32px", textAlign: "center" },
  errorTitle: { fontSize: 14, fontWeight: 700, color: "#ff6b6b", marginBottom: 4 },
  errorSub: { fontSize: 12, color: "rgba(232,234,240,0.4)", fontFamily: "'DM Mono', monospace", fontWeight: 300 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(5,8,16,0.92)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  modal: { background: "#0d1117", border: "1px solid rgba(42,245,152,0.2)", borderRadius: 4, width: "100%", maxWidth: 480, overflow: "hidden" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "24px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  modalTitle: { fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 },
  modalSub: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(232,234,240,0.4)", fontWeight: 300 },
  closeBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(232,234,240,0.5)", width: 32, height: 32, cursor: "pointer", fontSize: 14, borderRadius: 2, flexShrink: 0, transition: "all 0.2s" },
  scannerWrap: { position: "relative", background: "#000", minHeight: 300, overflow: "hidden" },
  scannerDiv: { width: "100%", minHeight: 300 },
  scanOverlay: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" },
  scanCorner: { position: "absolute", width: 24, height: 24, border: "2px solid #2af598" },
  scanLineAnim: { position: "absolute", left: "50%", transform: "translateX(-50%)", width: 250, height: 2, background: "linear-gradient(90deg, transparent, #2af598, transparent)" },
  scannerErrorBox: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(5,8,16,0.95)", padding: 24, gap: 16 },
  scannerErrorText: { fontFamily: "'DM Mono', monospace", fontSize: 13, color: "rgba(232,234,240,0.5)", textAlign: "center", lineHeight: 1.6 },
  scannerErrorBtn: { background: "#2af598", color: "#050810", border: "none", padding: "10px 24px", fontSize: 14, fontWeight: 700, fontFamily: "'Syne', sans-serif", cursor: "pointer", borderRadius: 2 },
  scannerLoading: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(5,8,16,0.95)", gap: 12 },
  scannerLoadingText: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(232,234,240,0.35)" },
  modalFooter: { padding: "12px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" },
  modalFooterText: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(232,234,240,0.2)" },
  resultWrap: { maxWidth: 1000, margin: "0 auto", padding: "0 24px 80px", position: "relative", zIndex: 2 },
  statusBanner: { display: "flex", alignItems: "center", gap: 20, padding: "24px 28px", borderRadius: 2, marginBottom: 24 },
  statusIcon: { width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, flexShrink: 0 },
  statusTitle: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 },
  statusSub: { fontSize: 13, color: "rgba(232,234,240,0.5)", fontFamily: "'DM Mono', monospace", fontWeight: 300 },
  detailsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 },
  detailsCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2, padding: "28px" },
  proofCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2, padding: "28px" },
  detailsHeader: { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(232,234,240,0.35)", fontFamily: "'DM Mono', monospace", marginBottom: 20 },
  certPreview: { background: "linear-gradient(135deg, #0d1117, #111827)", border: "1px solid rgba(42,245,152,0.15)", borderRadius: 2, padding: "24px" },
  certTop: { display: "flex", alignItems: "center", gap: 8, marginBottom: 20 },
  certLogoMark: { background: "#2af598", color: "#050810", fontWeight: 800, fontSize: 11, padding: "2px 6px" },
  certPlatform: { fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em", flex: 1 },
  certMeta: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(42,245,152,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 },
  certRecipientLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(232,234,240,0.3)", marginBottom: 4 },
  certRecipient: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 16 },
  certCourse: { fontSize: 14, fontWeight: 600, color: "#2af598", marginBottom: 8 },
  certGrade: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(232,234,240,0.5)", marginBottom: 16 },
  certFooter: { display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 },
  certFooterVal: { fontSize: 13, fontWeight: 600, marginBottom: 4 },
  certFooterLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(232,234,240,0.3)" },
  proofRows: { display: "flex", flexDirection: "column", gap: 0, marginBottom: 20 },
  proofRow: { padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  proofLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(232,234,240,0.3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 },
  proofValue: { fontSize: 12, fontWeight: 600, fontFamily: "'DM Mono', monospace", wordBreak: "break-all" },
  ipfsLink: { display: "block", fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#2af598", textDecoration: "none", marginBottom: 12 },
  viewBtn: { width: "100%", background: "#2af598", color: "#050810", border: "none", padding: "13px 24px", fontSize: 14, fontWeight: 700, fontFamily: "'Syne', sans-serif", cursor: "pointer", transition: "all 0.2s", clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" },
  loadingRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10 },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
  .vx-search:focus { outline: none; }
  .vx-search::placeholder { color: rgba(232,234,240,0.2); }
  .search-wrap:focus-within { border-color: rgba(42,245,152,0.4) !important; }
  .vx-btn:hover:not(:disabled) { background: #fff !important; }
  .view-btn:hover { background: #fff !important; transform: translateY(-1px); }
  .ipfs-link:hover { opacity: 0.7; }
  .topLink:hover { color: rgba(232,234,240,0.8) !important; }
  .close-btn:hover { border-color: rgba(255,107,107,0.4) !important; color: #ff6b6b !important; }
  .scan-btn:hover:not(:disabled) { border-color: rgba(42,245,152,0.3) !important; background: rgba(42,245,152,0.05) !important; color: #2af598 !important; }
  .scan-corner.tl { top: calc(50% - 125px); left: calc(50% - 125px); border-right: none; border-bottom: none; }
  .scan-corner.tr { top: calc(50% - 125px); right: calc(50% - 125px); border-left: none; border-bottom: none; }
  .scan-corner.bl { bottom: calc(50% - 125px); left: calc(50% - 125px); border-right: none; border-top: none; }
  .scan-corner.br { bottom: calc(50% - 125px); right: calc(50% - 125px); border-left: none; border-top: none; }
  @keyframes scanMove { 0% { top: calc(50% - 120px); } 50% { top: calc(50% + 120px); } 100% { top: calc(50% - 120px); } }
  .scan-line-anim { animation: scanMove 2s ease-in-out infinite; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .result-fadein { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(5,8,16,0.3); border-top-color: #050810; border-radius: 50%; animation: spin 0.7s linear infinite; }
  .spinner-lg { display: inline-block; width: 28px; height: 28px; border: 2px solid rgba(232,234,240,0.1); border-top-color: #2af598; border-radius: 50%; animation: spin 0.8s linear infinite; }
  #qr-reader__dashboard { display: none !important; }
  #qr-reader__status_span { display: none !important; }
  #qr-reader img { display: none !important; }
  #qr-reader { border: none !important; padding: 0 !important; }
  @media (max-width: 700px) { .detailsGrid { grid-template-columns: 1fr !important; } .topBar { padding: 20px 24px !important; } .hero { padding: 48px 20px 32px !important; } }
`;
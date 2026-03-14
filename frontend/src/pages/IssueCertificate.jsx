import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function IssueCertificate() {
  const navigate = useNavigate();
  const org = (() => {
    try {
      const raw = localStorage.getItem("vx_org");
      return raw && raw !== "undefined" ? JSON.parse(raw) : {};
    } catch { return {}; }
  })();

  const [form, setForm] = useState({
    recipientName: "",
    recipientEmail: "",
    courseName: "",
    issuerName: org.orgName || "",
    issuerEmail: org.email || "",
    expiryDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null); // holds response data

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const validate = () => {
    if (!form.recipientName.trim()) return "Recipient name is required.";
    if (!form.recipientEmail.trim()) return "Recipient email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.recipientEmail)) return "Enter a valid recipient email.";
    if (!form.courseName.trim()) return "Course / achievement name is required.";
    if (!form.issuerName.trim()) return "Issuer name is required.";
    if (!form.issuerEmail.trim()) return "Issuer email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.issuerEmail)) return "Enter a valid issuer email.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) return setError(err);

    setLoading(true);
    setError("");

    try {
      const res = await API.post("/cert/issue", form);
      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to issue certificate. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  

  const handleIssueAnother = () => {
    setSuccess(null);
    setError("");
    setForm({
      recipientName: "",
      recipientEmail: "",
      courseName: "",
      issuerName: org.orgName || "",
      issuerEmail: org.email || "",
      expiryDate: "",
    });
  };

  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logo} onClick={() => navigate("/")}>
            <span style={styles.logoMark}>VX</span>
            <span style={styles.logoText}>VerifyX</span>
          </div>
          <nav style={styles.nav}>
            <div style={styles.navItem} onClick={() => navigate("/dashboard")}>
              <span style={styles.navIcon}>▦</span> Dashboard
            </div>
            <div style={{ ...styles.navItem, ...styles.navItemActive }}>
              <span style={styles.navIcon}>＋</span> Issue Certificate
            </div>
            <div style={styles.navItem} onClick={() => navigate("/verify")}>
              <span style={styles.navIcon}>🔍</span> Verify Certificate
            </div>
          </nav>
        </div>
        <div style={styles.sidebarBottom}>
          <div style={styles.orgCard}>
            <div style={styles.orgAvatar}>
              {(org.orgName || "O")[0].toUpperCase()}
            </div>
            <div>
              <div style={styles.orgName}>{org.orgName || "Organization"}</div>
              <div style={styles.orgEmail}>{org.email || ""}</div>
            </div>
          </div>
          <button
            style={styles.logoutBtn}
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem("vx_token");
              localStorage.removeItem("vx_org");
              navigate("/login");
            }}
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Issue Certificate</h1>
            <p style={styles.pageSubtitle}>
              Fill in the details below — VerifyX handles blockchain anchoring, IPFS storage and email delivery.
            </p>
          </div>
        </div>

        {!success ? (
          <div style={styles.formGrid}>
            {/* Left — form */}
            <div style={styles.formCard} className="card-fadein">

              {/* Recipient section */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionNum}>01</span>
                  <div>
                    <div style={styles.sectionTitle}>Recipient Details</div>
                    <div style={styles.sectionSub}>Who is receiving this certificate?</div>
                  </div>
                </div>

                <div style={styles.fieldRow}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Full Name <span style={styles.req}>*</span></label>
                    <input
                      style={styles.input}
                      className="vx-input"
                      type="text"
                      name="recipientName"
                      placeholder="e.g. Resham Lall"
                      value={form.recipientName}
                      onChange={handleChange}
                    />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Email Address <span style={styles.req}>*</span></label>
                    <input
                      style={styles.input}
                      className="vx-input"
                      type="email"
                      name="recipientEmail"
                      placeholder="recipient@email.com"
                      value={form.recipientEmail}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.divider} />

              {/* Certificate section */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionNum}>02</span>
                  <div>
                    <div style={styles.sectionTitle}>Certificate Details</div>
                    <div style={styles.sectionSub}>What is this certificate for?</div>
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Course / Achievement Name <span style={styles.req}>*</span></label>
                  <input
                    style={styles.input}
                    className="vx-input"
                    type="text"
                    name="courseName"
                    placeholder="e.g. Blockchain Development — Advanced"
                    value={form.courseName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={styles.fieldRow}>
                
              <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                      Expiry Date 
                      <span style={{ ...styles.req, color: "rgba(232,234,240,0.3)", marginLeft: 4 }}>
                        (optional)
                      </span>
                    </label>
                    <input
                      style={styles.input}
                      className="vx-input"
                      type="date"
                      name="expiryDate"
                      value={form.expiryDate}
                      onChange={handleChange}
                    />
                    <div style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11,
                      color: "rgba(232,234,240,0.2)",
                      marginTop: 4,
                    }}>
                      Leave empty for certificates that never expire
                    </div>
                  </div>
              </div>

              <div style={styles.divider} />


              {/* Issuer section */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionNum}>03</span>
                  <div>
                    <div style={styles.sectionTitle}>Issuer Details</div>
                    <div style={styles.sectionSub}>Pre-filled from your organization.</div>
                  </div>
                </div>

                <div style={styles.fieldRow}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Issuer Name <span style={styles.req}>*</span></label>
                    <input
                      style={styles.input}
                      className="vx-input"
                      type="text"
                      name="issuerName"
                      placeholder="e.g. VerifyX Labs"
                      value={form.issuerName}
                      onChange={handleChange}
                    />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Issuer Email <span style={styles.req}>*</span></label>
                    <input
                      style={styles.input}
                      className="vx-input"
                      type="email"
                      name="issuerEmail"
                      placeholder="admin@yourorg.com"
                      value={form.issuerEmail}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={styles.errorBox}>
                  <span>⚠ </span>{error}
                </div>
              )}

              {/* Submit */}
              <button
                style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
                className="vx-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <span style={styles.loadingRow}>
                    <span className="spinner" />
                    Issuing Certificate...
                  </span>
                ) : (
                  "Issue Certificate →"
                )}
              </button>

              {loading && (
                <div style={styles.loadingSteps}>
                  {["Uploading to IPFS...", "Anchoring to blockchain...", "Sending email to recipient..."].map((step, i) => (
                    <div key={step} style={{ ...styles.loadingStep, animationDelay: `${i * 1.2}s` }} className="loading-step">
                      <span style={styles.loadingDot} />
                      {step}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right — preview */}
            <div style={styles.previewCard} className="card-fadein">
              <div style={styles.previewHeader}>
                <span style={styles.previewTag}>Live Preview</span>
              </div>

              <div style={styles.certPreview}>
                <div style={styles.certHeader}>
                  <span style={styles.certLogoMark}>VX</span>
                  <span style={styles.certPlatform}>VerifyX</span>
                </div>

                <div style={styles.certTitle}>Certificate of Achievement</div>

                <div style={styles.certBody}>
                  <div style={styles.certLabel}>This certifies that</div>
                  <div style={styles.certRecipient}>
                    {form.recipientName || <span style={{ opacity: 0.25 }}>Recipient Name</span>}
                  </div>
                  <div style={styles.certLabel}>has successfully completed</div>
                  <div style={styles.certCourse}>
                    {form.courseName || <span style={{ opacity: 0.25 }}>Course / Achievement</span>}
                  </div>
                </div>

                <div style={styles.certFooter}>
                  <div>
                    <div style={styles.certFooterVal}>
                      {form.issuerName || <span style={{ opacity: 0.25 }}>Issuer</span>}
                    </div>
                    <div style={styles.certFooterLabel}>Issued by</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={styles.certFooterVal}>
                      {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <div style={styles.certFooterLabel}>Date</div>
                  </div>
                </div>

                <div style={styles.certChain}>
                  <span style={styles.certChainDot} />
                  Blockchain · IPFS · VerifyX
                </div>
              </div>

              <div style={styles.previewNote}>
                This is a visual preview only. The actual certificate is stored on IPFS and anchored to the blockchain.
              </div>
            </div>
          </div>
        ) : (
          /* ── SUCCESS STATE ── */
          <div style={styles.successWrap} className="card-fadein">
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Certificate Issued!</h2>
            <p style={styles.successSub}>
              The certificate has been anchored to the blockchain, uploaded to IPFS, and emailed to the recipient.
            </p>

            <div style={styles.successDetails}>
              {[
                ["Recipient", success.certId ? form.recipientName : "—"],
                ["Course", form.courseName],
                ["Certificate ID", success.certId],
                ["Transaction Hash", success.txHash ? success.txHash.slice(0, 20) + "..." : "Pending"],
                ["IPFS", success.ipfsUrl ? "Uploaded ✓" : "Pending"],
              ].map(([label, value]) => (
                <div key={label} style={styles.successRow}>
                  <span style={styles.successLabel}>{label}</span>
                  <span style={styles.successValue}>{value}</span>
                </div>
              ))}
            </div>

            <div style={styles.successBtns}>
              <button
                style={styles.submitBtn}
                className="vx-btn"
                onClick={() => navigate(`/certificate/${success.certId}`)}
              >
                View Certificate →
              </button>
              <button
                style={styles.outlineBtn}
                className="outline-btn"
                onClick={handleIssueAnother}
              >
                Issue Another
              </button>
              <button
                style={styles.outlineBtn}
                className="outline-btn"
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ── STYLES ── */
const styles = {
  page: {
    display: "flex", minHeight: "100vh",
    background: "#050810", color: "#e8eaf0",
    fontFamily: "'Syne', sans-serif",
  },
  sidebar: {
    width: 240, background: "rgba(255,255,255,0.02)",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    display: "flex", flexDirection: "column",
    justifyContent: "space-between",
    padding: "28px 0", position: "sticky",
    top: 0, height: "100vh", flexShrink: 0,
  },
  sidebarTop: { padding: "0 20px" },
  logo: {
    display: "flex", alignItems: "center",
    gap: 10, cursor: "pointer", marginBottom: 40,
  },
  logoMark: {
    background: "#2af598", color: "#050810",
    fontWeight: 800, fontSize: 13,
    padding: "3px 7px", letterSpacing: "0.05em",
  },
  logoText: { fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" },
  nav: { display: "flex", flexDirection: "column", gap: 4 },
  navItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px", fontSize: 14, fontWeight: 600,
    color: "rgba(232,234,240,0.45)", cursor: "pointer",
    borderRadius: 4, transition: "all 0.15s ease",
  },
  navItemActive: {
    background: "rgba(42,245,152,0.08)",
    color: "#2af598",
    border: "1px solid rgba(42,245,152,0.15)",
  },
  navIcon: { fontSize: 14, width: 18, textAlign: "center" },
  sidebarBottom: { padding: "0 20px" },
  orgCard: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "14px", background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 4, marginBottom: 10,
  },
  orgAvatar: {
    width: 34, height: 34, borderRadius: "50%",
    background: "rgba(42,245,152,0.15)",
    border: "1px solid rgba(42,245,152,0.3)",
    display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 14,
    fontWeight: 700, color: "#2af598", flexShrink: 0,
  },
  orgName: { fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" },
  orgEmail: {
    fontSize: 11, color: "rgba(232,234,240,0.35)",
    fontFamily: "'DM Mono', monospace", marginTop: 2,
    overflow: "hidden", textOverflow: "ellipsis",
    whiteSpace: "nowrap", maxWidth: 140,
  },
  logoutBtn: {
    width: "100%", background: "transparent",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(232,234,240,0.4)", padding: "9px",
    fontSize: 13, fontFamily: "'Syne', sans-serif",
    fontWeight: 600, cursor: "pointer", borderRadius: 4,
    transition: "all 0.2s",
  },
  main: { flex: 1, padding: "40px 48px", overflowX: "auto" },
  header: { marginBottom: 36 },
  pageTitle: {
    fontSize: 32, fontWeight: 800,
    letterSpacing: "-0.03em", marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 13, color: "rgba(232,234,240,0.45)",
    fontFamily: "'DM Mono', monospace", fontWeight: 300,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: 24, alignItems: "start",
  },
  formCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 2, padding: "36px",
  },
  section: { marginBottom: 8 },
  sectionHeader: {
    display: "flex", alignItems: "flex-start",
    gap: 16, marginBottom: 24,
  },
  sectionNum: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11, color: "#2af598",
    border: "1px solid rgba(42,245,152,0.3)",
    padding: "3px 8px", flexShrink: 0, marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: 700,
    letterSpacing: "-0.01em", marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12, color: "rgba(232,234,240,0.4)",
    fontFamily: "'DM Mono', monospace", fontWeight: 300,
  },
  divider: {
    height: 1, background: "rgba(255,255,255,0.06)",
    margin: "28px 0",
  },
  fieldRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  fieldGroup: {
    display: "flex", flexDirection: "column", gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 11, fontWeight: 600,
    letterSpacing: "0.07em", textTransform: "uppercase",
    color: "rgba(232,234,240,0.6)",
  },
  req: { color: "#2af598" },
  input: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#e8eaf0", padding: "12px 16px",
    fontSize: 14, fontFamily: "'DM Mono', monospace",
    fontWeight: 300, outline: "none",
    width: "100%", borderRadius: 2,
    transition: "border-color 0.2s, background 0.2s",
  },
  errorBox: {
    background: "rgba(255,80,80,0.08)",
    border: "1px solid rgba(255,80,80,0.25)",
    color: "#ff8080", padding: "12px 16px",
    fontSize: 13, fontFamily: "'DM Mono', monospace",
    borderRadius: 2, marginBottom: 20,
  },
  submitBtn: {
    width: "100%", background: "#2af598",
    color: "#050810", border: "none",
    padding: "14px 24px", fontSize: 15,
    fontWeight: 700, fontFamily: "'Syne', sans-serif",
    cursor: "pointer", letterSpacing: "0.01em",
    transition: "all 0.2s ease",
    clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
    marginBottom: 16,
  },
  outlineBtn: {
    flex: 1, background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(232,234,240,0.6)", padding: "12px 20px",
    fontSize: 14, fontWeight: 600,
    fontFamily: "'Syne', sans-serif", cursor: "pointer",
    borderRadius: 2, transition: "all 0.2s",
  },
  loadingRow: {
    display: "flex", alignItems: "center",
    justifyContent: "center", gap: 10,
  },
  loadingSteps: {
    display: "flex", flexDirection: "column",
    gap: 8, marginTop: 4,
  },
  loadingStep: {
    display: "flex", alignItems: "center", gap: 10,
    fontFamily: "'DM Mono', monospace", fontSize: 12,
    color: "rgba(232,234,240,0.35)",
    animation: "fadeIn 0.5s ease both",
  },
  loadingDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#2af598", flexShrink: 0,
  },
  previewCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 2, padding: "28px",
    position: "sticky", top: 24,
  },
  previewHeader: { marginBottom: 20 },
  previewTag: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10, color: "#2af598",
    border: "1px solid rgba(42,245,152,0.3)",
    padding: "3px 10px", letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  certPreview: {
    background: "linear-gradient(135deg, #0d1117, #111827)",
    border: "1px solid rgba(42,245,152,0.2)",
    borderRadius: 2, padding: "24px",
    boxShadow: "0 0 40px rgba(42,245,152,0.06)",
    marginBottom: 16,
  },
  certHeader: {
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
    letterSpacing: "-0.01em",
  },
  certTitle: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10, color: "rgba(42,245,152,0.6)",
    letterSpacing: "0.1em", textTransform: "uppercase",
    marginBottom: 20,
  },
  certBody: { marginBottom: 24 },
  certLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10, color: "rgba(232,234,240,0.3)",
    marginBottom: 4,
  },
  certRecipient: {
    fontSize: 20, fontWeight: 800,
    letterSpacing: "-0.02em", marginBottom: 16,
    minHeight: 28,
  },
  certCourse: {
    fontSize: 14, fontWeight: 600,
    color: "#2af598", minHeight: 22,
  },
  certFooter: {
    display: "flex", justifyContent: "space-between",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    paddingTop: 16, marginBottom: 12,
  },
  certFooterVal: {
    fontSize: 13, fontWeight: 600,
    marginBottom: 4, minHeight: 20,
  },
  certFooterLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10, color: "rgba(232,234,240,0.3)",
  },
  certChain: {
    display: "flex", alignItems: "center", gap: 6,
    fontFamily: "'DM Mono', monospace",
    fontSize: 10, color: "rgba(232,234,240,0.2)",
  },
  certChainDot: {
    width: 5, height: 5, borderRadius: "50%",
    background: "#2af598", opacity: 0.5,
  },
  previewNote: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11, color: "rgba(232,234,240,0.2)",
    lineHeight: 1.6, textAlign: "center",
  },
  successWrap: {
    maxWidth: 560, margin: "0 auto",
    textAlign: "center", padding: "20px",
  },
  successIcon: {
    width: 80, height: 80, borderRadius: "50%",
    border: "2px solid #2af598",
    display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 36,
    color: "#2af598", margin: "0 auto 24px",
  },
  successTitle: {
    fontSize: 36, fontWeight: 800,
    letterSpacing: "-0.03em", marginBottom: 12,
  },
  successSub: {
    fontSize: 14, color: "rgba(232,234,240,0.5)",
    fontFamily: "'DM Mono', monospace", fontWeight: 300,
    lineHeight: 1.7, marginBottom: 32,
  },
  successDetails: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 2, padding: "24px",
    marginBottom: 28, textAlign: "left",
  },
  successRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    gap: 16,
  },
  successLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11, color: "rgba(232,234,240,0.35)",
    textTransform: "uppercase", letterSpacing: "0.05em",
    flexShrink: 0,
  },
  successValue: {
    fontSize: 13, fontWeight: 600,
    fontFamily: "'DM Mono', monospace",
    color: "#2af598", textAlign: "right",
    wordBreak: "break-all",
  },
  successBtns: {
    display: "flex", flexDirection: "column", gap: 12,
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  .vx-input:focus {
    border-color: rgba(42,245,152,0.5) !important;
    background: rgba(42,245,152,0.04) !important;
  }
  .vx-input::placeholder { color: rgba(232,234,240,0.2); }

  .vx-btn:hover:not(:disabled) {
    background: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(42,245,152,0.3);
  }

  .outline-btn:hover {
    border-color: rgba(232,234,240,0.3) !important;
    color: #e8eaf0 !important;
  }

  .logout-btn:hover {
    border-color: rgba(255,107,107,0.3) !important;
    color: #ff6b6b !important;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .card-fadein {
    animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .loading-step {
    animation: fadeIn 0.5s ease both;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .spinner {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid rgba(5,8,16,0.3);
    border-top-color: #050810;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @media (max-width: 900px) {
    .form-grid { grid-template-columns: 1fr !important; }
  }
`;
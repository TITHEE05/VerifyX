import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const INDUSTRIES = [
  "Education", "Technology", "Healthcare", "Finance",
  "Government", "Non-Profit", "Research", "Other"
];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = form, 2 = success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    orgName: "",
    email: "",
    website: "",
    industry: "",
    description: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!form.orgName.trim()) return setError("Organization name is required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("Enter a valid email address.");
    if (!form.industry) return setError("Please select an industry.");

    setLoading(true);
    setError("");

    try {
      await API.post("/auth/send-otp", { email: form.email, orgName: form.orgName });
      // Save email to localStorage so Login page can use it
      localStorage.setItem("vx_pending_email", form.email);
      localStorage.setItem("vx_org_name", form.orgName);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* Left panel — branding */}
      <div style={styles.left}>
        <div style={styles.leftInner}>
          <div style={styles.logo} onClick={() => navigate("/")}>
            <span style={styles.logoMark}>VX</span>
            <span style={styles.logoText}>VerifyX</span>
          </div>

          <div style={styles.leftContent}>
            <h2 style={styles.leftHeading}>
              Join the network of<br />
              <span style={{ color: "#2af598" }}>trusted issuers.</span>
            </h2>
            <p style={styles.leftSub}>
              Register your organization to start issuing blockchain-verified certificates that can never be forged.
            </p>

            <div style={styles.perks}>
              {[
                ["⛓", "Certificates anchored on-chain"],
                ["📦", "Automatic IPFS storage"],
                ["✉️", "Email delivery with QR codes"],
                ["🔍", "Public verification — no login needed"],
              ].map(([icon, text]) => (
                <div key={text} style={styles.perk}>
                  <span style={styles.perkIcon}>{icon}</span>
                  <span style={styles.perkText}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.leftFooter}>
            Already registered?{" "}
            <span style={styles.link} onClick={() => navigate("/login")}>
              Log in →
            </span>
          </div>
        </div>

        {/* Decorative grid */}
        <div style={styles.gridOverlay} />
        {/* Glow */}
        <div style={styles.glow} />
      </div>

      {/* Right panel — form */}
      <div style={styles.right}>
        <div style={styles.formBox}>

          {step === 1 ? (
            <>
              <div className="form-fadein" style={styles.formHeader}>
                <span style={styles.stepTag}>Step 01 / 02</span>
                <h1 style={styles.formTitle}>Register your<br />organization</h1>
                <p style={styles.formSub}>We'll send an OTP to verify your email.</p>
              </div>

              <div className="form-fadein" style={{ animationDelay: "0.1s", ...styles.fields }}>

                {/* Org Name */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Organization Name <span style={{ color: "#2af598" }}>*</span></label>
                  <input
                    style={styles.input}
                    type="text"
                    name="orgName"
                    placeholder="e.g. MIT OpenCourseWare"
                    value={form.orgName}
                    onChange={handleChange}
                    className="vx-input"
                  />
                </div>

                {/* Email */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Official Email <span style={{ color: "#2af598" }}>*</span></label>
                  <input
                    style={styles.input}
                    type="email"
                    name="email"
                    placeholder="admin@yourorg.com"
                    value={form.email}
                    onChange={handleChange}
                    className="vx-input"
                  />
                </div>

                {/* Website */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Website <span style={styles.optional}>(optional)</span></label>
                  <input
                    style={styles.input}
                    type="text"
                    name="website"
                    placeholder="https://yourorg.com"
                    value={form.website}
                    onChange={handleChange}
                    className="vx-input"
                  />
                </div>

                {/* Industry */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Industry <span style={{ color: "#2af598" }}>*</span></label>
                  <select
                    style={{ ...styles.input, ...styles.select }}
                    name="industry"
                    value={form.industry}
                    onChange={handleChange}
                    className="vx-input"
                  >
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>About your organization <span style={styles.optional}>(optional)</span></label>
                  <textarea
                    style={{ ...styles.input, ...styles.textarea }}
                    name="description"
                    placeholder="Briefly describe what your organization does..."
                    value={form.description}
                    onChange={handleChange}
                    className="vx-input"
                    rows={3}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div style={styles.errorBox}>
                    <span style={{ marginRight: 8 }}>⚠</span>{error}
                  </div>
                )}

                {/* Submit */}
                <button
                  style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
                  onClick={handleSubmit}
                  disabled={loading}
                  className="vx-btn"
                >
                  {loading ? (
                    <span style={styles.loadingRow}>
                      <span className="spinner" /> Sending OTP...
                    </span>
                  ) : (
                    "Continue — Send OTP →"
                  )}
                </button>

                <p style={styles.note}>
                  By registering, you agree to issue certificates responsibly.
                </p>
              </div>
            </>
          ) : (
            /* ── SUCCESS STATE ── */
            <div className="form-fadein" style={styles.successBox}>
              <div style={styles.successIcon}>✓</div>
              <h2 style={styles.successTitle}>OTP Sent!</h2>
              <p style={styles.successSub}>
                We've sent a one-time password to
              </p>
              <div style={styles.emailChip}>{form.email}</div>
              <p style={styles.successNote}>
                Check your inbox (and spam folder). The OTP is valid for 10 minutes.
              </p>
              <button
                style={styles.submitBtn}
                className="vx-btn"
                onClick={() => navigate("/login")}
              >
                Enter OTP — Log In →
              </button>
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <span
                  style={styles.link}
                  onClick={() => { setStep(1); setError(""); }}
                >
                  ← Back to registration
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── STYLES ── */
const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Syne', sans-serif",
    background: "#050810",
    color: "#e8eaf0",
  },
  left: {
    flex: "0 0 420px",
    background: "rgba(255,255,255,0.02)",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  leftInner: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "40px 40px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    marginBottom: "auto",
  },
  logoMark: {
    background: "#2af598",
    color: "#050810",
    fontWeight: 800,
    fontSize: 14,
    padding: "4px 8px",
    letterSpacing: "0.05em",
  },
  logoText: {
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: "-0.02em",
  },
  leftContent: {
    marginTop: 60,
    marginBottom: "auto",
  },
  leftHeading: {
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.2,
    marginBottom: 16,
  },
  leftSub: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "rgba(232,234,240,0.5)",
    fontFamily: "'DM Mono', monospace",
    fontWeight: 300,
    marginBottom: 40,
  },
  perks: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  perk: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  perkIcon: {
    fontSize: 18,
    width: 32,
    textAlign: "center",
  },
  perkText: {
    fontSize: 13,
    color: "rgba(232,234,240,0.6)",
    fontFamily: "'DM Mono', monospace",
    fontWeight: 300,
  },
  leftFooter: {
    fontSize: 13,
    color: "rgba(232,234,240,0.4)",
    fontFamily: "'DM Mono', monospace",
    paddingTop: 32,
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  link: {
    color: "#2af598",
    cursor: "pointer",
    textDecoration: "none",
  },
  gridOverlay: {
    position: "absolute",
    inset: 0,
    backgroundImage: "linear-gradient(rgba(42,245,152,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(42,245,152,0.03) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    zIndex: 1,
  },
  glow: {
    position: "absolute",
    bottom: -100,
    left: -100,
    width: 400,
    height: 400,
    background: "rgba(42,245,152,0.06)",
    borderRadius: "50%",
    filter: "blur(80px)",
    zIndex: 0,
  },
  right: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    overflowY: "auto",
  },
  formBox: {
    width: "100%",
    maxWidth: 480,
  },
  formHeader: {
    marginBottom: 36,
  },
  stepTag: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "#2af598",
    letterSpacing: "0.1em",
    marginBottom: 12,
    border: "1px solid rgba(42,245,152,0.3)",
    display: "inline-block",
    padding: "3px 10px",
  },
  formTitle: {
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
    marginBottom: 10,
    marginTop: 12,
  },
  formSub: {
    fontSize: 14,
    color: "rgba(232,234,240,0.5)",
    fontFamily: "'DM Mono', monospace",
    fontWeight: 300,
  },
  fields: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.05em",
    color: "rgba(232,234,240,0.7)",
    textTransform: "uppercase",
  },
  optional: {
    color: "rgba(232,234,240,0.3)",
    fontWeight: 400,
    fontSize: 11,
    textTransform: "none",
    letterSpacing: 0,
  },
  input: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#e8eaf0",
    padding: "12px 16px",
    fontSize: 14,
    fontFamily: "'DM Mono', monospace",
    fontWeight: 300,
    outline: "none",
    width: "100%",
    transition: "border-color 0.2s ease, background 0.2s ease",
    borderRadius: 2,
  },
  select: {
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%232af598' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 16px center",
    paddingRight: 40,
  },
  textarea: {
    resize: "vertical",
    minHeight: 80,
    lineHeight: 1.6,
  },
  errorBox: {
    background: "rgba(255,80,80,0.08)",
    border: "1px solid rgba(255,80,80,0.25)",
    color: "#ff8080",
    padding: "12px 16px",
    fontSize: 13,
    fontFamily: "'DM Mono', monospace",
    borderRadius: 2,
  },
  submitBtn: {
    width: "100%",
    background: "#2af598",
    color: "#050810",
    border: "none",
    padding: "14px 24px",
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "'Syne', sans-serif",
    cursor: "pointer",
    letterSpacing: "0.01em",
    transition: "all 0.2s ease",
    clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
  },
  note: {
    fontSize: 11,
    color: "rgba(232,234,240,0.25)",
    fontFamily: "'DM Mono', monospace",
    textAlign: "center",
    marginTop: -8,
  },
  loadingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  successBox: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    border: "2px solid #2af598",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32,
    color: "#2af598",
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: "-0.03em",
  },
  successSub: {
    fontSize: 14,
    color: "rgba(232,234,240,0.5)",
    fontFamily: "'DM Mono', monospace",
    fontWeight: 300,
  },
  emailChip: {
    background: "rgba(42,245,152,0.08)",
    border: "1px solid rgba(42,245,152,0.25)",
    color: "#2af598",
    padding: "8px 20px",
    fontFamily: "'DM Mono', monospace",
    fontSize: 14,
    borderRadius: 2,
  },
  successNote: {
    fontSize: 13,
    color: "rgba(232,234,240,0.4)",
    fontFamily: "'DM Mono', monospace",
    fontWeight: 300,
    lineHeight: 1.6,
    maxWidth: 340,
  },
};

/* ── CSS-in-JS for hover/focus/animation ── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  .vx-input:focus {
    border-color: rgba(42,245,152,0.5) !important;
    background: rgba(42,245,152,0.04) !important;
  }

  .vx-input::placeholder {
    color: rgba(232,234,240,0.2);
  }

  .vx-input option {
    background: #0d1117;
    color: #e8eaf0;
  }

  .vx-btn:hover:not(:disabled) {
    background: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(42,245,152,0.3);
  }

  .vx-btn:active {
    transform: translateY(0px);
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .form-fadein {
    animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(5,8,16,0.3);
    border-top-color: #050810;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @media (max-width: 768px) {
    .vx-left-panel { display: none !important; }
  }
`;
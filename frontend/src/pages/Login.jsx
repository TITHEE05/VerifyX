import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState(localStorage.getItem("vx_pending_email") || "");
  const [orgName] = useState(localStorage.getItem("vx_org_name") || "");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState(email ? 2 : 1); // if came from register, skip to OTP entry
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState("");
  const [emailInput, setEmailInput] = useState("");

  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  // Start countdown when on OTP step
  useEffect(() => {
    if (step === 2) startResendTimer();
    return () => clearInterval(timerRef.current);
  }, [step]);

  const startResendTimer = () => {
    setResendTimer(60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  // Handle OTP box input
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // only last digit if pasted multiple
    setOtp(newOtp);
    setError("");
    // Auto-focus next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste — fill all boxes at once
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((digit, i) => { newOtp[i] = digit; });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // Step 1 — send OTP to entered email
  const handleSendOtp = async () => {
    if (!emailInput.trim()) return setError("Please enter your email.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) return setError("Enter a valid email.");
    setLoading(true);
    setError("");
    try {
      await API.post("/auth/send-otp", { email: emailInput });
      localStorage.setItem("vx_pending_email", emailInput);
      setEmail(emailInput);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify OTP
  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) return setError("Please enter the full 6-digit OTP.");
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/verify-otp", { email, otp: code });
      // Save auth token/org info
      localStorage.setItem("vx_token", res.data.token);
      localStorage.setItem("vx_org", JSON.stringify(res.data.organization));
      // Clean up pending keys
      localStorage.removeItem("vx_pending_email");
      localStorage.removeItem("vx_org_name");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError("");
    try {
      await API.post("/auth/send-otp", { email });
      startResendTimer();
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError("Could not resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const otpComplete = otp.every((d) => d !== "");

  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* Background grid */}
      <div style={styles.gridBg} />
      {/* Ambient glow */}
      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />

      {/* Back to home */}
      <div style={styles.topBar}>
        <span style={styles.backBtn} onClick={() => navigate("/")}>
          ← VerifyX
        </span>
        <span style={styles.topRight}>
          No account?{" "}
          <span style={styles.link} onClick={() => navigate("/register")}>
            Register →
          </span>
        </span>
      </div>

      {/* Card */}
      <div style={styles.center}>
        <div style={styles.card} className="card-fadein">

          {/* Logo */}
          <div style={styles.logoRow}>
            <span style={styles.logoMark}>VX</span>
            <span style={styles.logoName}>VerifyX</span>
          </div>

          {step === 1 ? (
            /* ── STEP 1: Enter Email ── */
            <div>
              <div style={styles.cardHeader}>
                <span style={styles.stepTag}>Login</span>
                <h1 style={styles.cardTitle}>Welcome back</h1>
                <p style={styles.cardSub}>Enter your organization email and we'll send you a one-time password.</p>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Organization Email</label>
                <input
                  style={styles.input}
                  className="vx-input"
                  type="email"
                  placeholder="admin@yourorg.com"
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  autoFocus
                />
              </div>

              {error && <div style={styles.errorBox}><span>⚠ </span>{error}</div>}

              <button
                style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
                className="vx-btn"
                onClick={handleSendOtp}
                disabled={loading}
              >
                {loading
                  ? <span style={styles.loadingRow}><span className="spinner" /> Sending OTP...</span>
                  : "Send OTP →"
                }
              </button>
            </div>

          ) : (
            /* ── STEP 2: Enter OTP ── */
            <div>
              <div style={styles.cardHeader}>
                <span style={styles.stepTag}>Verify</span>
                <h1 style={styles.cardTitle}>
                  {orgName ? `Hey, ${orgName}` : "Check your inbox"}
                </h1>
                <p style={styles.cardSub}>
                  Enter the 6-digit OTP sent to
                </p>
                <div style={styles.emailChip}>{email}</div>
              </div>

              {/* OTP Boxes */}
              <div style={styles.otpRow} onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    style={{
                      ...styles.otpBox,
                      borderColor: error
                        ? "rgba(255,80,80,0.5)"
                        : digit
                        ? "rgba(42,245,152,0.6)"
                        : "rgba(255,255,255,0.12)",
                      background: digit
                        ? "rgba(42,245,152,0.06)"
                        : "rgba(255,255,255,0.03)",
                      color: "#2af598",
                    }}
                    className="otp-box"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && <div style={styles.errorBox}><span>⚠ </span>{error}</div>}

              {/* Verify button */}
              <button
                style={{
                  ...styles.btn,
                  opacity: loading ? 0.7 : otpComplete ? 1 : 0.5,
                  cursor: otpComplete ? "pointer" : "not-allowed",
                }}
                className="vx-btn"
                onClick={handleVerifyOtp}
                disabled={loading || !otpComplete}
              >
                {loading
                  ? <span style={styles.loadingRow}><span className="spinner" /> Verifying...</span>
                  : "Verify & Log In →"
                }
              </button>

              {/* Resend */}
              <div style={styles.resendRow}>
                <span style={styles.resendLabel}>Didn't receive it?</span>
                <span
                  style={{
                    ...styles.resendBtn,
                    color: resendTimer > 0 ? "rgba(232,234,240,0.25)" : "#2af598",
                    cursor: resendTimer > 0 ? "default" : "pointer",
                  }}
                  onClick={handleResend}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                </span>
              </div>

              {/* Change email */}
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <span
                  style={{ ...styles.link, fontSize: 12 }}
                  onClick={() => {
                    setStep(1);
                    setError("");
                    setOtp(["", "", "", "", "", ""]);
                    localStorage.removeItem("vx_pending_email");
                  }}
                >
                  ← Use a different email
                </span>
              </div>
            </div>
          )}

          {/* Divider + security note */}
          <div style={styles.securityNote}>
            <span style={styles.securityDot} />
            OTPs expire after 10 minutes · No password stored
          </div>
        </div>
      </div>
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
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
  },
  gridBg: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(42,245,152,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(42,245,152,0.03) 1px, transparent 1px)",
    backgroundSize: "50px 50px",
    pointerEvents: "none",
    zIndex: 0,
  },
  glowTop: {
    position: "fixed",
    top: -200,
    left: "50%",
    transform: "translateX(-50%)",
    width: 600,
    height: 400,
    background: "rgba(42,245,152,0.07)",
    borderRadius: "50%",
    filter: "blur(100px)",
    pointerEvents: "none",
    zIndex: 0,
  },
  glowBottom: {
    position: "fixed",
    bottom: -200,
    right: -100,
    width: 400,
    height: 400,
    background: "rgba(100,120,255,0.05)",
    borderRadius: "50%",
    filter: "blur(100px)",
    pointerEvents: "none",
    zIndex: 0,
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 32px",
    position: "relative",
    zIndex: 2,
  },
  backBtn: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    color: "rgba(232,234,240,0.4)",
    cursor: "pointer",
    transition: "color 0.2s",
  },
  topRight: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    color: "rgba(232,234,240,0.4)",
  },
  link: {
    color: "#2af598",
    cursor: "pointer",
  },
  center: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    position: "relative",
    zIndex: 2,
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "48px 44px",
    width: "100%",
    maxWidth: 440,
    boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 36,
  },
  logoMark: {
    background: "#2af598",
    color: "#050810",
    fontWeight: 800,
    fontSize: 13,
    padding: "3px 7px",
    letterSpacing: "0.05em",
  },
  logoName: {
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: "-0.02em",
  },
  cardHeader: {
    marginBottom: 28,
  },
  stepTag: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: "#2af598",
    letterSpacing: "0.12em",
    border: "1px solid rgba(42,245,152,0.3)",
    padding: "3px 10px",
    textTransform: "uppercase",
    display: "inline-block",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 30,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    marginBottom: 8,
    lineHeight: 1.1,
  },
  cardSub: {
    fontSize: 13,
    color: "rgba(232,234,240,0.5)",
    fontFamily: "'DM Mono', monospace",
    fontWeight: 300,
    lineHeight: 1.6,
  },
  emailChip: {
    display: "inline-block",
    marginTop: 10,
    background: "rgba(42,245,152,0.08)",
    border: "1px solid rgba(42,245,152,0.2)",
    color: "#2af598",
    padding: "5px 14px",
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    borderRadius: 2,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.07em",
    color: "rgba(232,234,240,0.6)",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#e8eaf0",
    padding: "13px 16px",
    fontSize: 15,
    fontFamily: "'DM Mono', monospace",
    fontWeight: 300,
    outline: "none",
    borderRadius: 2,
    transition: "border-color 0.2s, background 0.2s",
  },
  otpRow: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
    justifyContent: "center",
  },
  otpBox: {
    width: 52,
    height: 60,
    textAlign: "center",
    fontSize: 24,
    fontWeight: 700,
    fontFamily: "'DM Mono', monospace",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 2,
    outline: "none",
    transition: "all 0.15s ease",
    caretColor: "#2af598",
  },
  errorBox: {
    background: "rgba(255,80,80,0.08)",
    border: "1px solid rgba(255,80,80,0.25)",
    color: "#ff8080",
    padding: "10px 14px",
    fontSize: 12,
    fontFamily: "'DM Mono', monospace",
    borderRadius: 2,
    marginBottom: 16,
  },
  btn: {
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
    marginBottom: 16,
  },
  resendRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  resendLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "rgba(232,234,240,0.35)",
  },
  resendBtn: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    fontWeight: 500,
    transition: "color 0.2s",
  },
  securityNote: {
    marginTop: 28,
    paddingTop: 20,
    borderTop: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "rgba(232,234,240,0.2)",
    letterSpacing: "0.03em",
  },
  securityDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#2af598",
    opacity: 0.6,
    display: "inline-block",
  },
  loadingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  .vx-input:focus {
    border-color: rgba(42,245,152,0.5) !important;
    background: rgba(42,245,152,0.04) !important;
  }

  .vx-input::placeholder {
    color: rgba(232,234,240,0.2);
  }

  .otp-box:focus {
    border-color: rgba(42,245,152,0.7) !important;
    background: rgba(42,245,152,0.08) !important;
    box-shadow: 0 0 0 3px rgba(42,245,152,0.08);
  }

  .vx-btn:hover:not(:disabled) {
    background: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(42,245,152,0.3);
  }

  .vx-btn:active {
    transform: translateY(0);
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .card-fadein {
    animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
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
`;
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const FEATURES = [
  {
    icon: "⛓",
    title: "Blockchain-Backed",
    desc: "Every certificate is anchored to the blockchain — immutable, timestamped, and tamper-proof forever.",
  },
  {
    icon: "🔍",
    title: "Instant Verification",
    desc: "Anyone can verify a certificate in seconds using a certificate ID or by scanning a QR code.",
  },
  {
    icon: "📦",
    title: "IPFS Storage",
    desc: "Certificate data is stored on IPFS via Pinata — decentralized, permanent, and always accessible.",
  },
  {
    icon: "✉️",
    title: "Auto Email Delivery",
    desc: "Recipients get their certificate with a QR code directly in their inbox the moment it's issued.",
  },
  {
    icon: "🔐",
    title: "OTP-Secured Login",
    desc: "Organizations log in with one-time passwords — no weak passwords, no account takeovers.",
  },
  {
    icon: "🚫",
    title: "Revocation Support",
    desc: "Issuers can revoke certificates on-chain instantly. Verification always reflects the latest status.",
  },
];

const STEPS = [
  { num: "01", title: "Register Your Organization", desc: "Sign up and verify your organization with a secure OTP flow." },
  { num: "02", title: "Issue a Certificate", desc: "Fill in recipient details — VerifyX handles blockchain anchoring, IPFS upload, and email delivery." },
  { num: "03", title: "Share & Verify", desc: "Recipients share their certificate ID or QR code. Anyone can verify it instantly — no login needed." },
];

export default function Home() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState({});
  const sectionRefs = useRef({});

  useEffect(() => {
    const handleMouse = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible((prev) => ({ ...prev, [entry.target.dataset.id]: true }));
          }
        });
      },
      { threshold: 0.15 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const registerRef = (id) => (el) => {
    sectionRefs.current[id] = el;
    if (el) el.dataset.id = id;
  };

  const parallaxStyle = {
    transform: `translate(${(mousePos.x - window.innerWidth / 2) * 0.012}px, ${(mousePos.y - window.innerHeight / 2) * 0.012}px)`,
    transition: "transform 0.1s ease-out",
  };

  return (
    <div style={{ fontFamily: "'Syne', sans-serif", background: "#050810", color: "#e8eaf0", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #050810; }
        ::-webkit-scrollbar-thumb { background: #2af598; border-radius: 2px; }

        .hero-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }

        .grid-bg {
          background-image:
            linear-gradient(rgba(42,245,152,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(42,245,152,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scanLine {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes borderRun {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        .hero-title {
          animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s both;
        }
        .hero-sub {
          animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.4s both;
        }
        .hero-btns {
          animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.6s both;
        }
        .hero-badge {
          animation: fadeIn 1s ease 0.1s both;
        }
        .hero-card {
          animation: float 6s ease-in-out infinite;
        }

        .btn-primary {
          background: #2af598;
          color: #050810;
          border: none;
          padding: 14px 32px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.02em;
          cursor: pointer;
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
          transition: all 0.2s ease;
          position: relative;
        }
        .btn-primary:hover {
          background: #fff;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(42,245,152,0.35);
        }

        .btn-outline {
          background: transparent;
          color: #e8eaf0;
          border: 1px solid rgba(232,234,240,0.25);
          padding: 13px 32px;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
        }
        .btn-outline:hover {
          border-color: #2af598;
          color: #2af598;
          transform: translateY(-2px);
        }

        .feature-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          padding: 28px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 2px;
          background: linear-gradient(90deg, transparent, #2af598, transparent);
          transform: translateX(-100%);
          transition: transform 0.4s ease;
        }
        .feature-card:hover::before {
          transform: translateX(100%);
        }
        .feature-card:hover {
          background: rgba(42,245,152,0.05);
          border-color: rgba(42,245,152,0.2);
          transform: translateY(-4px);
        }

        .step-num {
          font-family: 'DM Mono', monospace;
          font-size: 72px;
          font-weight: 300;
          color: rgba(42,245,152,0.12);
          line-height: 1;
          position: absolute;
          top: -10px; right: 20px;
          pointer-events: none;
        }

        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }
        .reveal-delay-4 { transition-delay: 0.4s; }
        .reveal-delay-5 { transition-delay: 0.5s; }
        .reveal-delay-6 { transition-delay: 0.6s; }

        .cert-mock {
          background: linear-gradient(135deg, #0d1117 0%, #111827 100%);
          border: 1px solid rgba(42,245,152,0.3);
          border-radius: 4px;
          padding: 28px;
          width: 320px;
          position: relative;
          box-shadow: 0 0 60px rgba(42,245,152,0.12), 0 0 120px rgba(42,245,152,0.04);
        }

        .scan-line {
          position: absolute;
          left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(42,245,152,0.8), transparent);
          animation: scanLine 3s linear infinite;
          pointer-events: none;
        }

        .stat-number {
          font-family: 'DM Mono', monospace;
          font-size: 42px;
          font-weight: 500;
          color: #2af598;
          line-height: 1;
        }

        .tag {
          display: inline-block;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          color: #2af598;
          border: 1px solid rgba(42,245,152,0.3);
          padding: 4px 10px;
          text-transform: uppercase;
        }

        .noise-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 999;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }
      `}</style>

      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="grid-bg"
        style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: "80px 24px" }}
      >
        {/* Ambient glows */}
        <div className="hero-glow" style={{ width: 600, height: 600, background: "rgba(42,245,152,0.08)", top: "10%", left: "5%", ...parallaxStyle }} />
        <div className="hero-glow" style={{ width: 400, height: 400, background: "rgba(100,120,255,0.07)", bottom: "10%", right: "10%", ...parallaxStyle }} />

        <div style={{ maxWidth: 1200, width: "100%", display: "flex", alignItems: "center", gap: 64, flexWrap: "wrap", justifyContent: "center" }}>
          {/* Left — text */}
          <div style={{ flex: "1 1 480px", maxWidth: 580 }}>
            <div className="hero-badge" style={{ marginBottom: 24 }}>
              <span className="tag">Blockchain · IPFS · Web3</span>
            </div>

            <h1 className="hero-title" style={{ fontSize: "clamp(40px, 6vw, 74px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 24 }}>
              Certificates that{" "}
              <span style={{ color: "#2af598", display: "inline-block", position: "relative" }}>
                can't be faked.
                <span style={{ position: "absolute", bottom: 4, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #2af598, transparent)" }} />
              </span>
            </h1>

            <p className="hero-sub" style={{ fontSize: 18, lineHeight: 1.7, color: "rgba(232,234,240,0.6)", marginBottom: 36, fontFamily: "'DM Mono', monospace", fontWeight: 300 }}>
              VerifyX anchors every certificate to the blockchain. Issue in seconds,
              verify in one click — no middlemen, no forgeries, no trust required.
            </p>

            <div className="hero-btns" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <button className="btn-primary" onClick={() => navigate("/register")}>
                Issue a Certificate →
              </button>
              <button className="btn-outline" onClick={() => navigate("/verify")}>
                Verify a Certificate
              </button>
            </div>

            <div className="hero-badge" style={{ marginTop: 48, display: "flex", gap: 32, flexWrap: "wrap" }}>
              {[["100%", "Tamper-proof"], ["0s", "Verification time"], ["∞", "Certificates"]].map(([val, label]) => (
                <div key={label}>
                  <div className="stat-number" style={{ fontSize: 28 }}>{val}</div>
                  <div style={{ fontSize: 12, color: "rgba(232,234,240,0.4)", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — mock certificate */}
          <div style={{ flex: "0 0 auto" }}>
            <div className="hero-card" style={{ position: "relative" }}>
              {/* Pulse rings */}
              {[1, 2].map((i) => (
                <div key={i} style={{
                  position: "absolute", inset: -20 * i,
                  border: "1px solid rgba(42,245,152,0.15)",
                  borderRadius: 8,
                  animation: `pulse-ring 3s ease-out ${i * 1.5}s infinite`,
                  pointerEvents: "none"
                }} />
              ))}

              <div className="cert-mock">
                <div className="scan-line" />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <span className="tag">Certificate of Achievement</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(42,245,152,0.6)" }}>VERIFIED ✓</span>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: "rgba(232,234,240,0.3)", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Recipient</div>
                  <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>Resham Lall</div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: "rgba(232,234,240,0.3)", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Achievement</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#2af598" }}>Blockchain Development — Advanced</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  {[["Issued by", "VerifyX Labs"], ["Date", "Mar 6, 2026"], ["Chain", "Polygon Amoy"], ["Status", "✓ Active"]].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 10, color: "rgba(232,234,240,0.3)", fontFamily: "'DM Mono', monospace" }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: k === "Status" ? "#2af598" : "#e8eaf0" }}>{v}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: "rgba(42,245,152,0.06)", border: "1px solid rgba(42,245,152,0.15)", padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, color: "rgba(232,234,240,0.3)", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Certificate ID</div>
                  <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#2af598", wordBreak: "break-all" }}>VX-2026-a3f9c12e-8b4d</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div ref={registerRef("steps")} className={`reveal ${visible["steps"] ? "visible" : ""}`} style={{ marginBottom: 64, textAlign: "center" }}>
          <span className="tag" style={{ marginBottom: 16, display: "inline-block" }}>Process</span>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em" }}>
            From issuance to verification —<br />
            <span style={{ color: "#2af598" }}>three steps.</span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 2 }}>
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              ref={registerRef(`step-${i}`)}
              className={`reveal reveal-delay-${i + 1} ${visible[`step-${i}`] ? "visible" : ""}`}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "40px 32px",
                position: "relative",
                overflow: "hidden",
                borderLeft: i === 0 ? "3px solid #2af598" : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="step-num">{step.num}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#2af598", marginBottom: 12, letterSpacing: "0.08em" }}>
                Step {step.num}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, letterSpacing: "-0.02em" }}>{step.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(232,234,240,0.5)", fontFamily: "'DM Mono', monospace", fontWeight: 300 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section style={{ padding: "80px 24px", background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div ref={registerRef("features")} className={`reveal ${visible["features"] ? "visible" : ""}`} style={{ marginBottom: 56, textAlign: "center" }}>
            <span className="tag" style={{ marginBottom: 16, display: "inline-block" }}>Features</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              Built for trust. <span style={{ color: "#2af598" }}>By design.</span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                ref={registerRef(`feat-${i}`)}
                className={`feature-card reveal reveal-delay-${(i % 3) + 1} ${visible[`feat-${i}`] ? "visible" : ""}`}
              >
                <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.01em" }}>{f.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(232,234,240,0.5)", fontFamily: "'DM Mono', monospace", fontWeight: 300 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={registerRef("cta")} className={`reveal ${visible["cta"] ? "visible" : ""}`} style={{ padding: "120px 24px", textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 300, background: "rgba(42,245,152,0.06)", filter: "blur(100px)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
          <span className="tag" style={{ marginBottom: 24, display: "inline-block" }}>Get Started</span>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 60px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 20, lineHeight: 1.1 }}>
            Ready to issue<br /><span style={{ color: "#2af598" }}>unbreakable certificates?</span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(232,234,240,0.5)", marginBottom: 40, fontFamily: "'DM Mono', monospace", fontWeight: 300, lineHeight: 1.7 }}>
            Register your organization and issue your first<br />blockchain-verified certificate in under 5 minutes.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => navigate("/register")} style={{ fontSize: 16, padding: "16px 40px" }}>
              Register Organization →
            </button>
            <button className="btn-outline" onClick={() => navigate("/verify")} style={{ fontSize: 16, padding: "16px 40px" }}>
              Verify a Certificate
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(232,234,240,0.25)", letterSpacing: "0.05em" }}>
          VERIFYX — Blockchain Certificate Verification · Built for Hackathon 2026
        </div>
      </footer>
    </div>
  );
}
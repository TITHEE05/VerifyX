import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function Dashboard() {
  const navigate = useNavigate();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revoking, setRevoking] = useState(null); // certId being revoked
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

const orgRaw = localStorage.getItem("vx_org");
const org = JSON.parse((orgRaw && orgRaw !== "undefined") ? orgRaw : "{}");
console.log("org data:", org);
const token = localStorage.getItem("vx_token");

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchCerts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCerts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/cert/all");
      setCerts(res.data.certificates || []);
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        setError("Failed to load certificates. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (certId) => {
    if (!window.confirm("Are you sure you want to revoke this certificate? This cannot be undone.")) return;
    setRevoking(certId);
    try {
      await API.post(`/cert/revoke/${certId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCerts((prev) =>
        prev.map((c) => c.certId === certId ? { ...c, status: "revoked" } : c)
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to revoke certificate.");
    } finally {
      setRevoking(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vx_token");
    localStorage.removeItem("vx_org");
    navigate("/login");
  };

  // Filter + search
  const filtered = certs.filter((c) => {
    const matchSearch =
      c.recipientName?.toLowerCase().includes(search.toLowerCase()) ||
      c.certId?.toLowerCase().includes(search.toLowerCase()) ||
      c.courseName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && !c.isRevoked) ||
        (filterStatus === "revoked" && c.isRevoked);
        return matchSearch && matchStatus;
    });

  // Stats
  const total = certs.length;
  const active = certs.filter((c) => !c.isRevoked).length;
  const revoked = certs.filter((c) => c.isRevoked).length;

  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* ── SIDEBAR ── */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logo} onClick={() => navigate("/")}>
            <span style={styles.logoMark}>VX</span>
            <span style={styles.logoText}>VerifyX</span>
          </div>

          <nav style={styles.nav}>
            <div style={{ ...styles.navItem, ...styles.navItemActive }}>
              <span style={styles.navIcon}>▦</span> Dashboard
            </div>
            <div style={styles.navItem} onClick={() => navigate("/issue")}>
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
          <button style={styles.logoutBtn} className="logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={styles.main}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Dashboard</h1>
            <p style={styles.pageSubtitle}>
              Manage all certificates issued by {org.orgName || "your organization"}
            </p>
          </div>
          <button
            style={styles.issueBtn}
            className="issue-btn"
            onClick={() => navigate("/issue")}
          >
            + Issue Certificate
          </button>
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          {[
            { label: "Total Issued", value: total, color: "#e8eaf0" },
            { label: "Active", value: active, color: "#2af598" },
            { label: "Revoked", value: revoked, color: "#ff6b6b" },
          ].map((stat) => (
            <div key={stat.label} style={styles.statCard} className="stat-card">
              <div style={{ ...styles.statValue, color: stat.color }}>{stat.value}</div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={styles.toolbar}>
          <input
            style={styles.searchInput}
            className="vx-input"
            type="text"
            placeholder="Search by name, course or certificate ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={styles.filterRow}>
            {["all", "active", "revoked"].map((status) => (
              <button
                key={status}
                style={{
                  ...styles.filterBtn,
                  ...(filterStatus === status ? styles.filterBtnActive : {}),
                }}
                onClick={() => setFilterStatus(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={styles.tableWrap}>
          {loading ? (
            <div style={styles.emptyState}>
              <span className="spinner-lg" />
              <p style={styles.emptyText}>Loading certificates...</p>
            </div>
          ) : error ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>⚠</div>
              <p style={{ ...styles.emptyText, color: "#ff8080" }}>{error}</p>
              <button style={styles.retryBtn} onClick={fetchCerts}>Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📋</div>
              <p style={styles.emptyText}>
                {certs.length === 0
                  ? "No certificates issued yet."
                  : "No certificates match your search."}
              </p>
              {certs.length === 0 && (
                <button
                  style={styles.retryBtn}
                  onClick={() => navigate("/issue")}
                >
                  Issue your first certificate →
                </button>
              )}
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Recipient", "Course", "Certificate ID", "Issued On", "Status", "Actions"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((cert, i) => (
                  <tr
                    key={cert.certId}
                    style={styles.tr}
                    className="cert-row"
                  >
                    <td style={styles.td}>
                      <div style={styles.recipientName}>{cert.recipientName}</div>
                      <div style={styles.recipientEmail}>{cert.recipientEmail}</div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.courseName}>{cert.courseName}</div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.certIdChip}>{cert.certId}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.dateText}>
                        {new Date(cert.issuedAt || cert.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        background: !cert.isRevoked
                          ? "rgba(42,245,152,0.1)"
                          : "rgba(255,107,107,0.1)",
                        color: !cert.isRevoked ? "#2af598" : "#ff6b6b",
                        border: `1px solid ${!cert.isRevoked
                          ? "rgba(42,245,152,0.25)"
                          : "rgba(255,107,107,0.25)"}`,
                      }}>
                        {!cert.isRevoked ? "✓ Active" : "✕ Revoked"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button
                          style={styles.viewBtn}
                          className="action-btn"
                          onClick={() => navigate(`/certificate/${cert.certId}`)}
                        >
                          View
                        </button>
                        {!cert.isRevoked && (
                          <button
                            style={styles.revokeBtn}
                            className="revoke-btn"
                            onClick={() => handleRevoke(cert.certId)}
                            disabled={revoking === cert.certId}
                          >
                            {revoking === cert.certId ? "..." : "Revoke"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div style={styles.tableFooter}>
            Showing {filtered.length} of {total} certificate{total !== 1 ? "s" : ""}
          </div>
        )}
      </main>
    </div>
  );
}

/* ── STYLES ── */
const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#050810",
    color: "#e8eaf0",
    fontFamily: "'Syne', sans-serif",
  },
  sidebar: {
    width: 240,
    background: "rgba(255,255,255,0.02)",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "28px 0",
    position: "sticky",
    top: 0,
    height: "100vh",
    flexShrink: 0,
  },
  sidebarTop: { padding: "0 20px" },
  logo: {
    display: "flex", alignItems: "center", gap: 10,
    cursor: "pointer", marginBottom: 40,
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
    letterSpacing: "-0.01em",
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
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 700, color: "#2af598", flexShrink: 0,
  },
  orgName: { fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" },
  orgEmail: {
    fontSize: 11, color: "rgba(232,234,240,0.35)",
    fontFamily: "'DM Mono', monospace", marginTop: 2,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140,
  },
  logoutBtn: {
    width: "100%", background: "transparent",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(232,234,240,0.4)", padding: "9px",
    fontSize: 13, fontFamily: "'Syne', sans-serif",
    fontWeight: 600, cursor: "pointer", borderRadius: 4,
    transition: "all 0.2s",
  },
  main: {
    flex: 1, padding: "40px 48px",
    overflowX: "auto",
  },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 36, flexWrap: "wrap", gap: 16,
  },
  pageTitle: {
    fontSize: 32, fontWeight: 800,
    letterSpacing: "-0.03em", marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 13, color: "rgba(232,234,240,0.45)",
    fontFamily: "'DM Mono', monospace", fontWeight: 300,
  },
  issueBtn: {
    background: "#2af598", color: "#050810",
    border: "none", padding: "12px 24px",
    fontSize: 14, fontWeight: 700,
    fontFamily: "'Syne', sans-serif",
    cursor: "pointer",
    clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
    transition: "all 0.2s",
  },
  statsRow: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16, marginBottom: 28,
  },
  statCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    padding: "24px 28px", borderRadius: 2,
    transition: "border-color 0.2s",
  },
  statValue: {
    fontSize: 40, fontWeight: 800,
    fontFamily: "'DM Mono', monospace",
    letterSpacing: "-0.03em", lineHeight: 1,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12, color: "rgba(232,234,240,0.4)",
    fontFamily: "'DM Mono', monospace",
    letterSpacing: "0.05em", textTransform: "uppercase",
  },
  toolbar: {
    display: "flex", gap: 12, marginBottom: 20,
    flexWrap: "wrap", alignItems: "center",
  },
  searchInput: {
    flex: 1, minWidth: 200,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#e8eaf0", padding: "10px 16px",
    fontSize: 13, fontFamily: "'DM Mono', monospace",
    fontWeight: 300, outline: "none", borderRadius: 2,
    transition: "border-color 0.2s",
  },
  filterRow: { display: "flex", gap: 6 },
  filterBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(232,234,240,0.4)",
    padding: "9px 16px", fontSize: 12,
    fontFamily: "'Syne', sans-serif", fontWeight: 600,
    cursor: "pointer", borderRadius: 2,
    transition: "all 0.15s", letterSpacing: "0.02em",
  },
  filterBtnActive: {
    background: "rgba(42,245,152,0.1)",
    border: "1px solid rgba(42,245,152,0.3)",
    color: "#2af598",
  },
  tableWrap: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 2, overflow: "hidden",
    minHeight: 200,
  },
  table: {
    width: "100%", borderCollapse: "collapse",
  },
  th: {
    padding: "14px 20px",
    textAlign: "left", fontSize: 11,
    fontWeight: 600, letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(232,234,240,0.35)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.01)",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    transition: "background 0.15s",
  },
  td: {
    padding: "16px 20px",
    fontSize: 13, verticalAlign: "middle",
  },
  recipientName: {
    fontWeight: 600, fontSize: 14,
    letterSpacing: "-0.01em", marginBottom: 2,
  },
  recipientEmail: {
    fontSize: 11, color: "rgba(232,234,240,0.35)",
    fontFamily: "'DM Mono', monospace",
  },
  courseName: {
    fontSize: 13, color: "rgba(232,234,240,0.7)",
    fontFamily: "'DM Mono', monospace", fontWeight: 300,
  },
  certIdChip: {
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    color: "rgba(232,234,240,0.5)",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    padding: "3px 8px", borderRadius: 2,
  },
  dateText: {
    fontFamily: "'DM Mono', monospace", fontSize: 12,
    color: "rgba(232,234,240,0.45)",
  },
  statusBadge: {
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    fontWeight: 500, padding: "4px 10px",
    borderRadius: 2, whiteSpace: "nowrap",
  },
  actions: { display: "flex", gap: 8 },
  viewBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(232,234,240,0.6)",
    padding: "6px 14px", fontSize: 12,
    fontFamily: "'Syne', sans-serif", fontWeight: 600,
    cursor: "pointer", borderRadius: 2, transition: "all 0.15s",
  },
  revokeBtn: {
    background: "transparent",
    border: "1px solid rgba(255,107,107,0.2)",
    color: "#ff6b6b", padding: "6px 14px",
    fontSize: 12, fontFamily: "'Syne', sans-serif",
    fontWeight: 600, cursor: "pointer",
    borderRadius: 2, transition: "all 0.15s",
  },
  emptyState: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "60px 24px", gap: 12,
  },
  emptyIcon: {
    fontSize: 36, marginBottom: 4,
    opacity: 0.4,
  },
  emptyText: {
    fontFamily: "'DM Mono', monospace", fontSize: 13,
    color: "rgba(232,234,240,0.35)", textAlign: "center",
  },
  retryBtn: {
    background: "transparent",
    border: "1px solid rgba(42,245,152,0.3)",
    color: "#2af598", padding: "9px 20px",
    fontSize: 13, fontFamily: "'Syne', sans-serif",
    fontWeight: 600, cursor: "pointer",
    borderRadius: 2, marginTop: 8, transition: "all 0.2s",
  },
  tableFooter: {
    marginTop: 12, fontSize: 12,
    color: "rgba(232,234,240,0.25)",
    fontFamily: "'DM Mono', monospace",
    textAlign: "right",
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  .vx-input:focus {
    border-color: rgba(42,245,152,0.4) !important;
    background: rgba(42,245,152,0.03) !important;
  }
  .vx-input::placeholder { color: rgba(232,234,240,0.2); }

  .cert-row:hover { background: rgba(255,255,255,0.025) !important; }

  .action-btn:hover {
    border-color: rgba(232,234,240,0.3) !important;
    color: #e8eaf0 !important;
  }

  .revoke-btn:hover {
    background: rgba(255,107,107,0.08) !important;
    border-color: rgba(255,107,107,0.4) !important;
  }

  .issue-btn:hover {
    background: #fff !important;
    box-shadow: 0 6px 24px rgba(42,245,152,0.25);
    transform: translateY(-1px);
  }

  .logout-btn:hover {
    border-color: rgba(255,107,107,0.3) !important;
    color: #ff6b6b !important;
  }

  .stat-card:hover {
    border-color: rgba(42,245,152,0.2) !important;
  }

  .nav-item:hover {
    background: rgba(255,255,255,0.04);
    color: rgba(232,234,240,0.8);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .spinner-lg {
    display: inline-block;
    width: 28px; height: 28px;
    border: 2px solid rgba(232,234,240,0.1);
    border-top-color: #2af598;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
`;
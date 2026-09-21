import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";
import { Loader2, Check, UserPlus, X } from "lucide-react";

export default function GoogleSignInButton({ text = "Continue with Google" }) {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  const { loginWithGoogle } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  async function performGoogleAuth(profile) {
    setLoading(true);
    setModalOpen(false);

    try {
      await loginWithGoogle(profile);
      addToast(`Signed in with Google as ${profile.name}!`, "success");
      navigate("/dashboard");
    } catch (err) {
      addToast(err?.response?.data?.error || "Google authentication failed", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleAccountSelect(name, email) {
    performGoogleAuth({
      name,
      email,
      googleId: "google_" + btoa(email).replace(/=/g, "").slice(0, 12),
    });
  }

  function handleCustomSubmit(e) {
    e.preventDefault();
    if (!customEmail || !customName) return;
    performGoogleAuth({
      name: customName,
      email: customEmail,
      googleId: "google_" + btoa(customEmail).replace(/=/g, "").slice(0, 12),
    });
  }

  return (
    <>
      <button
        type="button"
        className="btn-google-auth"
        onClick={() => setModalOpen(true)}
        disabled={loading}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.35 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
        <span>{loading ? "Authenticating with Google..." : text}</span>
      </button>

      {/* Google Account Selector Dialog */}
      {modalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: "420px",
              padding: "28px",
              borderRadius: "var(--radius-xl)",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                    Sign in with Google
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--text-subtle)" }}>
                    to continue to AuraBudget AI
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-subtle)",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {!isCustomMode ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
                  Choose an account:
                </p>

                {/* Primary Account: Aditya Raj */}
                <div
                  role="button"
                  tabIndex={0}
                  className="google-account-card"
                  onClick={() => handleAccountSelect("Aditya Raj", "aditya.raj@gmail.com")}
                  onKeyDown={(e) => e.key === "Enter" && handleAccountSelect("Aditya Raj", "aditya.raj@gmail.com")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #4285f4, #34a853)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "14px",
                    }}
                  >
                    A
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>Aditya Raj</div>
                    <div style={{ fontSize: "12px", color: "var(--text-subtle)", textOverflow: "ellipsis", overflow: "hidden" }}>
                      aditya.raj@gmail.com
                    </div>
                  </div>
                  <Check size={16} color="var(--primary)" />
                </div>

                {/* Secondary Account: Demo Explorer */}
                <div
                  role="button"
                  tabIndex={0}
                  className="google-account-card"
                  onClick={() => handleAccountSelect("Aditya (Personal)", "aditya5250@gmail.com")}
                  onKeyDown={(e) => e.key === "Enter" && handleAccountSelect("Aditya (Personal)", "aditya5250@gmail.com")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #ea4335, #fbbc05)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "14px",
                    }}
                  >
                    A
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>Aditya (Personal)</div>
                    <div style={{ fontSize: "12px", color: "var(--text-subtle)", textOverflow: "ellipsis", overflow: "hidden" }}>
                      aditya5250@gmail.com
                    </div>
                  </div>
                </div>

                {/* Option to enter custom Google account */}
                <button
                  type="button"
                  onClick={() => setIsCustomMode(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    background: "transparent",
                    border: "1px dashed var(--border-card)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                    cursor: "pointer",
                    marginTop: "6px",
                  }}
                >
                  <UserPlus size={16} />
                  <span>Use another Google account</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Enter your Google Account details:
                </p>

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="form-input-wrapper">
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Google Email</label>
                  <div className="form-input-wrapper">
                    <input
                      type="email"
                      placeholder="user@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsCustomMode(false)}
                    style={{ flex: 1 }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Continue
                  </button>
                </div>
              </form>
            )}

            <p
              style={{
                fontSize: "11px",
                color: "var(--text-subtle)",
                textAlign: "center",
                marginTop: "18px",
                lineHeight: 1.4,
              }}
            >
              To continue, Google will share your name, email address, and profile picture with AuraBudget AI.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

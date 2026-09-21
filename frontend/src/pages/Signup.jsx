import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import {
  Wallet,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  TrendingUp,
  ShieldCheck,
  Sun,
  Moon,
} from "lucide-react";
import "../styles/auth.css";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  const { signup } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await signup({ name, email, password });
      addToast("Account created successfully! Welcome aboard.", "success");
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.error || "Registration failed. Email may already be in use.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      {/* Floating Theme Toggle */}
      <button
        type="button"
        className="auth-theme-toggle"
        onClick={toggleTheme}
        title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
        aria-label="Toggle Theme"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="auth-container">
        {/* Left Hero Marketing Panel */}
        <div className="auth-hero">
          <div>
            <div className="auth-hero-brand">
              <div className="brand-icon-wrapper">
                <Wallet size={22} />
              </div>
              <span className="brand-title">AuraBudget</span>
              <span className="brand-badge">AI</span>
            </div>

            <h2 className="auth-hero-tagline">
              Build effortless financial confidence.
            </h2>
            <p className="auth-hero-desc">
              Join thousands who track smarter with automated AI budgeting, instant anomaly alerts, and personalized saving blueprints.
            </p>

            <ul className="auth-feature-list">
              <li className="auth-feature-item">
                <div className="auth-feature-icon">
                  <Sparkles size={15} />
                </div>
                <span>Intelligent AI Financial Assistant on standby</span>
              </li>
              <li className="auth-feature-item">
                <div className="auth-feature-icon">
                  <TrendingUp size={15} />
                </div>
                <span>Visual 50/30/20 category budget health</span>
              </li>
              <li className="auth-feature-item">
                <div className="auth-feature-icon">
                  <ShieldCheck size={15} />
                </div>
                <span>Private, encrypted, and production hardened</span>
              </li>
            </ul>
          </div>

          <div className="auth-hero-footer">
            <span>© 2026 Aura Budget AI. Built for modern financial discipline.</span>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Create Account</h1>
            <p className="auth-form-subtitle">Get started with Google or email in seconds.</p>
          </div>

          {error && <div className="auth-error-alert">{error}</div>}

          {/* Continue with Google */}
          <div style={{ marginBottom: "20px" }}>
            <GoogleSignInButton text="Sign up with Google" />
          </div>

          <div className="demo-login-divider">
            <span>or create account with email</span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="form-input-wrapper">
                <input
                  type="text"
                  placeholder="e.g. Aditya Raj"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="form-input-wrapper">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: "12px", width: "100%", marginTop: "4px" }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Creating Account...
                </>
              ) : (
                "Get Started Free"
              )}
            </button>
          </form>

          <p className="auth-switch-prompt">
            Already have an account?
            <Link to="/login" className="auth-switch-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
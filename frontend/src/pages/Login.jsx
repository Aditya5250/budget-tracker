import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const { login, signup } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      addToast("Welcome back!", "success");
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  // 1-Click Demo Login
  async function handleDemoLogin() {
    setDemoLoading(true);
    setError(null);

    const demoCreds = {
      name: "Demo Explorer",
      email: "demo@aurabudget.app",
      password: "DemoPassword123!",
    };

    try {
      await login({ email: demoCreds.email, password: demoCreds.password });
      addToast("Logged in as Demo Explorer!", "success");
      navigate("/dashboard");
    } catch (err) {
      try {
        await signup(demoCreds);
        addToast("Created and logged into demo session!", "success");
        navigate("/dashboard");
      } catch (signupErr) {
        setError("Demo login unavailable. Please create an account.");
      }
    } finally {
      setDemoLoading(false);
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
              Master your finances with intelligent AI clarity.
            </h2>
            <p className="auth-hero-desc">
              Track income, manage category budgets, detect anomalies, and consult your personal AI financial advisor in real-time.
            </p>

            <ul className="auth-feature-list">
              <li className="auth-feature-item">
                <div className="auth-feature-icon">
                  <Sparkles size={15} />
                </div>
                <span>Natural language transaction parsing</span>
              </li>
              <li className="auth-feature-item">
                <div className="auth-feature-icon">
                  <TrendingUp size={15} />
                </div>
                <span>Interactive cashflow & category breakdown charts</span>
              </li>
              <li className="auth-feature-item">
                <div className="auth-feature-icon">
                  <ShieldCheck size={15} />
                </div>
                <span>Secure JWT authentication & PostgreSQL storage</span>
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
            <h1 className="auth-form-title">Welcome Back</h1>
            <p className="auth-form-subtitle">Sign in with Google or your credentials to continue.</p>
          </div>

          {error && <div className="auth-error-alert">{error}</div>}

          {/* Continue with Google */}
          <div style={{ marginBottom: "20px" }}>
            <GoogleSignInButton text="Continue with Google" />
          </div>

          <div className="demo-login-divider">
            <span>or sign in with email</span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="form-input-wrapper">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
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
              disabled={loading || demoLoading}
              style={{ padding: "12px", width: "100%", marginTop: "4px" }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* 1-Click Demo Button */}
          <div className="demo-login-divider">
            <span>or instant exploration</span>
          </div>

          <button
            type="button"
            className="btn btn-ai"
            onClick={handleDemoLogin}
            disabled={loading || demoLoading}
            style={{ width: "100%", padding: "12px" }}
          >
            {demoLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Preparing Demo...
              </>
            ) : (
              <>
                <Sparkles size={16} /> 1-Click Live Demo Guest Login
              </>
            )}
          </button>

          <p className="auth-switch-prompt">
            Don't have an account?
            <Link to="/signup" className="auth-switch-link">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
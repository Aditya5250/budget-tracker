import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate("/dashboard"); // ✅ guaranteed redirect
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <h1>BudgetTracker</h1>
        <p className="tagline">Take Control Of Your Money</p>

        <ul className="features">
          <li>✓ Track income & expenses</li>
          <li>✓ Clear financial overview</li>
          <li>✓ Simple, fast & secure</li>
        </ul>
      </div>

      <div className="auth-page">
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={{ marginTop: "12px", textAlign: "center" }}>
          Don’t have an account?{" "}
          <Link to="/signup" style={{ color: "#3b82f6" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { signupApi } from "../api/auth.api";
import "../styles/auth.css";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setLoading(true);

    try {
      await signupApi({ name, email, password });
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <h1>BudgetTracker</h1>
        <p className="tagline">Build Better Money Habits</p>

        <ul className="features">
          <li>✓ Track income & expenses</li>
          <li>✓ Understand spending patterns</li>
          <li>✓ Stay financially disciplined</li>
        </ul>
      </div>

      <div className="auth-page">
        <h2>Create account</h2>

        <form onSubmit={handleSubmit}>
          <input
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p style={{ marginTop: "12px", textAlign: "center" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#3b82f6" }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signupApi } from '../api/auth.api'
import '../styles/auth.css'

export default function Signup() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)

    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        setError(null)

        if (!name || !email || !password) {
            setError('All fields are required')
            return
        }

        try {
            await signupApi({ name, email, password })
            navigate('/login')
        } catch (err) {
            setError('Signup failed')
        }
    }

    return (
  <div className="auth-layout">
    {/* Left branding / value panel */}
    <div className="auth-brand">
      <h1>BudgetTracker</h1>
      <p className="tagline">Build Better Money Habits</p>

      <ul className="features">
        <li>✓ Track income & expenses</li>
        <li>✓ Understand spending patterns</li>
        <li>✓ Stay financially disciplined</li>
      </ul>
    </div>

    {/* Right signup form */}
    <div className="auth-page">
      <h2>Create account</h2>

      <input
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="error">{error}</p>}

      <button onClick={handleSubmit}>Create account</button>

      <p style={{ marginTop: "12px", textAlign: "center" }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "#3b82f6" }}>
          Login
        </Link>
      </p>
    </div>
  </div>
)
}
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)

    const { login } = useAuth()
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        setError(null)

        if (!email || !password) {
            setError('All fields are required')
            return
        }

        try {
            await login({ email, password })
            navigate('/dashboard')
        } catch (err) {
            setError('Invalid email or password')
        }
    }

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

                <button onClick={handleSubmit}>Login</button>

                <p style={{ marginTop: "12px", textAlign: "center" }}>
                    Don’t have an account?{" "}
                    <Link to="/signup" style={{ color: "#3b82f6" }}>
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    )
}
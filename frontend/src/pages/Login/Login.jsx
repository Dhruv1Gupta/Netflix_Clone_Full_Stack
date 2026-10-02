import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { usePageTitle } from "../../hooks/usePageTitle";
import "./Login.scss";

export default function Login() {
  usePageTitle("Sign In");
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await login({ email, password });
    setSubmitting(false);

    if (result.ok) {
      notify("Welcome back!", { type: "success" });
      navigate(redirectTo, { replace: true });
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Sign In</h1>
        <p className="auth-card__subtitle">Welcome back to NETFLIX.</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <p className="auth-form__error" role="alert">
              {error}
            </p>
          )}

          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="auth-card__footer">
          New to NETFLIX? <Link to="/signup">Create an account</Link>
        </p>

        <div className="auth-card__hint-box">
          Demo credentials: alice@example.com / bob@example.com /
          charlie@example.com — password for all: pass1234. The API cold-starts
          on the free tier, so the first request can take 20–30 seconds.
        </div>
      </div>
    </div>
  );
}

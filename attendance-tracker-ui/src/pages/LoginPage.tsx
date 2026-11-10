import {
  useState,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import CompanyBrand from "../components/CompanyBrand";

import {
  login,
} from "../services/auth";

import {
  hasValidSession,
  saveAuthSession,
} from "../services/authStorage";

function LoginPage() {
  const navigate =
    useNavigate();

  const [
    userName,
    setUserName,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  if (hasValidSession()) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !userName.trim() ||
      !password
    ) {
      setError(
        "Please enter your username and password."
      );

      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response =
        await login({
          userName:
            userName.trim(),
          password,
        });

      saveAuthSession(
        response
      );

      navigate(
        "/",
        {
          replace: true,
        }
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Login failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-shell">
        <aside className="login-brand-panel">
          <div className="login-brand-top">
            <CompanyBrand />
          </div>

          <div className="login-brand-content">
            <span className="login-brand-kicker">
              Internal Attendance Platform
            </span>

            <h1>
              Your attendance
              <br />
              workspace.
            </h1>

            <p>
              Manage attendance, employees, and
              reports in one place.
            </p>

            <div className="login-brand-features">
              <div>
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <rect x="4" y="5" width="16" height="16" rx="2" />
                    <path d="M8 3v4m8-4v4M4 11h16m-12 5 2 2 5-5" />
                  </svg>
                </span>

                <strong>
                  Attendance tracking
                </strong>
              </div>

              <div>
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <circle cx="9" cy="8" r="3" />
                    <path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 4v3" />
                  </svg>
                </span>

                <strong>
                  Employee directory
                </strong>
              </div>

              <div>
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 16v2m4-5v5m4-7v7" />
                  </svg>
                </span>

                <strong>
                  Reports &amp; exports
                </strong>
              </div>
            </div>
          </div>

          <div className="login-brand-footer">
            Colour Plus Printing Systems

            <span>
              •
            </span>

            Attendance Tracker
          </div>
        </aside>

        <section className="login-form-panel">
          <div className="login-form-wrap">
            <div className="login-mobile-brand">
              <CompanyBrand />
            </div>

            <div className="login-heading">
              <span>
                Attendance Tracker
              </span>

              <h2>
                Welcome back
              </h2>

              <p>
                Sign in with your account to access
                your attendance workspace.
              </p>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="login-form"
            >
              <label className="login-field">
                <span>
                  Username
                </span>

                <div>
                  <input
                    type="text"
                    value={userName}
                    onChange={(event) =>
                      setUserName(
                        event.target.value
                      )
                    }
                    autoComplete="username"
                    disabled={loading}
                    placeholder="Enter username"
                  />
                </div>
              </label>

              <label className="login-field">
                <span>
                  Password
                </span>

                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    autoComplete="current-password"
                    disabled={loading}
                    placeholder="Enter password"
                  />
                </div>
              </label>

              {error && (
                <div className="login-error">
                  <strong>
                    Sign in failed
                  </strong>

                  <span>
                    {error}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                <span>
                  {loading
                    ? "Signing in..."
                    : "Sign in"}
                </span>

                {!loading && (
                  <span aria-hidden="true">
                    →
                  </span>
                )}
              </button>
            </form>

            <p className="login-access-help">
              Need access? <strong>Contact your administrator.</strong>
            </p>

            <div className="login-security-note">
              <span>
                ●
              </span>

              Secure internal access
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

export default LoginPage;

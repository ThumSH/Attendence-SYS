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
              Attendance,
              <br />
              clearly managed.
            </h1>

            <p>
              A secure internal workspace for
              reviewing processed attendance,
              employee records and operational
              reports.
            </p>

            <div className="login-brand-features">
              <div>
                <span>
                  01
                </span>

                <strong>
                  Processed attendance records
                </strong>
              </div>

              <div>
                <span>
                  02
                </span>

                <strong>
                  Department and employee reports
                </strong>
              </div>

              <div>
                <span>
                  03
                </span>

                <strong>
                  Secure internal access
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
                Welcome back
              </span>

              <h2>
                Sign in to continue
              </h2>

              <p>
                Use your Attendance Tracker
                account credentials.
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
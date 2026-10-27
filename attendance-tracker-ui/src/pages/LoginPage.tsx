import {
  useState,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

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
      !userName.trim()
      ||
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
      <section className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            A
          </div>

          <div>
            <h1>
              Attendance Tracker
            </h1>

            <p>
              Colour Plus Printing Systems
            </p>
          </div>
        </div>

        <div className="login-heading">
          <h2>
            Sign in
          </h2>

          <p>
            Enter your account
            details to continue.
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="login-form"
        >
          <div className="field">
            <label>
              Username
            </label>

            <input
              type="text"
              value={
                userName
              }
              onChange={(e) =>
                setUserName(
                  e.target.value
                )
              }
              autoComplete="username"
              disabled={
                loading
              }
            />
          </div>

          <div className="field">
            <label>
              Password
            </label>

            <input
              type="password"
              value={
                password
              }
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              autoComplete="current-password"
              disabled={
                loading
              }
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary-button login-button"
            disabled={
              loading
            }
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
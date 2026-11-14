"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { authenticate, type AuthFormState } from "../actions/auth";

const initialState: AuthFormState = {};

export default function LoginForm({ configured }: { configured: boolean }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(authenticate, initialState);
  const visibleState = state.mode === mode ? state : {};
  const isSignup = mode === "signup";

  function changeMode(nextMode: "login" | "signup") {
    setMode(nextMode);
    setShowPassword(false);
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section aria-label="About Secure Notes" className="auth-story">
          <Link className="auth-brand" href="/">
            <span aria-hidden="true" className="auth-brand-mark">
              <svg fill="none" viewBox="0 0 24 24">
                <path d="M6.5 4.75h8.75l3.25 3.5v11H6.5a1.75 1.75 0 0 1-1.75-1.75V6.5A1.75 1.75 0 0 1 6.5 4.75Z" />
                <path d="M14.75 4.75v3.5h3.5M8.5 12h7M8.5 15.5h7" />
              </svg>
            </span>
            <span>Secure Notes</span>
          </Link>

          <div className="auth-story-copy">
            <span className="auth-overline">A calmer way to keep track</span>
            <h1>Your best teaching happens between the lines.</h1>
            <p>
              Keep student progress, lesson ideas, and the little details that make a difference in one private space.
            </p>
            <div aria-hidden="true" className="auth-illustration">
              <span className="auth-orbit auth-orbit-one" />
              <span className="auth-orbit auth-orbit-two" />
              <span className="auth-illustration-sun" />
              <span className="auth-illustration-paper">
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className="auth-illustration-spark">✳</span>
            </div>
            <div className="auth-benefits">
              <div>
                <span aria-hidden="true" className="auth-benefit-icon">
                  <svg fill="none" viewBox="0 0 24 24">
                    <path d="M7.25 10V7.75a4.75 4.75 0 0 1 9.5 0V10m-11 0h12.5a1.25 1.25 0 0 1 1.25 1.25v7A1.25 1.25 0 0 1 18.25 19.5H5.75a1.25 1.25 0 0 1-1.25-1.25v-7A1.25 1.25 0 0 1 5.75 10Z" />
                  </svg>
                </span>
                <span><strong>Private by default</strong><small>Your notes are for your eyes only.</small></span>
              </div>
              <div>
                <span aria-hidden="true" className="auth-benefit-icon">
                  <svg fill="none" viewBox="0 0 24 24">
                    <circle cx="10.8" cy="10.8" r="6.3" />
                    <path d="m15.5 15.5 4 4" />
                  </svg>
                </span>
                <span><strong>Easy to find</strong><small>Search your notes whenever you need them.</small></span>
              </div>
              <div>
                <span aria-hidden="true" className="auth-benefit-icon">
                  <svg fill="none" viewBox="0 0 24 24">
                    <path d="M12 20s-7.5-4.1-7.5-10.1A4.15 4.15 0 0 1 12 7.7a4.15 4.15 0 0 1 7.5 2.2C19.5 15.9 12 20 12 20Z" />
                  </svg>
                </span>
                <span><strong>Made for educators</strong><small>A simple home for meaningful details.</small></span>
              </div>
            </div>
          </div>

          <p className="auth-story-footer">Thoughtful notes. More meaningful moments.</p>
        </section>

        <section aria-labelledby="auth-heading" className="auth-panel">
          <div className="auth-form-wrap">
            <Link aria-label="Secure Notes home" className="auth-mobile-brand" href="/">
              <span aria-hidden="true" className="auth-brand-mark">
                <svg fill="none" viewBox="0 0 24 24">
                  <path d="M6.5 4.75h8.75l3.25 3.5v11H6.5a1.75 1.75 0 0 1-1.75-1.75V6.5A1.75 1.75 0 0 1 6.5 4.75Z" />
                  <path d="M14.75 4.75v3.5h3.5M8.5 12h7M8.5 15.5h7" />
                </svg>
              </span>
              <span>Secure Notes</span>
            </Link>

            <p className="auth-step">{isSignup ? "GET STARTED" : "YOUR WORKSPACE IS WAITING"}</p>
            <h2 id="auth-heading">{isSignup ? "Create your account" : "Welcome back"}</h2>
            <p className="auth-intro">
              {isSignup
                ? "Make a little room for the details that matter."
                : "Sign in to pick up right where you left off."}
            </p>

            <div className="auth-tabs" role="tablist" aria-label="Account access">
              <button
                aria-selected={!isSignup}
                className={`auth-tab${!isSignup ? " selected" : ""}`}
                onClick={() => changeMode("login")}
                role="tab"
                type="button"
              >
                Log in
              </button>
              <button
                aria-selected={isSignup}
                className={`auth-tab${isSignup ? " selected" : ""}`}
                onClick={() => changeMode("signup")}
                role="tab"
                type="button"
              >
                Sign up
              </button>
            </div>

            {!configured && (
              <p className="auth-message config-message" role="status">
                Add the Supabase URL and publishable key to .env.local, then restart the app.
              </p>
            )}

            {visibleState.error && (
              <p className="auth-message error-message" role="alert">{visibleState.error}</p>
            )}
            {visibleState.message && (
              <p className="auth-message success-message" role="status">{visibleState.message}</p>
            )}

            <form action={formAction} className="auth-form">
              <input name="mode" type="hidden" value={mode} />
              <label className="auth-field" htmlFor="email">
                <span>Email address</span>
                <span className="auth-input-wrap">
                  <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                    <rect height="14" rx="2" width="18" x="3" y="5" />
                    <path d="m4 7 8 6 8-6" />
                  </svg>
                  <input
                    autoComplete="email"
                    autoCapitalize="none"
                    disabled={!configured || pending}
                    id="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    spellCheck={false}
                    type="email"
                  />
                </span>
              </label>

              <label className="auth-field" htmlFor="password">
                <span>Password</span>
                <span className="auth-input-wrap">
                  <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                    <rect height="10" rx="2" width="16" x="4" y="10" />
                    <path d="M8 10V7a4 4 0 1 1 8 0v3m-4 4v2" />
                  </svg>
                  <input
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    disabled={!configured || pending}
                    id="password"
                    minLength={6}
                    name="password"
                    placeholder={isSignup ? "At least 6 characters" : "Enter your password"}
                    required
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="password-toggle"
                    disabled={!configured || pending}
                    onClick={() => setShowPassword((visible) => !visible)}
                    type="button"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </span>
              </label>

              {isSignup && (
                <p className="auth-password-hint">Use at least 6 characters for your password.</p>
              )}

              <button
                className="auth-submit"
                disabled={!configured || pending}
                type="submit"
              >
                {pending ? "Please wait..." : isSignup ? "Create account" : "Log in to your notes"}
                {!pending && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <p className="auth-privacy-note">
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                <path d="M7.25 10V7.75a4.75 4.75 0 0 1 9.5 0V10m-11 0h12.5a1.25 1.25 0 0 1 1.25 1.25v7A1.25 1.25 0 0 1 18.25 19.5H5.75a1.25 1.25 0 0 1-1.25-1.25v-7A1.25 1.25 0 0 1 5.75 10Z" />
              </svg>
              Your account and notes stay private.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

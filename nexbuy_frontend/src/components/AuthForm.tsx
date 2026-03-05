"use client";

import { FormEvent, useState } from "react";
import {
  loginWithEmail,
  registerWithEmail,
  requestGoogleAuthorization,
  saveAccessToken,
} from "@/lib/auth";

type AuthMode = "login" | "register";

type Props = {
  onSuccess?: () => void;
};

export default function AuthForm({ onSuccess }: Props) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      if (mode === "register") {
        const user = await registerWithEmail(email, password);
        setMessage(`Account created for ${user.email}. You can sign in now.`);
        setMode("login");
        setPassword("");
        return;
      }

      const token = await loginWithEmail(email, password);
      saveAccessToken(token);
      setMessage("Signed in successfully.");
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleGoogle() {
    setIsBusy(true);
    setError("");
    setMessage("");
    try {
      const authorizationUrl = await requestGoogleAuthorization();
      window.location.href = authorizationUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start Google sign-in.");
      setIsBusy(false);
    }
  }

  return (
    <div className="w-full max-w-[640px] rounded-2xl bg-white p-6 shadow-xl">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-3xl font-bold text-[#2d2a27]">Sign in / Register</h3>
      </div>

      <div className="grid grid-cols-2 rounded-xl bg-[#f3f3f3] p-1">
        <button
          className={`rounded-lg px-4 py-2 text-base font-semibold ${
            mode === "login" ? "bg-[#1f1f1f] text-white" : "text-[#5d5d5d]"
          }`}
          onClick={() => setMode("login")}
          type="button"
        >
          Sign In
        </button>
        <button
          className={`rounded-lg px-4 py-2 text-base font-semibold ${
            mode === "register" ? "bg-[#1f1f1f] text-white" : "text-[#5d5d5d]"
          }`}
          onClick={() => setMode("register")}
          type="button"
        >
          Register
        </button>
      </div>

      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
        <input
          autoComplete="email"
          className="h-12 w-full rounded-lg border border-[#dedede] px-4 text-base outline-none focus:border-[#8a6f58]"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          required
          type="email"
          value={email}
        />
        <input
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="h-12 w-full rounded-lg border border-[#dedede] px-4 text-base outline-none focus:border-[#8a6f58]"
          minLength={3}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
          type="password"
          value={password}
        />
        <button
          className="h-12 w-full rounded-lg bg-[#1f1f1f] text-lg font-semibold text-white disabled:opacity-60"
          disabled={isBusy}
          type="submit"
        >
          {isBusy ? "Please wait..." : mode === "login" ? "Continue" : "Create Account"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#e6e6e6]" />
        <span className="text-sm text-[#8f8f8f]">Or continue with other ways</span>
        <div className="h-px flex-1 bg-[#e6e6e6]" />
      </div>

      <button
        className="h-12 w-full rounded-lg border border-[#d8d8d8] text-lg font-semibold text-[#2d2d2d] disabled:opacity-60"
        disabled={isBusy}
        onClick={handleGoogle}
        type="button"
      >
        Continue With Google
      </button>

      {message ? <p className="mt-3 text-sm text-[#2f6f47]">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-[#bf2f4a]">{error}</p> : null}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { loginAction } from "./actions";

type FieldErrors = {
  email?: string;
  password?: string;
};

type LoginState = {
  error?: string;
};

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      type="submit"
      disabled={pending}
    >
      {pending ? "Signing in..." : "Sign In"}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (state.error) {
      setPassword("");
    }
  }, [state.error]);

  const validate = () => {
    const errors: FieldErrors = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!validate()) {
          event.preventDefault();
        }
      }}
      className="space-y-4"
    >
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(fieldErrors.email)}
          required
        />
        {fieldErrors.email ? (
          <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="password">
          Password
        </label>
        <div className="relative mt-1">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-12 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            minLength={8}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-xs font-semibold text-slate-500"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {fieldErrors.password ? (
          <p className="mt-1 text-xs text-rose-600">{fieldErrors.password}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <label className="flex items-center gap-2">
          <input name="remember" type="checkbox" className="h-4 w-4" />
          Remember me
        </label>
        <a className="text-sm font-medium text-slate-700" href="#">
          Forgot Password?
        </a>
      </div>

      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}

      <SubmitButton />
    </form>
  );
}

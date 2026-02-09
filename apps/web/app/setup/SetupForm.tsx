"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { bootstrapAction } from "./actions";

type SetupState = {
  error?: string;
  success?: boolean;
};

const initialState: SetupState = {};

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      type="submit"
      disabled={pending || disabled}
    >
      {pending ? "Creating..." : "Create Super Admin"}
    </button>
  );
}

export default function SetupForm() {
  const [state, formAction] = useFormState(bootstrapAction, initialState);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (state.error) {
      setPassword("");
    }
  }, [state.error]);

  if (state.success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-800">
        <p className="text-base font-semibold">Super Admin created successfully.</p>
        <p className="mt-2">
          The setup route is now locked. You can proceed to sign in from the login page.
        </p>
        <a className="mt-4 inline-flex text-sm font-semibold text-emerald-900" href="/login">
          Go to Login
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="full_name">
          Full Name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="designation">
          Designation (optional)
        </label>
        <input
          id="designation"
          name="designation"
          type="text"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
          placeholder="Super Admin"
        />
      </div>

      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}

      <SubmitButton />
    </form>
  );
}

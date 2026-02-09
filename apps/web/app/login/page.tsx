import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Marsana Fleet
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">Sign In</h1>
          <p className="mt-2 text-sm text-slate-600">
            Use your work email and password to continue.
          </p>
        </div>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}

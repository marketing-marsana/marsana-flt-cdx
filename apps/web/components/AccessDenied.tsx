export default function AccessDenied({ message }: { message?: string }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-start justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-rose-500">Access Denied</p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-900">You do not have access.</h1>
      <p className="mt-3 text-base text-slate-600">
        {message ?? "Your account does not have permission to view this page."}
      </p>
    </main>
  );
}

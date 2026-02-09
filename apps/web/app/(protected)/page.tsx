export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-start justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Authenticated Area
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-slate-900">Welcome to Marsana Fleet</h1>
      <p className="mt-3 text-base text-slate-600">
        Authentication is active. Protected routes now require a valid session.
      </p>
    </main>
  );
}

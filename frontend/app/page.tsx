import { HealthStatus } from "../components/health-status";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-teal-800">
          Tallyhold
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          All your brokers. One portfolio.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-slate-600">
          Your consolidated portfolio is on its way. The foundation is ready
          when the API is.
        </p>
      </div>
      <section
        aria-label="System status"
        className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm"
      >
        <p className="mb-2 text-sm text-slate-600">Connection status</p>
        <HealthStatus />
      </section>
    </main>
  );
}

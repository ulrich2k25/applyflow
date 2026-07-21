import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(520px,0.8fr)]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.5), transparent 35%), radial-gradient(circle at 80% 75%, rgba(14,165,233,0.3), transparent 40%)",
          }}
        />

        <Link
          href="/"
          className="relative flex items-center gap-3 text-xl font-semibold"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-500 font-bold shadow-lg shadow-indigo-950/40">
            A
          </span>
          ApplyFlow
        </Link>

        <div className="relative max-w-xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Votre recherche, enfin structurée
          </p>

          <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Transformez chaque candidature en
            prochaine étape claire.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Entreprises, entretiens, documents et
            relances réunis dans un espace simple et
            professionnel.
          </p>
        </div>

        <p className="relative text-sm text-slate-400">
          © {new Date().getFullYear()} ApplyFlow
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 flex items-center gap-3 text-lg font-semibold text-slate-950 lg:hidden"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
              A
            </span>
            ApplyFlow
          </Link>

          {children}
        </div>
      </section>
    </main>
  );
}
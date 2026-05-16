import { useEffect, useState } from "react";

export default function GastAppLandingPage({
  onStart
}: {
  onStart: () => void;
}) {


  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

useEffect(() => {

  const handler = (e: any) => {

    e.preventDefault();

    setDeferredPrompt(e);

  };

  window.addEventListener("beforeinstallprompt", handler);

  return () => {
    window.removeEventListener("beforeinstallprompt", handler);
  };

}, []);
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white overflow-hidden">
      {/* HERO */}
      <section className="relative px-6 py-24 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm mb-6">
              💸 Finanzas personales inteligentes
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight">
              Controla tus
              <span className="text-cyan-400"> quincenas </span>
              sin quedarte sin dinero.
            </h1>

            <p className="mt-8 text-lg text-gray-300 leading-relaxed max-w-2xl">
              GastAPP analiza tus ingresos, gastos, liquidez y pagos pendientes
              para ayudarte a entender cuánto dinero realmente puedes gastar
              hoy y cómo terminarás el mes.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
  onClick={onStart}
  className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-cyan-400/20"
>
  Probar Gratis
</button>
{deferredPrompt && (
  <button
    onClick={async () => {

      deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("✅ App instalada");
      }

    }}
    className="bg-white/10 border border-cyan-400/30 hover:bg-cyan-500/20 text-cyan-300 px-6 py-3 rounded-2xl font-semibold transition-all"
  >
    📲 Instalar App
  </button>
)}

              
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-gray-400">
              <div>✅ Proyección financiera</div>
              <div>✅ Control de liquidez</div>
              <div>✅ Distribución por quincenas</div>
            </div>
          </div>

          {/* MOCKUP */}
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400/20 blur-3xl rounded-full" />

            <div className="relative rounded-3xl border border-white/10 bg-zinc-900/80 backdrop-blur p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-sm text-gray-400">Disponible hoy</p>
                  <h2 className="text-4xl font-black text-cyan-400">
                    $180.000
                  </h2>
                </div>

                <div className="bg-red-500/10 text-red-400 px-4 py-2 rounded-xl text-sm border border-red-500/20">
                  Déficit proyectado
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Arriendo</p>
                    <p className="text-sm text-gray-400">Pendiente</p>
                  </div>

                  <p className="font-bold text-xl">$900.000</p>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Tarjeta de crédito</p>
                    <p className="text-sm text-gray-400">Pendiente</p>
                  </div>

                  <p className="font-bold text-xl">$800.000</p>
                </div>

                <div className="rounded-2xl bg-cyan-400/10 border border-cyan-400/20 p-4">
                  <p className="text-cyan-400 font-semibold">
                    ⚠️ Necesitas ajustar gastos o aumentar ingresos para cerrar el mes sin déficit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 py-20 md:px-16 lg:px-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-cyan-400 font-semibold uppercase tracking-widest mb-4">
              Características
            </p>

            <h2 className="text-4xl md:text-5xl font-black">
              Mucho más que registrar gastos
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Liquidez real",
                desc: "Entiende cuánto dinero realmente puedes usar hoy.",
              },
              {
                title: "Proyección mensual",
                desc: "Detecta si terminarás el mes en déficit o superávit.",
              },
              {
                title: "Reservas inteligentes",
                desc: "Aparta automáticamente dinero para gastos pendientes.",
              },
              {
                title: "Control por quincenas",
                desc: "Distribuye gastos según tus ingresos recurrentes.",
              },
              {
                title: "Alertas financieras",
                desc: "Recibe advertencias antes de quedarte sin dinero.",
              },
              {
                title: "Dashboard interactivo",
                desc: "Visualiza fácilmente tu situación financiera.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-8 hover:bg-white/[0.07] transition-all"
              >
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto text-center rounded-[40px] border border-white/10 bg-gradient-to-b from-cyan-400/10 to-transparent p-12 md:p-20">
          <h2 className="text-4xl md:text-6xl font-black leading-tight">
            Empieza a entender tu dinero de verdad.
          </h2>

          <p className="mt-6 text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
            GastAPP te ayuda a evitar déficit, organizar tus quincenas y tomar mejores decisiones financieras.
          </p>

          <button
  onClick={onStart}
  className="inline-flex mt-10 bg-cyan-400 hover:bg-cyan-300 text-black font-bold px-10 py-5 rounded-2xl transition-all shadow-2xl shadow-cyan-400/20"
>
  Probar GastAPP Gratis
</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 px-6 py-8 text-center text-gray-500 text-sm">
        © 2026 GastAPP — Developed by Marcela Ávila
      </footer>
    </div>
  );
}

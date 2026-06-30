import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "CopaEpica — Palpites Esportivos" },
      { name: "description", content: "Entre no jogo. Faça seus palpites e suba no ranking." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/palpites", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col items-center space-y-8 text-center">
          <img src="/assets/logo.png" alt="CopaEpica" className="h-20 object-contain" />

          <div>
            <h1 className="text-5xl font-display tracking-wider">CopaEpica</h1>
            <p className="mt-2 text-muted-foreground text-sm">
              Entre no jogo. Faça seus palpites e suba no ranking.
            </p>
          </div>

          <div className="w-full space-y-3">
            <Link
              to="/auth"
              className="block w-full bg-primary text-primary-foreground text-center py-4 font-display text-2xl tracking-wider brutal-border brutal-shadow"
            >
              Entrar
            </Link>
            <Link
              to="/auth"
              className="block w-full bg-secondary text-secondary-foreground text-center py-4 font-display text-2xl tracking-wider brutal-border brutal-shadow"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

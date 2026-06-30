import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import bgAuth from "@/assets/bg-auth.png";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Entrar — Copa Épica" }],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
  display_name: z.string().trim().min(2, "Mínimo 2 caracteres").max(40).optional(),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/palpites", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const parsed = schema.safeParse({
        email,
        password,
        display_name: mode === "signup" ? displayName : undefined,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/palpites`,
            data: { display_name: parsed.data.display_name },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Bora palpitar.");
        navigate({ to: "/palpites", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        navigate({ to: "/palpites", replace: true });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Algo deu errado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgAuth})`, viewTransitionName: "page-auth" } as any}
    >
      <Toaster position="top-center" />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col items-center space-y-5">
          <img src="/assets/logo.png" alt="PalpiteCLUB" className="h-16 object-contain" />
          <div className="w-full bg-white brutal-border brutal-shadow-yellow p-6 space-y-5">
          <div className="flex">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-3 brutal-border border-r-0 font-display text-2xl ${
                mode === "login" ? "bg-[color:var(--brand-blue)] text-white" : "bg-white text-black"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-3 brutal-border font-display text-2xl ${
                mode === "signup" ? "bg-[color:var(--brand-green)] text-white" : "bg-white text-black"
              }`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-bold uppercase mb-1 tracking-wider">
                  Nome de exibição
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full brutal-border p-3 font-bold focus:outline-none focus:bg-[color:var(--brand-yellow)]"
                  placeholder="Seu apelido"
                  maxLength={40}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase mb-1 tracking-wider">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full brutal-border p-3 font-bold focus:outline-none focus:bg-[color:var(--brand-yellow)]"
                placeholder="voce@email.com"
                maxLength={255}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1 tracking-wider">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full brutal-border p-3 font-bold focus:outline-none focus:bg-[color:var(--brand-yellow)]"
                placeholder="••••••"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[color:var(--brand-green)] text-white brutal-border brutal-shadow py-4 font-display text-2xl tracking-wider active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-transform disabled:opacity-60"
            >
              {loading ? "..." : mode === "login" ? "Entrar no jogo" : "Criar conta"}
            </button>
          </form>
        </div>
        </div>
      </main>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Copa Épica" }] }),
  component: PerfilPage,
});

type Profile = {
  id: string;
  display_name: string;
  points: number;
  correct_guesses: number;
  incorrect_guesses: number;
  created_at: string;
};

type RoundSummary = {
  round_number: number;
  round_points: number;
};

const nameSchema = z.string().trim().min(2, "Mínimo 2 caracteres").max(40, "Máximo 40");

async function fetchProfile(id: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("copaepica_profiles")
    .select("id,display_name,points,correct_guesses,incorrect_guesses,created_at")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Profile;
}

async function fetchRank(id: string) {
  const [profilesRes, predictionsRes, matchesRes] = await Promise.all([
    supabase.from("copaepica_profiles").select("id,points,correct_guesses"),
    supabase
      .from("copaepica_predictions")
      .select("user_id, match_id, predicted_a, predicted_b, created_at"),
    supabase
      .from("copaepica_matches")
      .select("id, result_a, result_b")
      .gte("match_date", "2026-06-28")
      .not("result_a", "is", null),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (predictionsRes.error) throw predictionsRes.error;
  if (matchesRes.error) throw matchesRes.error;

  const resultMap = new Map(
    (matchesRes.data ?? []).map((m) => [m.id, m]),
  );

  const scoreDiffMap = new Map<string, number>();
  const firstPredMap = new Map<string, string>();

  for (const pred of predictionsRes.data ?? []) {
    const match = resultMap.get(pred.match_id);
    if (!match) continue;
    const diff =
      Math.abs(pred.predicted_a - match.result_a!) +
      Math.abs(pred.predicted_b - match.result_b!);
    scoreDiffMap.set(
      pred.user_id,
      (scoreDiffMap.get(pred.user_id) ?? 0) + diff,
    );
    const existing = firstPredMap.get(pred.user_id);
    if (!existing || pred.created_at < existing) {
      firstPredMap.set(pred.user_id, pred.created_at);
    }
  }

  const sorted = (profilesRes.data ?? [])
    .map((p) => ({
      id: p.id,
      points: p.points,
      total_score_diff: scoreDiffMap.get(p.id) ?? 0,
      first_prediction_at: firstPredMap.get(p.id) ?? "",
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (a.total_score_diff !== b.total_score_diff)
        return a.total_score_diff - b.total_score_diff;
      if (a.first_prediction_at && b.first_prediction_at)
        return a.first_prediction_at.localeCompare(b.first_prediction_at);
      return 0;
    });

  const idx = sorted.findIndex((p) => p.id === id);
  return idx === -1 ? null : idx + 1;
}

async function fetchRoundHistory(userId: string): Promise<RoundSummary[]> {
  const [mRes, pRes] = await Promise.all([
    supabase
      .from("copaepica_matches")
      .select("id, round_number")
      .gte("match_date", "2026-06-28")
      .not("result_a", "is", null)
      .not("result_b", "is", null)
      .order("round_number", { ascending: true }),
    supabase
      .from("copaepica_predictions")
      .select("match_id, points_earned")
      .eq("user_id", userId),
  ]);
  if (mRes.error) throw mRes.error;
  if (pRes.error) throw pRes.error;

  const matchIdsWithPreds = new Set(pRes.data?.map((p) => p.match_id) ?? []);
  const ptsByMatch = new Map(
    pRes.data?.map((p) => [p.match_id, p.points_earned ?? 0]) ?? [],
  );
  const acc = new Map<number, number>();

  for (const m of mRes.data ?? []) {
    if (matchIdsWithPreds.has(m.id)) {
      acc.set(
        m.round_number,
        (acc.get(m.round_number) ?? 0) + (ptsByMatch.get(m.id) ?? 0),
      );
    }
  }

  return Array.from(acc.entries())
    .map(([rn, pts]) => ({ round_number: rn, round_points: pts }))
    .sort((a, b) => b.round_number - a.round_number)
    .slice(0, 3)
    .reverse();
}

function PerfilPage() {
  const { user } = Route.useRouteContext();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const { data: profile, isPending: profileLoading } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: () => fetchProfile(user.id),
  });
  const { data: rank, isPending: rankLoading } = useQuery({
    queryKey: ["my-rank", user.id],
    queryFn: () => fetchRank(user.id),
  });
  const { data: roundHistory, isPending: historyLoading } = useQuery({
    queryKey: ["round-history", user.id],
    queryFn: () => fetchRoundHistory(user.id),
  });

  const loading = profileLoading || rankLoading || historyLoading;
  const created = useRef(false);

  useEffect(() => {
    if (profile !== null || created.current) return;
    created.current = true;
    const displayName = user.email?.split("@")[0] ?? "User";
    supabase.from("copaepica_profiles").insert({
      id: user.id,
      display_name: displayName,
      points: 0,
      correct_guesses: 0,
      incorrect_guesses: 0,
    }).then(({ error }) => {
      if (error) console.error("Erro ao criar perfil:", error);
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
    });
  }, [profile, user.id, user.email, qc]);

  if (loading) {
    return (
      <div className="pb-4 animate-in fade-in duration-300" style={{ viewTransitionName: "page-perfil" } as any}>
        <header className="bg-[color:var(--brand-blue)] text-white brutal-border border-x-0 border-t-0 p-5">
          <h1 className="text-4xl font-display tracking-wider leading-none">MEU PERFIL</h1>
          <p className="text-[11px] uppercase font-bold tracking-widest mt-2 text-[color:var(--brand-yellow)]">
            ...
          </p>
        </header>
        <div className="p-4 space-y-6">
          <div className="bg-card brutal-border p-4 space-y-2 animate-in fade-in duration-300">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-card brutal-border p-4 animate-in fade-in duration-300"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-16" />
              </div>
            ))}
          </div>
          <div className="bg-card brutal-border brutal-shadow p-4 text-center space-y-2 animate-in fade-in duration-300">
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-12 w-24 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  async function handleSave() {
    const parsed = nameSchema.safeParse(name);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const { error } = await supabase
      .from("copaepica_profiles")
      .update({ display_name: parsed.data })
      .eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado");
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
    qc.invalidateQueries({ queryKey: ["ranking"] });
  }

  async function handleChangePassword() {
    if (!newPassword) {
      toast.error("Digite a nova senha");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Nova senha deve ter no mínimo 6 caracteres");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return toast.error(error.message);
    toast.success("Senha alterada com sucesso");
    setChangingPassword(false);
    setNewPassword("");
  }

  async function handleLogout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const total =
    (profile?.correct_guesses ?? 0) + (profile?.incorrect_guesses ?? 0);
  const accuracy =
    total > 0
      ? Math.round(((profile?.correct_guesses ?? 0) / total) * 100)
      : 0;

  const joinedAt = profile?.created_at
    ? (() => {
        const d = new Date(profile.created_at);
        const month = d.toLocaleDateString("pt-BR", { month: "long" });
        return `${month.charAt(0).toUpperCase() + month.slice(1)}/${d.getFullYear()}`;
      })()
    : "";

  const achievements = [
    { icon: "🏆", label: "Primeiro Acerto", unlocked: (profile?.correct_guesses ?? 0) > 0 },
    { icon: "🎯", label: "5 Acertos", unlocked: (profile?.correct_guesses ?? 0) >= 5 },
    { icon: "⭐", label: "Top 10", unlocked: (rank ?? Infinity) <= 10 },
    { icon: "💯", label: "100% Aproveitamento", unlocked: accuracy === 100 },
  ];

  return (
    <div className="pb-4" style={{ viewTransitionName: "page-perfil" } as any}>
      <header className="bg-[color:var(--brand-blue)] text-white brutal-border border-x-0 border-t-0 p-5">
        <h1 className="text-4xl font-display tracking-wider leading-none">
          MEU PERFIL
        </h1>
        <p className="text-[11px] uppercase font-bold tracking-widest mt-2 text-[color:var(--brand-yellow)]">
          Quem sou eu no bolão e qual é meu desempenho geral?
        </p>
      </header>

      <div className="p-4 space-y-6">
        {/* Informações do Usuário */}
        <div className="bg-card brutal-border p-4 space-y-2">
          <p className="font-display text-3xl">
            {profile?.display_name ?? "..."}
          </p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {joinedAt && (
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              Participante desde {joinedAt}
            </p>
          )}
        </div>

        {/* Estatísticas Principais — grid 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card brutal-border p-4">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              🏆 PONTOS
            </p>
            <p className="font-display text-4xl leading-tight mt-1">
              {profile?.points ?? 0}
            </p>
          </div>
          <div className="bg-card brutal-border p-4">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              🎯 ACERTOS
            </p>
            <p className="font-display text-4xl leading-tight mt-1">
              {profile?.correct_guesses ?? 0}
            </p>
          </div>
          <div className="bg-card brutal-border p-4">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              ❌ ERROS
            </p>
            <p className="font-display text-4xl leading-tight mt-1">
              {profile?.incorrect_guesses ?? 0}
            </p>
          </div>
          <div className="bg-card brutal-border p-4">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              🏅 POSIÇÃO
            </p>
            <p className="font-display text-4xl leading-tight mt-1">
              {rank ? `#${rank}` : "—"}
            </p>
          </div>
        </div>

        {/* Aproveitamento */}
          <div className="bg-card brutal-border brutal-shadow p-4 text-center space-y-2">
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            APROVEITAMENTO
          </p>
          <p className="font-display text-5xl">{accuracy}%</p>
          <div className="border-t border-border/50 pt-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground space-y-0.5">
            <p>{profile?.correct_guesses ?? 0} acertos</p>
            <p>{total} palpites</p>
          </div>
        </div>

        {/* Últimas Rodadas */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[3px] bg-border" />
            <h2 className="font-display text-2xl whitespace-nowrap">
              ÚLTIMAS RODADAS
            </h2>
            <div className="flex-1 h-[3px] bg-border" />
          </div>

          {roundHistory && roundHistory.length > 0 ? (
            <div className="space-y-2">
              {roundHistory.map((r) => (
                <div
                  key={r.round_number}
                  className="bg-card brutal-border p-3 flex items-center justify-between"
                >
                  <span className="font-bold text-xs uppercase tracking-widest">
                    Rodada {r.round_number}
                  </span>
                  <span className="font-display text-xl text-[color:var(--brand-green)]">
                    +{r.round_points}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card brutal-border p-4 text-center">
              <p className="font-display text-lg text-muted-foreground">
                Nenhuma rodada finalizada
              </p>
            </div>
          )}
        </div>

        {/* Conquistas */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[3px] bg-border" />
            <h2 className="font-display text-2xl whitespace-nowrap">
              CONQUISTAS
            </h2>
            <div className="flex-1 h-[3px] bg-border" />
          </div>

          <div className="bg-card brutal-border p-4">
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((a) => (
                <div
                  key={a.label}
                  className={`p-3 text-center brutal-border ${
                    a.unlocked
                      ? "bg-[color:var(--brand-yellow)]"
                      : "bg-muted opacity-40"
                  }`}
                >
                  <p className="text-2xl">{a.icon}</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest mt-1">
                    {a.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Configurações */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[3px] bg-border" />
            <h2 className="font-display text-2xl whitespace-nowrap">
              CONFIGURAÇÕES
            </h2>
            <div className="flex-1 h-[3px] bg-border" />
          </div>

          <div className="bg-card brutal-border p-4 space-y-3">
            {editing ? (
              <div className="space-y-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={profile?.display_name}
                  maxLength={40}
                  className="w-full brutal-border p-3 font-display text-2xl focus:outline-none focus:bg-[color:var(--brand-yellow)]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-[color:var(--brand-green)] text-white brutal-border py-3 font-display text-xl"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 bg-card text-foreground brutal-border py-3 font-display text-xl"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setName(profile?.display_name ?? "");
                  setEditing(true);
                }}
                className="w-full bg-card text-foreground brutal-border py-3 font-display text-xl tracking-wider"
              >
                ✏️ Editar Perfil
              </button>
            )}

            {changingPassword ? (
              <div className="space-y-3">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova senha"
                  className="w-full brutal-border p-3 font-sans text-sm focus:outline-none focus:bg-[color:var(--brand-yellow)]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleChangePassword}
                    className="flex-1 bg-[color:var(--brand-green)] text-white brutal-border py-3 font-display text-xl"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setChangingPassword(false)}
                    className="flex-1 bg-card text-foreground brutal-border py-3 font-display text-xl"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setChangingPassword(true)}
                className="w-full bg-card text-foreground brutal-border py-3 font-display text-xl tracking-wider"
              >
                🔑 Alterar Senha
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full bg-foreground text-background brutal-border brutal-shadow py-3 font-display text-xl tracking-wider"
            >
              Sair
            </button>

            <button
              onClick={toggleTheme}
              className="w-full bg-[color:var(--brand-blue)] text-white brutal-border py-3 font-display text-xl tracking-wider"
            >
              {theme === "dark" ? "☀️ Modo Claro" : "🌙 Modo Escuro"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

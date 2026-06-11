import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { UserStatsCard } from "@/components/UserStatsCard";
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
};

async function fetchProfile(id: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,display_name,points,correct_guesses,incorrect_guesses")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Profile;
}

async function fetchRank(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .order("points", { ascending: false })
    .order("correct_guesses", { ascending: false });
  if (error) throw error;
  const idx = (data ?? []).findIndex((p) => p.id === id);
  return idx === -1 ? null : idx + 1;
}

const nameSchema = z.string().trim().min(2, "Mínimo 2 caracteres").max(40, "Máximo 40");

function PerfilPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: () => fetchProfile(user.id),
  });
  const { data: rank } = useQuery({
    queryKey: ["my-rank", user.id],
    queryFn: () => fetchRank(user.id),
  });

  async function handleSave() {
    const parsed = nameSchema.safeParse(name);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: parsed.data })
      .eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado");
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
    qc.invalidateQueries({ queryKey: ["ranking"] });
  }

  async function handleLogout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const total = (profile?.correct_guesses ?? 0) + (profile?.incorrect_guesses ?? 0);
  const accuracy = total > 0 ? Math.round(((profile?.correct_guesses ?? 0) / total) * 100) : 0;

  return (
    <div>
      <PageHeader title="Perfil" subtitle={user.email ?? ""} />
      <div className="p-4 space-y-5">
        <div className="bg-white brutal-border brutal-shadow-yellow p-4 space-y-3">
          <p className="text-[10px] uppercase font-bold tracking-widest text-black/60">
            Jogador
          </p>
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
                  className="flex-1 bg-white text-black brutal-border py-3 font-display text-xl"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-3xl truncate">{profile?.display_name ?? "..."}</p>
              <button
                onClick={() => {
                  setName(profile?.display_name ?? "");
                  setEditing(true);
                }}
                className="brutal-border bg-[color:var(--brand-yellow)] px-3 py-2 text-xs font-bold uppercase tracking-widest"
              >
                Editar
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <UserStatsCard label="Pontos" value={profile?.points ?? 0} color="blue" />
          <UserStatsCard label="Posição" value={rank ? `#${rank}` : "—"} color="yellow" />
          <UserStatsCard label="Acertos" value={profile?.correct_guesses ?? 0} color="green" />
          <UserStatsCard label="Erros" value={profile?.incorrect_guesses ?? 0} color="white" />
          <UserStatsCard label="Aproveitamento" value={`${accuracy}%`} color="yellow" />
          <UserStatsCard label="Palpites" value={total} color="blue" />
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-black text-[color:var(--brand-yellow)] brutal-border brutal-shadow py-4 font-display text-xl tracking-wider"
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}

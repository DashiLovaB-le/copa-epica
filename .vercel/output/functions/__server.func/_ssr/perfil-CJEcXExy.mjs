import { i as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Ba_38dtR.mjs";
import { a as require_jsx_runtime, i as require_react, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { g as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as stringType } from "../_libs/zod.mjs";
import { t as Route } from "./perfil-Bo2khU1d.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/perfil-CJEcXExy.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var nameSchema = stringType().trim().min(2, "Mínimo 2 caracteres").max(40, "Máximo 40");
async function fetchProfile(id) {
	const { data, error } = await supabase.from("copaepica_profiles").select("id,display_name,points,correct_guesses,incorrect_guesses,created_at").eq("id", id).single();
	if (error) throw error;
	return data;
}
async function fetchRank(id) {
	const { data, error } = await supabase.from("copaepica_profiles").select("id").order("points", { ascending: false }).order("correct_guesses", { ascending: false });
	if (error) throw error;
	const idx = (data ?? []).findIndex((p) => p.id === id);
	return idx === -1 ? null : idx + 1;
}
async function fetchRoundHistory(userId) {
	const [mRes, pRes] = await Promise.all([supabase.from("copaepica_matches").select("id, round_number").not("result_a", "is", null).not("result_b", "is", null).order("round_number", { ascending: true }), supabase.from("copaepica_predictions").select("match_id, points_earned").eq("user_id", userId)]);
	if (mRes.error) throw mRes.error;
	if (pRes.error) throw pRes.error;
	const matchIdsWithPreds = new Set(pRes.data?.map((p) => p.match_id) ?? []);
	const ptsByMatch = new Map(pRes.data?.map((p) => [p.match_id, p.points_earned ?? 0]) ?? []);
	const acc = /* @__PURE__ */ new Map();
	for (const m of mRes.data ?? []) if (matchIdsWithPreds.has(m.id)) acc.set(m.round_number, (acc.get(m.round_number) ?? 0) + (ptsByMatch.get(m.id) ?? 0));
	return Array.from(acc.entries()).map(([rn, pts]) => ({
		round_number: rn,
		round_points: pts
	})).sort((a, b) => b.round_number - a.round_number).slice(0, 3).reverse();
}
function PerfilPage() {
	const { user } = Route.useRouteContext();
	const navigate = useNavigate();
	const qc = useQueryClient();
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [changingPassword, setChangingPassword] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)("");
	const [newPassword, setNewPassword] = (0, import_react.useState)("");
	const { data: profile } = useQuery({
		queryKey: ["profile", user.id],
		queryFn: () => fetchProfile(user.id)
	});
	const { data: rank } = useQuery({
		queryKey: ["my-rank", user.id],
		queryFn: () => fetchRank(user.id)
	});
	const { data: roundHistory } = useQuery({
		queryKey: ["round-history", user.id],
		queryFn: () => fetchRoundHistory(user.id)
	});
	async function handleSave() {
		const parsed = nameSchema.safeParse(name);
		if (!parsed.success) {
			toast.error(parsed.error.issues[0].message);
			return;
		}
		const { error } = await supabase.from("copaepica_profiles").update({ display_name: parsed.data }).eq("id", user.id);
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
		navigate({
			to: "/auth",
			replace: true
		});
	}
	const total = (profile?.correct_guesses ?? 0) + (profile?.incorrect_guesses ?? 0);
	const accuracy = total > 0 ? Math.round((profile?.correct_guesses ?? 0) / total * 100) : 0;
	const joinedAt = profile?.created_at ? (() => {
		const d = new Date(profile.created_at);
		const month = d.toLocaleDateString("pt-BR", { month: "long" });
		return `${month.charAt(0).toUpperCase() + month.slice(1)}/${d.getFullYear()}`;
	})() : "";
	const achievements = [
		{
			icon: "🏆",
			label: "Primeiro Acerto",
			unlocked: (profile?.correct_guesses ?? 0) > 0
		},
		{
			icon: "🎯",
			label: "5 Acertos",
			unlocked: (profile?.correct_guesses ?? 0) >= 5
		},
		{
			icon: "⭐",
			label: "Top 10",
			unlocked: (rank ?? Infinity) <= 10
		},
		{
			icon: "💯",
			label: "100% Aproveitamento",
			unlocked: accuracy === 100
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pb-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "bg-[color:var(--brand-blue)] text-white brutal-border border-x-0 border-t-0 p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-4xl font-display tracking-wider leading-none",
				children: "MEU PERFIL"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase font-bold tracking-widest mt-2 text-[color:var(--brand-yellow)]",
				children: "Quem sou eu no bolão e qual é meu desempenho geral?"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "p-4 space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white brutal-border p-4 space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-3xl",
							children: profile?.display_name ?? "..."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-black/60",
							children: user.email
						}),
						joinedAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[10px] uppercase font-bold tracking-widest text-black/40",
							children: ["Participante desde ", joinedAt]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white brutal-border p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] uppercase font-bold tracking-widest text-black/60",
								children: "🏆 PONTOS"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-4xl leading-tight mt-1",
								children: profile?.points ?? 0
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white brutal-border p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] uppercase font-bold tracking-widest text-black/60",
								children: "🎯 ACERTOS"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-4xl leading-tight mt-1",
								children: profile?.correct_guesses ?? 0
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white brutal-border p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] uppercase font-bold tracking-widest text-black/60",
								children: "❌ ERROS"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-4xl leading-tight mt-1",
								children: profile?.incorrect_guesses ?? 0
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white brutal-border p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] uppercase font-bold tracking-widest text-black/60",
								children: "🏅 POSIÇÃO"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-4xl leading-tight mt-1",
								children: rank ? `#${rank}` : "—"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white brutal-border brutal-shadow p-4 text-center space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] uppercase font-bold tracking-widest text-black/60",
							children: "APROVEITAMENTO"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-display text-5xl",
							children: [accuracy, "%"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-t border-black/10 pt-2 text-[10px] uppercase font-bold tracking-widest text-black/40 space-y-0.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [profile?.correct_guesses ?? 0, " acertos"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [total, " palpites"] })]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 h-[3px] bg-black" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-2xl whitespace-nowrap",
								children: "ÚLTIMAS RODADAS"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 h-[3px] bg-black" })
						]
					}), roundHistory && roundHistory.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-2",
						children: roundHistory.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white brutal-border p-3 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-bold text-xs uppercase tracking-widest",
								children: ["Rodada ", r.round_number]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-display text-xl text-[color:var(--brand-green)]",
								children: ["+", r.round_points]
							})]
						}, r.round_number))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "bg-white brutal-border p-4 text-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-lg text-black/40",
							children: "Nenhuma rodada finalizada"
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 h-[3px] bg-black" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-2xl whitespace-nowrap",
								children: "CONQUISTAS"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 h-[3px] bg-black" })
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "bg-white brutal-border p-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 gap-3",
							children: achievements.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `p-3 text-center brutal-border ${a.unlocked ? "bg-[color:var(--brand-yellow)]" : "bg-neutral-100 opacity-40"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-2xl",
									children: a.icon
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] uppercase font-bold tracking-widest mt-1",
									children: a.label
								})]
							}, a.label))
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 h-[3px] bg-black" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-2xl whitespace-nowrap",
								children: "CONFIGURAÇÕES"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 h-[3px] bg-black" })
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white brutal-border p-4 space-y-3",
						children: [
							editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: name,
									onChange: (e) => setName(e.target.value),
									placeholder: profile?.display_name,
									maxLength: 40,
									className: "w-full brutal-border p-3 font-display text-2xl focus:outline-none focus:bg-[color:var(--brand-yellow)]"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: handleSave,
										className: "flex-1 bg-[color:var(--brand-green)] text-white brutal-border py-3 font-display text-xl",
										children: "Salvar"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setEditing(false),
										className: "flex-1 bg-white text-black brutal-border py-3 font-display text-xl",
										children: "Cancelar"
									})]
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setName(profile?.display_name ?? "");
									setEditing(true);
								},
								className: "w-full bg-white text-black brutal-border py-3 font-display text-xl tracking-wider",
								children: "✏️ Editar Perfil"
							}),
							changingPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "password",
									value: newPassword,
									onChange: (e) => setNewPassword(e.target.value),
									placeholder: "Nova senha",
									className: "w-full brutal-border p-3 font-sans text-sm focus:outline-none focus:bg-[color:var(--brand-yellow)]"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: handleChangePassword,
										className: "flex-1 bg-[color:var(--brand-green)] text-white brutal-border py-3 font-display text-xl",
										children: "Salvar"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setChangingPassword(false),
										className: "flex-1 bg-white text-black brutal-border py-3 font-display text-xl",
										children: "Cancelar"
									})]
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setChangingPassword(true),
								className: "w-full bg-white text-black brutal-border py-3 font-display text-xl tracking-wider",
								children: "🔑 Alterar Senha"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: handleLogout,
								className: "w-full bg-black text-[color:var(--brand-yellow)] brutal-border brutal-shadow py-3 font-display text-xl tracking-wider",
								children: "Sair"
							})
						]
					})]
				})
			]
		})]
	});
}
//#endregion
export { PerfilPage as component };

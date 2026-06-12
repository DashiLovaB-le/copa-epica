import { i as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Ba_38dtR.mjs";
import { a as require_jsx_runtime, i as require_react, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-Dch6Py1o.mjs";
import { i as TSS_SERVER_FUNCTION, l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as Route } from "./rodadas-Mb5D3CG4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/rodadas-DndiJepX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PageHeader({ title, subtitle, right }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "bg-[color:var(--brand-blue)] text-white brutal-border border-x-0 border-t-0 p-5",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-end justify-between gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-4xl font-display tracking-wider leading-none",
				children: title
			}), subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase font-bold tracking-widest mt-2 text-[color:var(--brand-yellow)]",
				children: subtitle
			})] }), right]
		})
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var updateResults = createServerFn({ method: "POST" }).handler(createSsrRpc("05a8b51303866258b56a70c135424e08def2e247325bdf08d5507e1fb785a9e8"));
var COUNTRY_FLAGS = {
	Brasil: "🇧🇷",
	Argentina: "🇦🇷",
	França: "🇫🇷",
	Alemanha: "🇩🇪",
	Espanha: "🇪🇸",
	Itália: "🇮🇹",
	Portugal: "🇵🇹",
	Holanda: "🇳🇱",
	Inglaterra: "🇬🇧",
	Bélgica: "🇧🇪",
	Croácia: "🇭🇷",
	Sérvia: "🇷🇸",
	Suíça: "🇨🇭",
	Dinamarca: "🇩🇰",
	Polônia: "🇵🇱",
	México: "🇲🇽",
	"Estados Unidos": "🇺🇸",
	EUA: "🇺🇸",
	Canadá: "🇨🇦",
	Japão: "🇯🇵",
	"Coreia do Sul": "🇰🇷",
	Austrália: "🇦🇺",
	Uruguai: "🇺🇾",
	Colômbia: "🇨🇴",
	Equador: "🇪🇨",
	Peru: "🇵🇪",
	Chile: "🇨🇱",
	Suécia: "🇸🇪",
	Noruega: "🇳🇴",
	Ucrânia: "🇺🇦",
	Marrocos: "🇲🇦",
	Senegal: "🇸🇳",
	Nigéria: "🇳🇬",
	Camarões: "🇨🇲",
	Gana: "🇬🇭",
	Egito: "🇪🇬",
	Tunísia: "🇹🇳"
};
function getFlag(name) {
	return COUNTRY_FLAGS[name] ?? "";
}
async function fetchRounds(userId) {
	const [m, p] = await Promise.all([supabase.from("copaepica_matches").select("*").not("result_a", "is", null).not("result_b", "is", null).order("round_number", { ascending: true }).order("match_date", { ascending: true }), supabase.from("copaepica_predictions").select("match_id,predicted_a,predicted_b,points_earned,is_correct").eq("user_id", userId)]);
	if (m.error) throw m.error;
	if (p.error) throw p.error;
	return {
		matches: m.data ?? [],
		preds: p.data ?? []
	};
}
function RodadasPage() {
	const { user } = Route.useRouteContext();
	const qc = useQueryClient();
	const [selectedRound, setSelectedRound] = (0, import_react.useState)(null);
	const [updating, setUpdating] = (0, import_react.useState)(false);
	async function handleUpdate() {
		setUpdating(true);
		try {
			const result = await updateResults();
			const total = result.updated.length + result.failed.length;
			if (result.updated.length > 0) toast.success(`${result.updated.length}/${total} jogos atualizados`);
			else if (result.failed.length > 0) toast.info(`Nenhum resultado novo encontrado (${result.failed.length} pendentes)`);
			else toast.info("Nenhum jogo pendente para atualizar");
			qc.invalidateQueries({ queryKey: ["rodadas"] });
		} catch (err) {
			toast.error(err?.message ?? "Erro ao atualizar resultados");
		} finally {
			setUpdating(false);
		}
	}
	const { data, isLoading } = useQuery({
		queryKey: ["rodadas", user.id],
		queryFn: () => fetchRounds(user.id)
	});
	(0, import_react.useEffect)(() => {
		const ch = supabase.channel("rodadas-feed").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "copaepica_matches"
		}, () => qc.invalidateQueries({ queryKey: ["rodadas"] })).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "copaepica_predictions"
		}, () => qc.invalidateQueries({ queryKey: ["rodadas"] })).subscribe();
		return () => {
			supabase.removeChannel(ch);
		};
	}, [qc]);
	const grouped = (data?.matches ?? []).reduce((acc, m) => {
		(acc[m.round_number] ||= []).push(m);
		return acc;
	}, {});
	const roundNumbers = Object.keys(grouped).map(Number).sort((a, b) => a - b);
	const activeRound = selectedRound ?? (roundNumbers.length > 0 ? roundNumbers[roundNumbers.length - 1] : null);
	const currentMatches = activeRound != null ? grouped[activeRound] ?? [] : [];
	const roundPreds = currentMatches.map((m) => {
		return {
			match: m,
			pred: data?.preds.find((x) => x.match_id === m.id) ?? null
		};
	});
	const totalJogos = currentMatches.length;
	const acertos = roundPreds.filter((rp) => rp.pred?.is_correct === true).length;
	const erros = roundPreds.filter((rp) => rp.pred != null && rp.pred.is_correct === false).length;
	const pontosRodada = roundPreds.reduce((sum, rp) => sum + (rp.pred?.points_earned ?? 0), 0);
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center justify-center min-h-[60vh]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-3xl animate-pulse",
			children: "Carregando..."
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pb-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "RODADAS",
			subtitle: "Histórico de resultados",
			right: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: handleUpdate,
				disabled: updating,
				className: "flex-shrink-0 bg-[color:var(--brand-green)] text-white brutal-border brutal-shadow px-4 py-2 font-display text-lg tracking-wider active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow",
				children: updating ? "..." : "ATUALIZAR"
			})
		}), roundNumbers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "p-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white brutal-border p-6 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl",
					children: "Nenhuma rodada finalizada"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm mt-2 uppercase font-bold tracking-wider text-black/60",
					children: "Os resultados aparecerão aqui conforme os jogos terminarem"
				})]
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex overflow-x-auto brutal-border border-x-0 border-t-0",
			children: roundNumbers.map((rn) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => setSelectedRound(rn),
				className: `flex-shrink-0 px-5 py-3 font-bold text-xs uppercase tracking-widest transition-colors ${activeRound === rn ? "bg-[color:var(--brand-yellow)] text-black" : "bg-white text-black/60 hover:bg-neutral-100"}`,
				children: ["RODADA ", rn]
			}, rn))
		}), activeRound != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "p-4 space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 h-[3px] bg-black" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "font-display text-3xl whitespace-nowrap",
							children: ["RODADA ", activeRound]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 h-[3px] bg-black" })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white brutal-border p-4 space-y-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm font-bold uppercase tracking-wider",
							children: ["Jogos: ", totalJogos]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm font-bold uppercase tracking-wider",
							children: ["Seus acertos: ", acertos]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm font-bold uppercase tracking-wider",
							children: ["Pontos ganhos: ", pontosRodada]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3",
					children: roundPreds.map(({ match: m, pred: p }) => {
						const hasPrediction = p != null;
						const isCorrect = p?.is_correct === true;
						const points = p?.points_earned ?? 0;
						const flagA = getFlag(m.team_a);
						const flagB = getFlag(m.team_b);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: `brutal-border p-4 ${isCorrect ? "bg-[color:var(--brand-green)] text-white" : "bg-white text-black"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-display text-3xl",
										children: [
											flagA,
											" ",
											m.team_a,
											" ",
											m.result_a,
											" × ",
											m.result_b,
											" ",
											m.team_b,
											" ",
											flagB
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "border-t border-black/10 mt-3 pt-3 text-center",
									children: [hasPrediction && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] uppercase font-bold tracking-widest opacity-80",
										children: "SEU PALPITE"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: `font-display text-3xl mt-1 ${isCorrect ? "text-white" : ""}`,
										children: hasPrediction ? `${p.predicted_a} × ${p.predicted_b}` : "Sem palpite"
									})]
								}),
								hasPrediction && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex items-center justify-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-display text-lg tracking-wider",
										children: isCorrect ? "✓ ACERTOU" : "✗ ERROU"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: `px-2 py-1 brutal-border font-bold text-xs tracking-wider ${isCorrect ? "bg-[color:var(--brand-yellow)] text-black" : "bg-black text-white"}`,
										children: [isCorrect ? `+${points}` : "+0", " PONTOS"]
									})]
								})
							]
						}, m.id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 h-[3px] bg-black" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-3xl whitespace-nowrap",
							children: "RESUMO DA RODADA"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 h-[3px] bg-black" })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white brutal-border brutal-shadow p-4 space-y-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm font-bold uppercase tracking-wider",
							children: ["Acertos: ", acertos]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm font-bold uppercase tracking-wider",
							children: ["Erros: ", erros]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm font-bold uppercase tracking-wider",
							children: ["Pontos obtidos: ", pontosRodada]
						})
					]
				})
			]
		})] })]
	});
}
//#endregion
export { RodadasPage as component };

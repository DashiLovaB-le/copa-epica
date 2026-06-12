import { i as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Ba_38dtR.mjs";
import { a as require_jsx_runtime, i as require_react, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { t as Route } from "./ranking-Crqllnaz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ranking-CZd_-Q3m.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
async function fetchRanking() {
	const { data, error } = await supabase.from("copaepica_profiles").select("id,display_name,points,correct_guesses").order("points", { ascending: false }).order("correct_guesses", { ascending: false }).limit(100);
	if (error) throw error;
	return (data ?? []).map((p, i) => ({
		...p,
		rank: i + 1
	}));
}
async function fetchLatestRound() {
	const { data, error } = await supabase.from("copaepica_matches").select("round_number").not("result_a", "is", null).order("round_number", { ascending: false }).limit(1).maybeSingle();
	if (error) throw error;
	return data?.round_number ?? null;
}
function RankingPage() {
	const { user } = Route.useRouteContext();
	const qc = useQueryClient();
	const { data: ranking, isLoading } = useQuery({
		queryKey: ["ranking"],
		queryFn: fetchRanking
	});
	const { data: latestRound } = useQuery({
		queryKey: ["latest-round"],
		queryFn: fetchLatestRound
	});
	(0, import_react.useEffect)(() => {
		const ch = supabase.channel("ranking-feed").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "copaepica_profiles"
		}, () => qc.invalidateQueries({ queryKey: ["ranking"] })).subscribe();
		return () => {
			supabase.removeChannel(ch);
		};
	}, [qc]);
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "bg-[color:var(--brand-blue)] text-white brutal-border border-x-0 border-t-0 p-5",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-4xl font-display tracking-wider",
			children: "RANKING GERAL"
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-center font-bold uppercase mt-8",
			children: "Carregando..."
		})
	})] });
	const participants = ranking ?? [];
	const userEntry = participants.find((p) => p.id === user.id);
	const top3 = participants.slice(0, 3);
	const maxPoints = participants.length > 0 ? participants[0].points : 0;
	const gapToTop3 = userEntry && top3.length === 3 && userEntry.rank > 3 ? top3[2].points - userEntry.points : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "bg-[color:var(--brand-blue)] text-white brutal-border border-x-0 border-t-0 p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-4xl font-display tracking-wider leading-none",
			children: "RANKING GERAL"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-[11px] uppercase font-bold tracking-widest mt-2 text-[color:var(--brand-yellow)]",
			children: [
				participants.length,
				" participantes",
				latestRound ? `  ·  Atualizado após a Rodada ${latestRound}` : ""
			]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-0 border-t-[3px] border-black" }),
			userEntry && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white brutal-border brutal-shadow p-5 flex flex-col items-center gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase font-bold tracking-widest text-black/60",
						children: "SUA POSIÇÃO"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-display text-6xl leading-none text-[color:var(--brand-blue)]",
						children: ["#", userEntry.rank]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-display text-3xl leading-none",
						children: [
							userEntry.points,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-sans text-sm font-bold text-black/60 uppercase",
								children: "pontos"
							})
						]
					}),
					gapToTop3 !== null && gapToTop3 > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] uppercase font-bold tracking-widest text-black/60",
						children: [
							"Faltam ",
							gapToTop3,
							" pontos para o Top 3"
						]
					}),
					userEntry.rank <= 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase font-bold tracking-widest text-[color:var(--brand-green)]",
						children: "VOCÊ ESTÁ NO PÓDIO!"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-0 border-t-[3px] border-black" })] }),
			top3.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase font-bold tracking-widest mb-3 text-center",
				children: "PÓDIO"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-3 items-end",
				children: [
					top3[1] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PodiumCard, {
						position: 2,
						name: top3[1].display_name,
						points: top3[1].points,
						className: "bg-[color:var(--brand-yellow)] text-black"
					}),
					top3[0] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PodiumCard, {
						position: 1,
						name: top3[0].display_name,
						points: top3[0].points,
						className: "bg-[color:var(--brand-green)] text-white"
					}),
					top3[2] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PodiumCard, {
						position: 3,
						name: top3[2].display_name,
						points: top3[2].points,
						className: "bg-white text-black"
					})
				]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-0 border-t-[3px] border-black" })] }),
			participants.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase font-bold tracking-widest mb-3",
				children: "TABELA COMPLETA"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-white brutal-border overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b-[3px] border-black text-[10px] uppercase font-bold tracking-widest",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "p-3 w-14 text-center",
								children: "#"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "p-3",
								children: "Participante"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "p-3 text-center",
								children: "Acertos"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "p-3 text-right",
								children: "Pontos"
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: participants.map((r) => {
						const isMe = r.id === user.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: `border-b border-black/10 text-sm ${isMe ? "bg-[color:var(--brand-yellow)] ring-2 ring-black" : ""}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 text-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `inline-flex items-center justify-center w-8 h-8 font-display text-lg ${r.rank <= 3 ? "bg-[color:var(--brand-blue)] text-white" : "text-black"}`,
										children: r.rank
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 font-bold uppercase",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-2",
										children: [r.display_name, isMe && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "bg-black text-white text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 leading-none shrink-0",
											children: "VOCÊ"
										})]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 text-center font-bold text-black/60",
									children: r.correct_guesses
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 text-right font-display text-xl leading-none",
									children: r.points
								})
							]
						}, r.id);
					}) })]
				})
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-0 border-t-[3px] border-black" })] }),
			userEntry && participants.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase font-bold tracking-widest mb-3",
				children: "ESTATÍSTICAS"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white brutal-border p-4 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatRow, {
						label: "Maior pontuação",
						value: String(maxPoints)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatRow, {
						label: "Sua pontuação",
						value: String(userEntry.points)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatRow, {
						label: "Diferença para líder",
						value: String(maxPoints - userEntry.points)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatRow, {
						label: "Posição atual",
						value: `${userEntry.rank}º`
					})
				]
			})] }),
			participants.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-white brutal-border p-6 text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl",
					children: "Ninguém pontuou ainda"
				})
			})
		]
	})] });
}
function PodiumCard({ position, name, points, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `brutal-border p-3 text-center flex flex-col items-center ${className}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-2xl mb-1",
				children: {
					1: "🥇",
					2: "🥈",
					3: "🥉"
				}[position]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-bold uppercase text-xs truncate w-full",
				children: name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-display text-xl leading-none",
				children: [points, " PTS"]
			})
		]
	});
}
function StatRow({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-between items-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[10px] uppercase font-bold tracking-widest",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-display text-2xl leading-none",
			children: value
		})]
	});
}
//#endregion
export { RankingPage as component };

import { i as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Ba_38dtR.mjs";
import { a as require_jsx_runtime, i as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { g as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Toaster$1 } from "./sonner-DoFKumIW.mjs";
import { n as stringType, t as objectType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-0j7-OHkV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var bg_auth_default = "/assets/bg-auth-CbpJk93m.png";
var schema = objectType({
	email: stringType().trim().email("E-mail inválido").max(255),
	password: stringType().min(6, "Mínimo 6 caracteres").max(72),
	display_name: stringType().trim().min(2, "Mínimo 2 caracteres").max(40).optional()
});
function AuthPage() {
	const navigate = useNavigate();
	const [mode, setMode] = (0, import_react.useState)("login");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [displayName, setDisplayName] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data }) => {
			if (data.session) navigate({
				to: "/palpites",
				replace: true
			});
		});
	}, [navigate]);
	async function handleSubmit(e) {
		e.preventDefault();
		setLoading(true);
		try {
			const parsed = schema.safeParse({
				email,
				password,
				display_name: mode === "signup" ? displayName : void 0
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
						data: { display_name: parsed.data.display_name }
					}
				});
				if (error) throw error;
				toast.success("Conta criada! Bora palpitar.");
				navigate({
					to: "/palpites",
					replace: true
				});
			} else {
				const { error } = await supabase.auth.signInWithPassword({
					email: parsed.data.email,
					password: parsed.data.password
				});
				if (error) throw error;
				toast.success("Bem-vindo de volta!");
				navigate({
					to: "/palpites",
					replace: true
				});
			}
		} catch (err) {
			toast.error(err?.message ?? "Algo deu errado");
		} finally {
			setLoading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-cover bg-center bg-no-repeat",
		style: { backgroundImage: `url(${bg_auth_default})` },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, { position: "top-center" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "flex-1 flex items-center justify-center p-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-md bg-white brutal-border brutal-shadow-yellow p-6 space-y-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setMode("login"),
						className: `flex-1 py-3 brutal-border border-r-0 font-display text-2xl ${mode === "login" ? "bg-[color:var(--brand-blue)] text-white" : "bg-white text-black"}`,
						children: "Entrar"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setMode("signup"),
						className: `flex-1 py-3 brutal-border font-display text-2xl ${mode === "signup" ? "bg-[color:var(--brand-green)] text-white" : "bg-white text-black"}`,
						children: "Cadastrar"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleSubmit,
					className: "space-y-4",
					children: [
						mode === "signup" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-bold uppercase mb-1 tracking-wider",
							children: "Nome de exibição"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: displayName,
							onChange: (e) => setDisplayName(e.target.value),
							className: "w-full brutal-border p-3 font-bold focus:outline-none focus:bg-[color:var(--brand-yellow)]",
							placeholder: "Seu apelido",
							maxLength: 40
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-bold uppercase mb-1 tracking-wider",
							children: "E-mail"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "email",
							value: email,
							onChange: (e) => setEmail(e.target.value),
							className: "w-full brutal-border p-3 font-bold focus:outline-none focus:bg-[color:var(--brand-yellow)]",
							placeholder: "voce@email.com",
							maxLength: 255,
							autoComplete: "email"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-bold uppercase mb-1 tracking-wider",
							children: "Senha"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "password",
							value: password,
							onChange: (e) => setPassword(e.target.value),
							className: "w-full brutal-border p-3 font-bold focus:outline-none focus:bg-[color:var(--brand-yellow)]",
							placeholder: "••••••",
							autoComplete: mode === "signup" ? "new-password" : "current-password"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: loading,
							className: "w-full bg-[color:var(--brand-green)] text-white brutal-border brutal-shadow py-4 font-display text-2xl tracking-wider active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-transform disabled:opacity-60",
							children: loading ? "..." : mode === "login" ? "Entrar no jogo" : "Criar conta"
						})
					]
				})]
			})
		})]
	});
}
//#endregion
export { AuthPage as component };

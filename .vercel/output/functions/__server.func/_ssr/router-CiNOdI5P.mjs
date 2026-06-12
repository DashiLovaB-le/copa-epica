import { i as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Ba_38dtR.mjs";
import { a as require_jsx_runtime, i as require_react, n as QueryClientProvider } from "../_libs/react+tanstack__react-query.mjs";
import { A as redirect, _ as useRouter, c as HeadContent, d as Outlet, f as lazyRouteComponent, h as Link, m as createRootRouteWithContext, p as createFileRoute, s as Scripts, u as createRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Route$4 } from "./palpites-BKmXXfwB.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as Route$5 } from "./perfil-Bo2khU1d.mjs";
import { t as Route$6 } from "./ranking-Crqllnaz.mjs";
import { t as Route$7 } from "./rodadas-Mb5D3CG4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-CiNOdI5P.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-DDOWCztw.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$3 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, maximum-scale=1"
			},
			{ title: "Copa Épica — Palpites e Ranking" },
			{
				name: "description",
				content: "App brutalista de palpites esportivos. Marque presença no ranking da Copa Épica."
			},
			{
				name: "theme-color",
				content: "#002776"
			},
			{
				property: "og:title",
				content: "Copa Épica — Palpites e Ranking"
			},
			{
				property: "og:description",
				content: "App brutalista de palpites esportivos. Marque presença no ranking da Copa Épica."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary"
			},
			{
				name: "twitter:title",
				content: "Copa Épica — Palpites e Ranking"
			},
			{
				name: "twitter:description",
				content: "App brutalista de palpites esportivos. Marque presença no ranking da Copa Épica."
			},
			{
				property: "og:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cdf1761a-6488-4c88-a8c1-6dae2dc9787e/id-preview-172b41c2--30fe4bfb-1c1c-4517-b45c-eb3890fd1a0f.lovable.app-1781213842463.png"
			},
			{
				name: "twitter:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cdf1761a-6488-4c88-a8c1-6dae2dc9787e/id-preview-172b41c2--30fe4bfb-1c1c-4517-b45c-eb3890fd1a0f.lovable.app-1781213842463.png"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Oxanium:wght@400;500;600;700;800&family=Chakra+Petch:wght@400;500;600;700;800;900&family=Chakra+Petch+Mono:wght@400;500;700&display=swap"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "pt-BR",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$3.useRouteContext();
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		let mounted = true;
		import("./client-Ba_38dtR.mjs").then((n) => n.t).then((n) => n.t).then(({ supabase }) => {
			const { data: sub } = supabase.auth.onAuthStateChange((event) => {
				if (!mounted) return;
				if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
					router.invalidate();
					if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
				}
			});
			return () => sub.subscription.unsubscribe();
		});
		return () => {
			mounted = false;
		};
	}, [queryClient, router]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
	});
}
var $$splitComponentImporter$2 = () => import("./auth-0j7-OHkV.mjs");
var Route$2 = createFileRoute("/auth")({
	head: () => ({ meta: [{ title: "Entrar — Copa Épica" }] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./route-BAi8-Gc3.mjs");
var Route$1 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: async () => {
		const { data, error } = await supabase.auth.getUser();
		if (error || !data.user) throw redirect({ to: "/auth" });
		return { user: data.user };
	},
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("../_authenticated-ByxGrdty.mjs");
var Route = createFileRoute("/_authenticated/")({
	beforeLoad: () => {
		throw redirect({ to: "/palpites" });
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var AuthRoute = Route$2.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$3
});
var AuthenticatedRouteRoute = Route$1.update({
	id: "/_authenticated",
	getParentRoute: () => Route$3
});
var AuthenticatedIndexRoute = Route.update({
	id: "/",
	path: "/",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedRodadasRoute = Route$7.update({
	id: "/rodadas",
	path: "/rodadas",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedRankingRoute = Route$6.update({
	id: "/ranking",
	path: "/ranking",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedPerfilRoute = Route$5.update({
	id: "/perfil",
	path: "/perfil",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedRouteRouteChildren = {
	AuthenticatedPalpitesRoute: Route$4.update({
		id: "/palpites",
		path: "/palpites",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedPerfilRoute,
	AuthenticatedRankingRoute,
	AuthenticatedRodadasRoute,
	AuthenticatedIndexRoute
};
var rootRouteChildren = {
	AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren),
	AuthRoute
};
var routeTree = Route$3._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };

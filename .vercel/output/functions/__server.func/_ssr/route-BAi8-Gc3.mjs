import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { d as Outlet, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Toaster$1 } from "./sonner-DoFKumIW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-BAi8-Gc3.js
var import_jsx_runtime = require_jsx_runtime();
var items = [
	{
		to: "/palpites",
		label: "Palpites",
		icon: "/assets/palpites-8i4d8Khz.png"
	},
	{
		to: "/ranking",
		label: "Ranking",
		icon: "/assets/ranking-BIuZlKzQ.png"
	},
	{
		to: "/rodadas",
		label: "Rodadas",
		icon: "/assets/rodadas-BQ7OQ84X.png"
	},
	{
		to: "/perfil",
		label: "Perfil",
		icon: "/assets/perfil-Da1voNUY.png"
	}
];
function BottomNavigation() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "fixed bottom-0 inset-x-0 z-50 bg-white brutal-border border-x-0 border-b-0",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "grid grid-cols-4",
			children: items.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: it.to,
				className: "flex flex-col items-center justify-center gap-1 py-3 font-bold uppercase text-[10px] tracking-widest text-black data-[status=active]:bg-[color:var(--brand-blue)] data-[status=active]:text-white border-r-[3px] last:border-r-0 border-black",
				activeOptions: { exact: false },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: it.icon,
					alt: "",
					className: "w-6 h-6 object-contain"
				}), it.label]
			}) }, it.to))
		})
	});
}
function AuthedLayout() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, { position: "top-center" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNavigation, {})
		]
	});
}
//#endregion
export { AuthedLayout as component };

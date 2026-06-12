import { n as __exportAll$1 } from "../_runtime.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-Ba_38dtR.js
var client_Ba_38dtR_exports = /* @__PURE__ */ __exportAll$1({
	n: () => supabase,
	t: () => client_exports
});
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var client_exports = /* @__PURE__ */ __exportAll({ supabase: () => supabase });
function createSupabaseClient() {
	return createClient("https://yuyflyvtxwhmathuxtrr.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eWZseXZ0eHdobWF0aHV4dHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTk1MDMsImV4cCI6MjA4MTEzNTUwM30.v0e2_tNwm6-sHQOzWIzqwJ8-LKgehWF3xJ1nCVKqRek", { auth: {
		storage: typeof window !== "undefined" ? localStorage : void 0,
		persistSession: true,
		autoRefreshToken: true
	} });
}
var _supabase;
var supabase = new Proxy({}, { get(_, prop, receiver) {
	if (!_supabase) _supabase = createSupabaseClient();
	return Reflect.get(_supabase, prop, receiver);
} });
//#endregion
export { supabase as n, client_Ba_38dtR_exports as t };

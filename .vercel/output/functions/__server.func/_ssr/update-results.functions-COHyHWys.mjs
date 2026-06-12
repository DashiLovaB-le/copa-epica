import { i as TSS_SERVER_FUNCTION, l as createServerFn } from "./esm-Dova13aH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/update-results.functions-COHyHWys.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var updateResults_createServerFn_handler = createServerRpc({
	id: "05a8b51303866258b56a70c135424e08def2e247325bdf08d5507e1fb785a9e8",
	name: "updateResults",
	filename: "src/lib/api/update-results.functions.ts"
}, (opts) => updateResults.__executeServer(opts));
var updateResults = createServerFn({ method: "POST" }).handler(updateResults_createServerFn_handler, async () => {
	const { updateMatchResults } = await import("./update-results.server-CVIkYpEi.mjs");
	return updateMatchResults();
});
//#endregion
export { updateResults_createServerFn_handler };

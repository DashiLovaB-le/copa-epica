import { createServerFn } from "@tanstack/react-start";

export const updateResults = createServerFn({ method: "POST" })
  .handler(async () => {
    const { updateMatchResults } = await import("@/lib/update-results.server");
    return updateMatchResults();
  });

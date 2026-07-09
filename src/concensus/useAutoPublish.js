// Concensus — runs scheduled-question auto-publish once per browser session,
// on first app load by any user. Guarded by sessionStorage so it fires once.
import { useEffect } from "react";
import { concensusApi } from "./concensusApi";

const SESSION_KEY = "concensus_autopublish_ran";

export function useAutoPublish() {
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    concensusApi.runAutoPublish().catch(() => {
      // If it fails, clear the guard so it can retry next load.
      sessionStorage.removeItem(SESSION_KEY);
    });
  }, []);
}
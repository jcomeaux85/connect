// eQuo — runs scheduled-question auto-publish once per browser session.
import { useEffect } from "react";
import { equoApi } from "./equoApi";

const SESSION_KEY = "equo_autopublish_ran";

export function useAutoPublish() {
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    equoApi.runAutoPublish().catch(() => {
      sessionStorage.removeItem(SESSION_KEY);
    });
  }, []);
}
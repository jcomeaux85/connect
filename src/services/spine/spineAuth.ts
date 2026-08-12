// spineAuth.ts — the single caller-identity chokepoint for every Spine adapter.
//
// Every adapter imports `assertCaller` from here. Do NOT redefine this
// logic per adapter — consistency matters most on the money domain
// (Payroll), where a divergent or forgotten guard is a security defect,
// not a convenience.
//
// Phase 1 (now): trust the caller email from the in-app session.
// Phase 2 (AUTH_MILESTONE — see SpineInterface.ts): validate `ctx.token`
// (RS256 / JWKS) and derive email from its claims; reject caller-supplied
// emails that don't match. Only this file changes when the milestone fires.

import type { SpineContext } from "./SpineInterface";

export function assertCaller(ctx: SpineContext): string {
  if (!ctx?.email) throw new Error("Spine: missing caller identity (ctx.email)");
  // TODO(AUTH_MILESTONE): validate ctx.token (RS256 / JWKS) and derive email
  // from claims; reject any caller-supplied email that doesn't match.
  return ctx.email;
}
// corpsData — repository layer for CORPS// (HRIS) entities.
// Mirrors the Base44 entity SDK signatures exactly (list/filter/create/update/delete)
// so components are backend-blind. Switch backends with env:
//
//   VITE_CORPS_DATA_BACKEND = 'base44' (default) | 'remote'
//   VITE_CORPS_API_BASE     = e.g. https://yourserver.example/api  (remote mode)
//
// Remote REST contract (field names identical to Base44 entities):
//   GET    {base}/{entity}?sort=-field&limit=N          -> list
//   GET    {base}/{entity}?filter={json}&sort=&limit=   -> filter
//   POST   {base}/{entity}                              -> create
//   PATCH  {base}/{entity}/{id}                         -> update
//   DELETE {base}/{entity}/{id}                         -> delete

import { base44 } from "@/api/base44Client";

const BACKEND = import.meta.env.VITE_CORPS_DATA_BACKEND || "base44";
const API_BASE = import.meta.env.VITE_CORPS_API_BASE || "";

const CORPS_ENTITIES = [
  "CoreEmployee",
  "CoreShift",
  "CoreTimecardEntry",
  "CoreTimeOffRequest",
  "CorePaystub",
  "EmployeeBreak",
  "BreakGroup"
];

async function rest(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`corpsData(remote): ${method} ${path} -> ${res.status}`);
  return res.status === 204 ? null : res.json();
}

function remoteRepo(entity) {
  const seg = `/${entity}`;
  return {
    list: (sort, limit) => rest("GET", `${seg}?${new URLSearchParams({ ...(sort && { sort }), ...(limit && { limit }) })}`),
    filter: (query, sort, limit) => rest("GET", `${seg}?${new URLSearchParams({ filter: JSON.stringify(query || {}), ...(sort && { sort }), ...(limit && { limit }) })}`),
    create: (data) => rest("POST", seg, data),
    update: (id, data) => rest("PATCH", `${seg}/${id}`, data),
    delete: (id) => rest("DELETE", `${seg}/${id}`)
  };
}

function build() {
  const repos = {};
  for (const name of CORPS_ENTITIES) {
    repos[name] = BACKEND === "remote" ? remoteRepo(name) : base44.entities[name];
  }
  return repos;
}

export const corpsData = build();

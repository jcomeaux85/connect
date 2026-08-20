// eQuo — admin data hook. Loads all data in one query, filtered for real records.
import { useQuery } from "@tanstack/react-query";
import { equoApi } from "../equoApi";

export function useEquoAdmin(isAdmin) {
  return useQuery({
    queryKey: ["equo-admin"],
    enabled: !!isAdmin,
    refetchInterval: 30000,
    queryFn: () => equoApi.loadAdminData(),
  });
}
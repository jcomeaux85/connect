// eQuo — current user + admin flag (renamed from useConcensusUser).
import { useQuery } from "@tanstack/react-query";
import { equoApi } from "./equoApi";

export function useEquoUser() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["equo-user"],
    queryFn: () => equoApi.me(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return { user, isAdmin: user?.role === "admin", isLoading };
}
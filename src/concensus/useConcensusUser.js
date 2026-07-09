// Concensus — current user + admin flag, isolated from the app's own useUser.
import { useQuery } from "@tanstack/react-query";
import { concensusApi } from "./concensusApi";

export function useConcensusUser() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["concensus-user"],
    queryFn: () => concensusApi.me(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return { user, isAdmin: user?.role === "admin", isLoading };
}
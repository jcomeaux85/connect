// Concensus — bundled admin data fetch (questions, surveys, responses, alerts).
import { useQuery } from "@tanstack/react-query";
import { concensusApi } from "../concensusApi";

export function useConcensusAdmin(enabled = true) {
  return useQuery({
    queryKey: ["concensus-admin"],
    enabled,
    refetchInterval: 20000,
    queryFn: async () => {
      const [questions, surveys, responses, alerts] = await Promise.all([
        concensusApi.listQuestions(),
        concensusApi.listSurveys(),
        concensusApi.listResponses(),
        concensusApi.listAlerts(),
      ]);
      return { questions, surveys, responses, alerts };
    },
  });
}
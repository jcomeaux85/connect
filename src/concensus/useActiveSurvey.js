// Concensus — resolves the current user's pending survey (published, active,
// and not yet responded to). Returns { survey, questions } or null.
import { useQuery } from "@tanstack/react-query";
import { concensusApi } from "./concensusApi";

export function useActiveSurvey(user) {
  return useQuery({
    queryKey: ["concensus-active-survey", user?.email],
    enabled: !!user?.email,
    refetchInterval: 30000,
    queryFn: async () => {
      const [surveys, questions, myResponses] = await Promise.all([
        concensusApi.listSurveys(),
        concensusApi.listQuestions(),
        concensusApi.listMyResponses(user.email),
      ]);

      const answeredSurveyIds = new Set(myResponses.map((r) => r.survey_id));

      // Most recent active survey the user hasn't answered, that has questions.
      for (const survey of surveys.filter((s) => s.status === "active")) {
        if (answeredSurveyIds.has(survey.id)) continue;
        const surveyQuestions = questions
          .filter((q) => q.survey_id === survey.id && q.status === "published")
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        if (surveyQuestions.length > 0) {
          return { survey, questions: surveyQuestions };
        }
      }
      return null;
    },
  });
}
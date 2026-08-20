// eQuo — resolves the current user's pending survey (renamed from useActiveSurvey).
import { useQuery } from "@tanstack/react-query";
import { equoApi } from "./equoApi";

export function useActiveSurvey(user) {
  return useQuery({
    queryKey: ["equo-active-survey", user?.email],
    enabled: !!user?.email,
    refetchInterval: 30000,
    queryFn: async () => {
      const [surveys, questions, myResponses] = await Promise.all([
        equoApi.listSurveys(),
        equoApi.listQuestions(),
        equoApi.listMyResponses(user.email),
      ]);

      const realSurveys = surveys.filter((s) => !s.is_test);
      const realQuestions = questions.filter((q) => !q.is_test);
      const answeredSurveyIds = new Set(myResponses.map((r) => r.survey_id));

      for (const survey of realSurveys.filter((s) => s.status === "active")) {
        if (answeredSurveyIds.has(survey.id)) continue;
        const surveyQuestions = realQuestions
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
// eQuo — drop-in root (renamed from ConcensusProvider). Runs session auto-publish,
// watches for the user's pending survey, and on idle shows the white-wash prompt
// → survey flow. Also surfaces the weekly mood check.
import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useEquoUser } from "./useEquoUser";
import { useAutoPublish } from "./useAutoPublish";
import { useActiveSurvey } from "./useActiveSurvey";
import { useIdle } from "./useIdle";
import { useQuery } from "@tanstack/react-query";
import { equoApi } from "./equoApi";
import IdlePrompt from "./survey/IdlePrompt";
import SurveyModal from "./survey/SurveyModal";
import MoodCheck from "./survey/MoodCheck";

const IDLE_MS = 6000;

function getWeekOf(date = new Date()) {
  // Monday of the current week
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

export default function EquoProvider() {
  useAutoPublish();
  const { user } = useEquoUser();
  const { data: active } = useActiveSurvey(user);

  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [promptShown, setPromptShown] = useState(false);
  const [moodDone, setMoodDone] = useState(false);

  const hasPending = !!active && !dismissed;
  const isIdle = useIdle(IDLE_MS, hasPending && !open && !promptShown);

  // Check if the user has already submitted a mood this week
  const { data: myMood } = useQuery({
    queryKey: ["equo-my-mood", user?.email, getWeekOf()],
    enabled: !!user?.email,
    queryFn: async () => {
      return equoApi.findMoodForWeek(user.email, getWeekOf());
    },
  });

  const showMood = !!user && !myMood && !moodDone;

  useEffect(() => {
    setDismissed(false);
    setPromptShown(false);
  }, [active?.survey?.id]);

  useEffect(() => {
    if (isIdle && hasPending && !open && !promptShown) {
      setPromptShown(true);
    }
  }, [isIdle, hasPending, open, promptShown]);

  const showPrompt = hasPending && promptShown && !open;

  return (
    <>
      <AnimatePresence>
        {showPrompt && (
          <IdlePrompt
            key="prompt"
            onOpen={() => {
              setOpen(true);
              setPromptShown(false);
            }}
            onDismiss={() => {
              setDismissed(true);
              setPromptShown(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && active && (
          <SurveyModal
            key="survey"
            survey={active.survey}
            questions={active.questions}
            user={user}
            onClose={() => {
              setOpen(false);
              setDismissed(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMood && (
          <MoodCheck
            key="mood"
            user={user}
            weekOf={getWeekOf()}
            onDone={() => setMoodDone(true)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
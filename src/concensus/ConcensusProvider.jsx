// Concensus — drop-in root. Runs session auto-publish, watches for the user's
// pending survey, and on idle shows the white-wash prompt → survey flow.
// Mount this once, high in the app tree. Self-contained; no app dependencies.
import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useConcensusUser } from "./useConcensusUser";
import { useAutoPublish } from "./useAutoPublish";
import { useActiveSurvey } from "./useActiveSurvey";
import { useIdle } from "./useIdle";
import IdlePrompt from "./survey/IdlePrompt";
import SurveyModal from "./survey/SurveyModal";

const IDLE_MS = 6000;

export default function ConcensusProvider() {
  useAutoPublish();
  const { user } = useConcensusUser();
  const { data: active } = useActiveSurvey(user);

  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  // Latches true the instant idle fires. Once latched, the prompt stays up
  // regardless of further mouse movement toward the button — activity should
  // only decide WHEN the prompt first appears, never make it vanish out from
  // under an in-flight click.
  const [promptShown, setPromptShown] = useState(false);

  const hasPending = !!active && !dismissed;
  const isIdle = useIdle(IDLE_MS, hasPending && !open && !promptShown);

  // Reset dismissal + latch when a new pending survey appears.
  useEffect(() => {
    setDismissed(false);
    setPromptShown(false);
  }, [active?.survey?.id]);

  // Edge-trigger: the moment idle flips true, latch the prompt open. useIdle
  // is disabled once latched (see above), so this fires once per idle period
  // and is immune to ambient mousemove after that.
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
    </>
  );
}
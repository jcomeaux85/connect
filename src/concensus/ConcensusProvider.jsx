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

  const hasPending = !!active && !dismissed;
  const isIdle = useIdle(IDLE_MS, hasPending && !open);

  // Reset dismissal when a new pending survey appears.
  useEffect(() => {
    setDismissed(false);
  }, [active?.survey?.id]);

  const showPrompt = hasPending && isIdle && !open;

  return (
    <>
      <AnimatePresence>
        {showPrompt && (
          <IdlePrompt
            key="prompt"
            onOpen={() => setOpen(true)}
            onDismiss={() => setDismissed(true)}
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
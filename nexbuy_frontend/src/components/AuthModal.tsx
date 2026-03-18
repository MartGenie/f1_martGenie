"use client";

import { useEffect, useState } from "react";
import {
  buildMemoryPayloadFromAnswers,
  fetchMemoryProfile,
  fetchOnboardingQuestions,
  OnboardingQuestion,
  saveMemoryProfile,
} from "@/lib/memory-api";
import AuthForm from "@/src/components/AuthForm";
import MemoryQuestionStepper from "@/src/components/MemoryQuestionStepper";

type Props = {
  open: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
};

export default function AuthModal({ open, onClose, onAuthSuccess }: Props) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");

  useEffect(() => {
    if (!open) {
      setShowOnboarding(false);
      setQuestions([]);
      setAnswers({});
      setIsSavingOnboarding(false);
      setOnboardingError("");
    }
  }, [open]);

  async function handleAuthenticated() {
    const memory = await fetchMemoryProfile();

    if (memory.onboarding_required) {
      const onboardingQuestions = await fetchOnboardingQuestions();
      setQuestions(onboardingQuestions);
      setAnswers({});
      setOnboardingError("");
      setShowOnboarding(true);
      return;
    }

    await onAuthSuccess?.();
    onClose();
  }

  async function handleSubmitOnboarding() {
    setIsSavingOnboarding(true);
    setOnboardingError("");

    try {
      await saveMemoryProfile(buildMemoryPayloadFromAnswers(answers));
      await onAuthSuccess?.();
      onClose();
    } catch (error) {
      setOnboardingError(error instanceof Error ? error.message : "Failed to save onboarding.");
    } finally {
      setIsSavingOnboarding(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(15,23,42,0.46)] px-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
    >
      <div
        className={`w-full ${showOnboarding ? "max-w-[1080px]" : "max-w-[680px]"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex justify-end">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/55 bg-white/85 text-2xl text-[#2f2a26] shadow-[0_14px_32px_rgba(15,23,42,0.16)] transition hover:bg-white"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        {showOnboarding ? (
          <div className="bg-transparent">
            <div className="min-h-[640px] bg-transparent px-2 py-2 md:px-4">
              <section className="relative">
                <MemoryQuestionStepper
                  answers={answers}
                  description="These answers help us understand your home, style, and shopping habits so future recommendations feel much more relevant from the start."
                  error={onboardingError}
                  isSaving={isSavingOnboarding}
                  onChangeAnswers={(updater) => setAnswers((current) => updater(current))}
                  onSubmit={handleSubmitOnboarding}
                  questions={questions}
                  title="Let’s set up your shopping profile"
                />
              </section>
            </div>
          </div>
        ) : (
          <AuthForm onSuccess={handleAuthenticated} />
        )}
      </div>
    </div>
  );
}

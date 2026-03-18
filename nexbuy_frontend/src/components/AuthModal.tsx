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
          <div className="overflow-hidden rounded-[36px] border border-white/50 bg-[linear-gradient(135deg,rgba(255,255,255,0.92)_0%,rgba(242,246,251,0.92)_100%)] shadow-[0_36px_100px_rgba(15,23,42,0.2)] backdrop-blur-xl">
            <div className="grid min-h-[720px] lg:grid-cols-[0.95fr_1.25fr]">
              <aside className="relative overflow-hidden border-b border-[#d9e3ee] bg-[linear-gradient(180deg,#0f172a_0%,#131f36_48%,#172554_100%)] px-7 py-8 text-white lg:border-b-0 lg:border-r">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.22),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(96,165,250,0.18),transparent_18%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.08),transparent_30%)]" />
                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/70">
                    Welcome to MartGennie
                  </p>
                  <h3 className="mt-4 max-w-sm text-4xl font-black tracking-[-0.05em]">
                    Let&apos;s make your next recommendations feel personal.
                  </h3>
                  <p className="mt-4 max-w-sm text-base leading-7 text-slate-200/80">
                    Answer a few quick questions once. We will use them to shape your product picks, bundles, and future negotiations across the platform.
                  </p>

                  <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    <div className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Step</p>
                      <p className="mt-2 text-2xl font-black">{questions.length} questions</p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Time</p>
                      <p className="mt-2 text-2xl font-black">1 minute</p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-md">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Result</p>
                      <p className="mt-2 text-2xl font-black">Smarter picks</p>
                    </div>
                  </div>
                </div>
              </aside>

              <section className="relative bg-[linear-gradient(180deg,#fbfcfe_0%,#f3f6fa_100%)] px-6 py-6 md:px-8">
                <MemoryQuestionStepper
                  answers={answers}
                  description="We will save these answers as your long-term shopping memory so future recommendations feel more personal from the first message."
                  error={onboardingError}
                  isSaving={isSavingOnboarding}
                  onChangeAnswers={(updater) => setAnswers((current) => updater(current))}
                  onSubmit={handleSubmitOnboarding}
                  questions={questions}
                  title="Your shopping profile"
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

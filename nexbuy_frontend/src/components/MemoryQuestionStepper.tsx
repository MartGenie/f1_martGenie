"use client";

import { useMemo, useState } from "react";
import type { OnboardingAnswerMap, OnboardingQuestion } from "@/lib/memory-api";

type MemoryQuestionStepperProps = {
  title: string;
  description: string;
  questions: OnboardingQuestion[];
  answers: OnboardingAnswerMap;
  onChangeAnswers: (updater: (current: OnboardingAnswerMap) => OnboardingAnswerMap) => void;
  onSubmit: () => Promise<void>;
  isSaving: boolean;
  error: string;
};

function prettifyOption(option: string) {
  return option
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hasCurrentAnswer(question: OnboardingQuestion | undefined, answers: OnboardingAnswerMap) {
  if (!question) {
    return false;
  }

  const mainValue = answers[question.key];
  const customValue = question.custom_input_key ? answers[question.custom_input_key] : undefined;

  const hasMain =
    Array.isArray(mainValue) ? mainValue.length > 0 : typeof mainValue === "string" ? mainValue.trim().length > 0 : false;
  const hasCustom =
    typeof customValue === "string" ? customValue.trim().length > 0 : Array.isArray(customValue) ? customValue.length > 0 : false;

  return hasMain || hasCustom;
}

export default function MemoryQuestionStepper({
  title,
  description,
  questions,
  answers,
  onChangeAnswers,
  onSubmit,
  isSaving,
  error,
}: MemoryQuestionStepperProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentQuestion = questions[currentIndex];
  const progress = useMemo(
    () => (questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0),
    [currentIndex, questions.length],
  );

  function setMultiValue(questionKey: string, value: string, checked: boolean) {
    onChangeAnswers((current) => {
      const previous = current[questionKey];
      const values = Array.isArray(previous) ? [...previous] : [];
      const next = checked
        ? Array.from(new Set([...values, value]))
        : values.filter((item) => item !== value);
      return { ...current, [questionKey]: next };
    });
  }

  async function handlePrimaryAction() {
    if (currentIndex < questions.length - 1) {
      if (!hasCurrentAnswer(currentQuestion, answers)) {
        return;
      }
      setCurrentIndex((current) => Math.min(current + 1, questions.length - 1));
      return;
    }

    await onSubmit();
  }

  if (!currentQuestion) {
    return null;
  }

  const canProceed = hasCurrentAnswer(currentQuestion, answers);

  return (
    <div className="rounded-[30px] border border-[#dde5ef] bg-[linear-gradient(180deg,#ffffff_0%,#f7fafd_100%)] p-6 shadow-[0_20px_60px_rgba(148,163,184,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c8da5]">
            Long-term memory
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#101828]">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#667085]">{description}</p>
        </div>
        <div className="rounded-full border border-[#dce5ef] bg-white px-3 py-1 text-xs font-semibold text-[#486480]">
          {currentIndex + 1} / {questions.length}
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e7edf4]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#60a5fa_0%,#2563eb_100%)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <section className="mt-6 rounded-[28px] border border-[#e5ebf2] bg-white/90 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8b97a5]">
          Question {currentIndex + 1}
        </p>
        <h4 className="mt-3 text-xl font-bold leading-8 text-[#101828]">{currentQuestion.question}</h4>
        {currentQuestion.helper_text ? (
          <p className="mt-3 text-sm leading-7 text-[#667085]">{currentQuestion.helper_text}</p>
        ) : null}

        <div className="mt-5">
          {currentQuestion.type === "choice" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {currentQuestion.options.map((option) => {
                const checked = currentQuestion.multi_select
                  ? Array.isArray(answers[currentQuestion.key]) && answers[currentQuestion.key].includes(option)
                  : answers[currentQuestion.key] === option;

                return (
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-[20px] border px-4 py-3 text-sm font-medium transition ${
                      checked
                        ? "border-[#93c5fd] bg-[linear-gradient(180deg,#eff6ff_0%,#dbeafe_100%)] text-[#1d4ed8] shadow-[0_12px_28px_rgba(59,130,246,0.12)]"
                        : "border-[#dbe3ed] bg-[#f8fafc] text-[#475467] hover:border-[#c7d2e2] hover:bg-white"
                    }`}
                    key={option}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                        checked
                          ? "border-[#60a5fa] bg-[#2563eb] text-white"
                          : "border-[#c5d0dd] bg-white text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <input
                      checked={checked}
                      className="sr-only"
                      name={currentQuestion.key}
                      onChange={(event) =>
                        currentQuestion.multi_select
                          ? setMultiValue(currentQuestion.key, option, event.target.checked)
                          : onChangeAnswers((current) => ({ ...current, [currentQuestion.key]: option }))
                      }
                      type={currentQuestion.multi_select ? "checkbox" : "radio"}
                    />
                    <span>{prettifyOption(option)}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <textarea
              className="min-h-[140px] w-full rounded-[22px] border border-[#d7dee8] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#93c5fd] focus:shadow-[0_0_0_4px_rgba(147,197,253,0.18)]"
              onChange={(event) =>
                onChangeAnswers((current) => ({ ...current, [currentQuestion.key]: event.target.value }))
              }
              placeholder={currentQuestion.placeholder ?? "Type your answer here..."}
              value={typeof answers[currentQuestion.key] === "string" ? answers[currentQuestion.key] : ""}
            />
          )}
        </div>

        {currentQuestion.allow_custom_input && currentQuestion.custom_input_key ? (
          <div className="mt-5">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8b97a5]">
                {currentQuestion.custom_input_label ?? "Other details"}
              </span>
              <textarea
                className="min-h-[96px] w-full rounded-[20px] border border-[#d7dee8] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#93c5fd] focus:shadow-[0_0_0_4px_rgba(147,197,253,0.18)]"
                onChange={(event) =>
                  onChangeAnswers((current) => ({
                    ...current,
                    [currentQuestion.custom_input_key as string]: event.target.value,
                  }))
                }
                placeholder={currentQuestion.custom_input_placeholder ?? "Add anything else we should know..."}
                value={
                  typeof answers[currentQuestion.custom_input_key] === "string"
                    ? answers[currentQuestion.custom_input_key]
                    : ""
                }
              />
            </label>
          </div>
        ) : null}
      </section>

      {error ? <p className="mt-4 text-sm font-medium text-[#b42318]">{error}</p> : null}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          className="inline-flex h-11 items-center justify-center rounded-[16px] border border-[#d8dee8] bg-white px-4 text-sm font-semibold text-[#475467] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((current) => Math.max(current - 1, 0))}
          type="button"
        >
          Back
        </button>
        <button
          className="inline-flex h-11 items-center justify-center rounded-[16px] bg-[linear-gradient(180deg,#111827_0%,#1f2937_100%)] px-5 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(15,23,42,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving || !canProceed}
          onClick={() => void handlePrimaryAction()}
          type="button"
        >
          {currentIndex === questions.length - 1 ? (isSaving ? "Saving..." : "Save and continue") : "Continue"}
        </button>
      </div>
    </div>
  );
}

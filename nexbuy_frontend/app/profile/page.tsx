"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAccessToken, fetchCurrentUser, readAccessToken, type AuthUser } from "@/lib/auth";
import {
  fetchMemoryProfile,
  fetchOnboardingQuestions,
  saveMemoryProfile,
  type MemoryProfilePayload,
  type OnboardingQuestion,
} from "@/lib/memory-api";
import AuthModal from "@/src/components/AuthModal";
import Navbar from "@/src/components/Navbar";

function prettifyAnswer(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildAnswersFromProfile(profile: MemoryProfilePayload | null) {
  if (!profile) {
    return {} as Record<string, string | string[]>;
  }

  return {
    ...(profile.raw_answers ?? {}),
    housing_type: profile.housing_type ?? "",
    household_members: profile.household_members ?? [],
    style_preferences: profile.style_preferences ?? [],
    price_philosophy: profile.price_philosophy ?? "",
    negative_constraints: (profile.negative_constraints ?? []).join("\n"),
  } as Record<string, string | string[]>;
}

function hasAnyAnswer(answers: Record<string, string | string[]>) {
  return Object.values(answers).some((value) =>
    Array.isArray(value) ? value.length > 0 : typeof value === "string" ? value.trim().length > 0 : false,
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string | string[]>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setIsLoading(true);
      setError("");

      const token = readAccessToken();
      if (!token) {
        if (!cancelled) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const [currentUser, memory, onboardingQuestions] = await Promise.all([
          fetchCurrentUser(token),
          fetchMemoryProfile(),
          fetchOnboardingQuestions(),
        ]);

        if (cancelled) {
          return;
        }

        setUser(currentUser);
        setIsAuthenticated(true);
        setQuestions(onboardingQuestions);
        const initialAnswers = buildAnswersFromProfile(memory.profile);
        setAnswers(initialAnswers);
        setSavedAnswers(initialAnswers);
        setIsEditing(false);
      } catch (bootstrapError) {
        if (cancelled) {
          return;
        }

        clearAccessToken();
        setIsAuthenticated(false);
        setUser(null);
        setError(
          bootstrapError instanceof Error
            ? bootstrapError.message
            : "Could not load your profile details.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  function setMultiValue(questionKey: string, value: string, checked: boolean) {
    setAnswers((current) => {
      const previous = current[questionKey];
      const values = Array.isArray(previous) ? [...previous] : [];
      const next = checked
        ? Array.from(new Set([...values, value]))
        : values.filter((item) => item !== value);
      return { ...current, [questionKey]: next };
    });
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");
    setSaveMessage("");

    try {
      const negativeInput = answers.negative_constraints;
      const negativeConstraints = Array.isArray(negativeInput)
        ? negativeInput
        : typeof negativeInput === "string"
          ? negativeInput
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean)
          : [];

      await saveMemoryProfile({
        housing_type: typeof answers.housing_type === "string" ? answers.housing_type : null,
        space_tier: null,
        household_members: Array.isArray(answers.household_members) ? answers.household_members : [],
        style_preferences: Array.isArray(answers.style_preferences) ? answers.style_preferences : [],
        price_philosophy:
          typeof answers.price_philosophy === "string" ? answers.price_philosophy : null,
        negative_constraints: negativeConstraints,
        raw_answers: answers,
      });

      setSavedAnswers(answers);
      setIsEditing(false);
      setSaveMessage("Your memory preferences have been updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your changes.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f9fc_0%,#eef2f7_100%)] text-[#101828]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.22),transparent_24%),radial-gradient(circle_at_85%_10%,rgba(148,163,184,0.18),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.55),transparent_40%)]" />
      <div className="relative">
        <Navbar
          isAuthenticated={isAuthenticated}
          isBlurred={authOpen}
          onOpenAuth={() => setAuthOpen(true)}
          onSignOut={() => {
            clearAccessToken();
            setIsAuthenticated(false);
            router.push("/");
          }}
        />

        <section className="mx-auto max-w-[1460px] px-6 pb-16 pt-28">
          <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="rounded-[32px] border border-[#dde4ed] bg-[linear-gradient(180deg,#ffffff_0%,#f4f7fb_100%)] p-5 shadow-[0_20px_60px_rgba(148,163,184,0.12)]">
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#8b97a8]">
                User details
              </p>
              <div className="mt-4 space-y-2">
                <button
                  className="flex w-full items-center justify-between rounded-[24px] border border-[#dbe3ed] bg-[linear-gradient(180deg,#eff6ff_0%,#dbeafe_100%)] px-4 py-4 text-left shadow-[0_12px_28px_rgba(59,130,246,0.08)]"
                  type="button"
                >
                  <span>
                    <span className="block text-sm font-semibold text-[#1d4ed8]">Long-term memory</span>
                    <span className="mt-1 block text-sm text-[#4b5563]">Review and update your saved preferences</span>
                  </span>
                  <span className="rounded-full bg-white/80 px-2 py-1 text-xs font-semibold text-[#1d4ed8]">
                    Active
                  </span>
                </button>
              </div>
            </aside>

            <section className="rounded-[32px] border border-[#dde4ed] bg-white/90 shadow-[0_24px_80px_rgba(148,163,184,0.12)] backdrop-blur-xl">
              <div className="border-b border-[#e4e9f0] px-6 py-6 md:px-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b97a8]">
                  Long-term memory
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#101828]">
                  Your saved shopping preferences
                </h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-[#667085]">
                  Review what Nexbuy already knows about your style, household, and shopping habits. Edit them anytime when your preferences change.
                </p>
              </div>

              <div className="px-6 py-6 md:px-8">
                {isLoading ? (
                  <div className="space-y-4">
                    {[0, 1, 2].map((item) => (
                      <div
                        className="h-32 animate-pulse rounded-[28px] border border-[#e5eaf1] bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]"
                        key={item}
                      />
                    ))}
                  </div>
                ) : !isAuthenticated ? null : (
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4 rounded-[28px] border border-[#e5eaf1] bg-[#f8fafc] px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-[#101828]">{user?.email}</p>
                        <p className="mt-1 text-sm text-[#667085]">
                          {hasAnyAnswer(savedAnswers)
                            ? "These are the answers currently saved to your profile."
                            : "You have not saved any long-term memory answers yet."}
                        </p>
                      </div>
                      {!isEditing ? (
                        <button
                          className="h-[44px] shrink-0 rounded-2xl border border-[#cfd7e3] bg-white px-4 text-sm font-semibold text-[#0f172a] transition hover:border-[#bfc9d8] hover:bg-[#f9fbfd]"
                          onClick={() => {
                            setAnswers(savedAnswers);
                            setIsEditing(true);
                            setError("");
                            setSaveMessage("");
                          }}
                          type="button"
                        >
                          Edit
                        </button>
                      ) : null}
                    </div>

                    {!isEditing ? (
                      hasAnyAnswer(savedAnswers) ? (
                        questions.map((question, index) => {
                          const value = savedAnswers[question.key];
                          const displayValues = Array.isArray(value)
                            ? value.map(prettifyAnswer)
                            : typeof value === "string" && value.trim()
                              ? value
                                  .split("\n")
                                  .map((item) => item.trim())
                                  .filter(Boolean)
                              : [];

                          return (
                            <section
                              className="rounded-[28px] border border-[#dde5ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-[0_16px_40px_rgba(148,163,184,0.08)]"
                              key={question.key}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#dbeafe_0%,#bfdbfe_100%)] text-sm font-bold text-[#1d4ed8]">
                                  {index + 1}
                                </div>
                                <div className="w-full">
                                  <p className="text-base font-semibold text-[#101828]">{question.question}</p>
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {displayValues.length > 0 ? (
                                      displayValues.map((item) => (
                                        <span
                                          className="rounded-full bg-[#eef2ff] px-3 py-1.5 text-sm font-medium text-[#4338ca]"
                                          key={`${question.key}-${item}`}
                                        >
                                          {item}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-sm text-[#98a2b3]">No answer saved yet.</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </section>
                          );
                        })
                      ) : (
                        <div className="rounded-[28px] border border-dashed border-[#d4dce7] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 py-12 text-center">
                          <p className="text-lg font-semibold text-[#101828]">No saved answers yet</p>
                          <p className="mt-2 text-sm leading-7 text-[#667085]">
                            Click edit to set your long-term shopping preferences for the first time.
                          </p>
                        </div>
                      )
                    ) : (
                      <>
                        {questions.map((question, index) => (
                          <section
                            className="rounded-[28px] border border-[#dde5ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-[0_16px_40px_rgba(148,163,184,0.08)]"
                            key={question.key}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#dbeafe_0%,#bfdbfe_100%)] text-sm font-bold text-[#1d4ed8]">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-base font-semibold text-[#101828]">{question.question}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8b97a8]">
                                  {question.multi_select ? "Select all that apply" : "Select one option"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4">
                              {question.type === "choice" ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                  {question.options.map((option) => {
                                    const checked = question.multi_select
                                      ? Array.isArray(answers[question.key]) &&
                                        answers[question.key].includes(option)
                                      : answers[question.key] === option;

                                    return (
                                      <label
                                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
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
                                          name={question.key}
                                          onChange={(event) =>
                                            question.multi_select
                                              ? setMultiValue(question.key, option, event.target.checked)
                                              : setAnswers((current) => ({ ...current, [question.key]: option }))
                                          }
                                          type={question.multi_select ? "checkbox" : "radio"}
                                        />
                                        <span>{prettifyAnswer(option)}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              ) : (
                                <textarea
                                  className="min-h-[128px] w-full rounded-[24px] border border-[#d7dee8] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#93c5fd] focus:shadow-[0_0_0_4px_rgba(147,197,253,0.18)]"
                                  onChange={(event) =>
                                    setAnswers((current) => ({ ...current, [question.key]: event.target.value }))
                                  }
                                  placeholder="Add one preference or constraint per line..."
                                  value={typeof answers[question.key] === "string" ? answers[question.key] : ""}
                                />
                              )}
                            </div>
                          </section>
                        ))}

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            className="h-[44px] rounded-2xl border border-[#d8dee8] bg-white px-4 text-sm font-semibold text-[#475467] transition hover:bg-[#f8fafc]"
                            onClick={() => {
                              setAnswers(savedAnswers);
                              setIsEditing(false);
                              setError("");
                              setSaveMessage("");
                            }}
                            type="button"
                          >
                            Cancel
                          </button>
                          <button
                            className="h-[44px] rounded-2xl bg-[linear-gradient(180deg,#111827_0%,#1f2937_100%)] px-4 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(15,23,42,0.22)] transition hover:brightness-105 disabled:opacity-60"
                            disabled={isSaving}
                            onClick={handleSave}
                            type="button"
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </>
                    )}

                    {error ? (
                      <div className="rounded-[20px] border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm font-medium text-[#b42318]">
                        {error}
                      </div>
                    ) : null}

                    {saveMessage ? (
                      <div className="rounded-[20px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm font-medium text-[#15803d]">
                        {saveMessage}
                      </div>
                    ) : null}
                  </div>
                )}

                {!isLoading && !isAuthenticated ? (
                  <div className="rounded-[28px] border border-[#dde5ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_16px_40px_rgba(148,163,184,0.08)]">
                    <p className="text-lg font-semibold text-[#101828]">Sign in to view your profile</p>
                    <p className="mt-2 text-sm leading-7 text-[#667085]">
                      This page stores personal shopping preferences, so it is only available after authentication.
                    </p>
                    <div className="mt-4">
                      <button
                        className="inline-flex h-[48px] items-center rounded-2xl bg-[linear-gradient(180deg,#111827_0%,#1f2937_100%)] px-5 text-sm font-semibold text-white"
                        onClick={() => setAuthOpen(true)}
                        type="button"
                      >
                        Sign in
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </section>
      </div>

      <AuthModal
        onAuthSuccess={async () => {
          const token = readAccessToken();
          if (!token) {
            return;
          }

          const [currentUser, memory, onboardingQuestions] = await Promise.all([
            fetchCurrentUser(token),
            fetchMemoryProfile(),
            fetchOnboardingQuestions(),
          ]);

          setUser(currentUser);
          setIsAuthenticated(true);
          setQuestions(onboardingQuestions);
          const initialAnswers = buildAnswersFromProfile(memory.profile);
          setAnswers(initialAnswers);
          setSavedAnswers(initialAnswers);
          setIsEditing(false);
          setError("");
          setSaveMessage("");
        }}
        onClose={() => setAuthOpen(false)}
        open={authOpen}
      />
    </main>
  );
}

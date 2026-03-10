import { getApiBaseUrl, readAccessToken } from "@/lib/auth";

export type OnboardingQuestion = {
  key: string;
  question: string;
  type: string;
  options: string[];
  multi_select: boolean;
};

export type MemoryProfilePayload = {
  housing_type?: string | null;
  space_tier?: string | null;
  household_members?: string[];
  style_preferences?: string[];
  price_philosophy?: string | null;
  negative_constraints?: string[];
  room_priorities?: string[];
  function_preferences?: string[];
  notes?: string | null;
  raw_answers?: Record<string, unknown>;
};

export type MemoryProfileResponse = {
  onboarding_required: boolean;
  profile: MemoryProfilePayload | null;
};

function authHeaders() {
  const token = readAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? ((await response.json()) as unknown) : null;
  if (!response.ok) {
    if (payload && typeof payload === "object" && "detail" in payload && typeof payload.detail === "string") {
      throw new Error(payload.detail);
    }
    throw new Error(fallbackMessage);
  }
  if (!payload) {
    throw new Error(fallbackMessage);
  }
  return payload as T;
}

export async function fetchMemoryProfile(): Promise<MemoryProfileResponse> {
  const response = await fetch(`${getApiBaseUrl()}/memory/profile`, {
    headers: authHeaders(),
  });
  return parseJsonResponse<MemoryProfileResponse>(response, "Could not load memory profile.");
}

export async function fetchOnboardingQuestions(): Promise<OnboardingQuestion[]> {
  const response = await fetch(`${getApiBaseUrl()}/memory/onboarding/questions`, {
    headers: authHeaders(),
  });
  return parseJsonResponse<OnboardingQuestion[]>(
    response,
    "Could not load onboarding questions.",
  );
}

export async function saveMemoryProfile(payload: MemoryProfilePayload): Promise<MemoryProfileResponse> {
  const response = await fetch(`${getApiBaseUrl()}/memory/profile`, {
    method: "PUT",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse<MemoryProfileResponse>(response, "Could not save memory profile.");
}

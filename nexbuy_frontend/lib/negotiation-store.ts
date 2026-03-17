"use client";

import type { BuyerAgentRunResult, BuyerAgentTurn, NegotiationSession } from "@/lib/negotiation-api";

const DEAL_STORAGE_KEY = "nexbuy.negotiation.results";
const RUN_STORAGE_KEY = "nexbuy.negotiation.runs";

export type NegotiationScope = {
  userId?: string | null;
  sessionId?: string | null;
  planId?: string | null;
};

type ScopedRecord = {
  userId: string;
  sessionId: string;
  planId: string;
  sku: string;
};

export type NegotiatedDeal = ScopedRecord & {
  originalPrice: number;
  negotiatedPrice: number;
  title: string;
  planTitle?: string;
  acceptedAt: string;
};

export type StoredNegotiationRun = ScopedRecord & {
  title: string;
  originalPrice: number;
  planTitle?: string;
  targetPrice: number;
  maxAcceptablePrice: number;
  status: "running" | "done";
  progressLabel: string;
  progressPercent: number;
  turns: BuyerAgentTurn[];
  sellerSession: NegotiationSession | null;
  result?: BuyerAgentRunResult | null;
  savedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function normalizeScope(scope?: NegotiationScope): Omit<ScopedRecord, "sku"> {
  return {
    userId: scope?.userId?.trim() || "anonymous",
    sessionId: scope?.sessionId?.trim() || "global",
    planId: scope?.planId?.trim() || "global",
  };
}

function buildScopedKey(scope: NegotiationScope | undefined, sku: string) {
  const normalized = normalizeScope(scope);
  return `${normalized.userId}::${normalized.sessionId}::${normalized.planId}::${sku}`;
}

function matchesScope<T extends ScopedRecord>(value: T, scope?: NegotiationScope) {
  const normalized = normalizeScope(scope);
  return (
    value.userId === normalized.userId &&
    value.sessionId === normalized.sessionId &&
    value.planId === normalized.planId
  );
}

function readStorageMap<T>(key: string): Record<string, T> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, T] => isRecord(entry[1])),
    );
  } catch {
    return {};
  }
}

function writeStorageEntry<T extends ScopedRecord>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  const current = readStorageMap<T>(key);
  current[buildScopedKey(value, value.sku)] = value;
  window.localStorage.setItem(key, JSON.stringify(current));
}

export function readNegotiatedDeals(scope?: NegotiationScope): Record<string, NegotiatedDeal> {
  return Object.fromEntries(
    Object.values(readStorageMap<NegotiatedDeal>(DEAL_STORAGE_KEY))
      .filter((value) => matchesScope(value, scope))
      .map((value) => [value.sku, value]),
  );
}

export function writeNegotiatedDeal(deal: NegotiatedDeal) {
  writeStorageEntry(DEAL_STORAGE_KEY, deal);
}

export function readNegotiationRuns(scope?: NegotiationScope): Record<string, StoredNegotiationRun> {
  return Object.fromEntries(
    Object.values(readStorageMap<StoredNegotiationRun>(RUN_STORAGE_KEY))
      .filter((value) => matchesScope(value, scope))
      .map((value) => [value.sku, value]),
  );
}

export function writeNegotiationRun(run: StoredNegotiationRun) {
  writeStorageEntry(RUN_STORAGE_KEY, run);
}

export function getLatestNegotiationRun(scope?: NegotiationScope): StoredNegotiationRun | null {
  const runs = Object.values(readNegotiationRuns(scope));
  if (runs.length === 0) {
    return null;
  }

  return runs.sort((left, right) => {
    const leftTime = Date.parse(left.savedAt) || 0;
    const rightTime = Date.parse(right.savedAt) || 0;
    return rightTime - leftTime;
  })[0] ?? null;
}

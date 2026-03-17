"use client";

import { useEffect } from "react";
import {
  clearAccessToken,
  clearOAuthReturnTo,
  fetchCurrentUser,
  readOAuthReturnTo,
  saveAccessToken,
  saveAuthUserEmail,
  saveAuthUserId,
} from "@/lib/auth";

function readHashParams() {
  const rawHash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(rawHash);
}

function buildReturnUrl(authError?: string) {
  const returnTo = readOAuthReturnTo() || "/chat";
  const url = new URL(returnTo, window.location.origin);

  if (authError) {
    url.searchParams.set("auth_error", authError);
  } else {
    url.searchParams.delete("auth_error");
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export default function AuthCallbackPage() {
  useEffect(() => {
    async function completeOAuth() {
      const hashParams = readHashParams();
      const error = hashParams.get("error");
      const accessToken = hashParams.get("access_token");

      if (error) {
        clearAccessToken();
        const target = buildReturnUrl(error);
        clearOAuthReturnTo();
        window.location.replace(target);
        return;
      }

      if (!accessToken) {
        clearAccessToken();
        const target = buildReturnUrl("missing_access_token");
        clearOAuthReturnTo();
        window.location.replace(target);
        return;
      }

      try {
        saveAccessToken(accessToken);
        const user = await fetchCurrentUser(accessToken);
        saveAuthUserEmail(user.email);
        if (user.id) {
          saveAuthUserId(user.id);
        }
        const target = buildReturnUrl();
        clearOAuthReturnTo();
        window.location.replace(target);
      } catch {
        clearAccessToken();
        const target = buildReturnUrl("token_validation_failed");
        clearOAuthReturnTo();
        window.location.replace(target);
      }
    }

    void completeOAuth();
  }, []);

  return null;
}

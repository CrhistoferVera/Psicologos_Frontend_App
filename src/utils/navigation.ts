import type { Href, Router } from "expo-router";

export function getHomeRouteByRole(role?: string | null): Href {
  if (role === "PROFESSIONAL" || role === "ANFITRIONA") return "/(professional)";
  if (role === "USER") return "/(user)";
  return "/(public)/auth";
}

type SafeBackRouter = Pick<Router, "canGoBack" | "back" | "replace">;

export function safeBack(router: SafeBackRouter, fallback: Href) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}

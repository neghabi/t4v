"use client";

import { useEffect } from "react";

export function ProtectedPageGuard({
  kind,
}: {
  kind: "user" | "admin";
}) {
  useEffect(() => {
    let active = true;
    const endpoint = kind === "user" ? "/api/auth/me" : "/api/dashboard/me";

    async function verify() {
      try {
        const response = await fetch(endpoint, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = (await response.json()) as {
          user?: unknown;
          authenticated?: boolean;
        };
        const authenticated =
          kind === "user" ? Boolean(data.user) : data.authenticated === true;
        if (active && !authenticated) {
          window.location.replace("/");
        }
      } catch {
        if (active) window.location.replace("/");
      }
    }

    function onPageShow() {
      void verify();
    }

    void verify();
    window.addEventListener("pageshow", onPageShow);
    return () => {
      active = false;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [kind]);

  return null;
}

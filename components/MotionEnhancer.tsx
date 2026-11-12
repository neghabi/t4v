"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function MotionEnhancer() {
  const pathname = usePathname();
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "true");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -25px 0px" },
    );
    const elements = document.querySelectorAll(
      "main > section, .feature-item, .editorial-visual",
    );
    elements.forEach((element, index) => {
      if (element.getBoundingClientRect().top >= window.innerHeight - 30) {
        element.setAttribute("data-reveal", "");
        (element as HTMLElement).style.setProperty(
          "--reveal-delay",
          `${Math.min(index % 3, 2) * 65}ms`,
        );
        observer.observe(element);
      }
    });
    return () => {
      observer.disconnect();
      elements.forEach((e) => {
        e.removeAttribute("data-reveal");
        e.removeAttribute("data-revealed");
      });
    };
  }, [pathname]);
  return null;
}

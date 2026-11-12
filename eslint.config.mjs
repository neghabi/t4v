import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["app/layout.tsx"],
    rules: { "@next/next/no-page-custom-font": "off" },
  },
  {
    files: ["app/s/**/page.tsx", "app/dashboard/page.tsx", "app/admin/page.tsx"],
    rules: {
      "react-hooks/purity": "off",
    },
  },
  {
    files: [
      "components/ThemeToggle.tsx",
      "components/UserNav.tsx",
      "components/LinkStudio.tsx",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "generated/**",
    ".local/**",
  ]),
]);

export default eslintConfig;

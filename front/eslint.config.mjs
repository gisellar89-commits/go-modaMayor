import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    rules: {
      // Temporal: permitir `any` en el repo para acelerar la compilación. Dejar esto solo hasta
      // que se puedan corregir los tipos de forma incremental.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;

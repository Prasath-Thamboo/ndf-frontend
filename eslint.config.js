import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "tailwind.config.js", "postcss.config.cjs"]),
  { files: ["**/*.{js,mjs,cjs,jsx}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  { files: ["vite.config.js", "eslint.config.js"], languageOptions: { globals: globals.node } },
  pluginReact.configs.flat.recommended,
  // React 17+ : plus besoin d'importer React pour le JSX
  pluginReact.configs.flat["jsx-runtime"],
  {
    settings: { react: { version: "detect" } },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // projet sans PropTypes ni TypeScript
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
    },
  },
]);

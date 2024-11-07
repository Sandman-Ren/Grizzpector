import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
    {files: ["**/*.{js,mjs,cjs,ts}"]},
    {languageOptions: {globals: globals.browser}},
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            semi: ["error", "always"],
            curly: ["error", "all"],
            "no-unused-vars": ["warn"],
            "no-unused-expressions": ["warn"],
            "no-unused-labels": ["warn"],
        }
    },
];
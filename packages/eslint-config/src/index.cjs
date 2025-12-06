module.exports = {
    env: { browser: true, node: true, es2022: true },
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "import"],
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:import/recommended",
      "plugin:import/typescript"
    ],
    rules: { "import/order": ["warn", { "newlines-between": "always", "alphabetize": { "order": "asc" } }] }
  };
  
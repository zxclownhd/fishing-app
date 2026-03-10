const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/env.setup.js", "./tests/setup.js"],
  },
});